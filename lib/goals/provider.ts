import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { astaltyEnabled, fetchAstaltyGoals } from "@/lib/astalty/client";
import type { Goal } from "@/lib/types";

/**
 * Goals come from Astalty. When the Astalty API is configured and the
 * participant has an astalty_id, we pull their goals live and refresh the
 * `participant_goals` cache (upsert — preserves goal ids so historical
 * completion→goal mappings stay intact). We then read back from the cache so
 * downstream code always has real rows with stable ids.
 *
 * If Astalty isn't configured, the pull fails, or there's no astalty_id, we
 * simply return whatever is already cached — so the app never breaks.
 */
export async function getParticipantGoals(
  participantId: string,
): Promise<Goal[]> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("astalty_id")
    .eq("id", participantId)
    .single();
  const astaltyId = profile?.astalty_id as string | null | undefined;

  if (astaltyEnabled() && astaltyId) {
    try {
      const fetched = await fetchAstaltyGoals(astaltyId);
      const admin = createAdminClient();
      if (fetched.length && admin) {
        await admin.from("participant_goals").upsert(
          fetched.map((g) => ({
            participant_id: participantId,
            name: g.name,
            source: "astalty" as const,
            astalty_goal_id: g.astalty_goal_id,
          })),
          { onConflict: "participant_id,astalty_goal_id" },
        );
      }
    } catch {
      // Best-effort — fall back to the cached goals below.
    }
  }

  const { data } = await supabase
    .from("participant_goals")
    .select("*")
    .eq("participant_id", participantId)
    .order("created_at", { ascending: true });
  return (data as Goal[]) ?? [];
}
