import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import TopBar from "@/components/TopBar";
import CreateParticipant from "@/components/CreateParticipant";
import AstaltyOnboard from "@/components/AstaltyOnboard";
import { SectionTitle, Card } from "@/components/ui";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ParticipantsPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.role === "participant") redirect("/");

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, astalty_id, interests")
    .eq("role", "participant")
    .order("display_name");
  const participants =
    (data as Pick<Profile, "id" | "display_name" | "astalty_id" | "interests">[]) ??
    [];

  return (
    <>
      <TopBar displayName={profile.display_name} role={profile.role} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <SectionTitle>Participants</SectionTitle>
        <p className="mb-4 -mt-2 text-sm text-[var(--ink-soft)]">
          {participants.length} participant{participants.length === 1 ? "" : "s"}.
        </p>

        <div className="mb-6">
          <AstaltyOnboard />
        </div>

        <details className="mb-8">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--brand-purple)]">
            Or add someone manually
          </summary>
          <div className="mt-3">
            <CreateParticipant />
          </div>
        </details>

        <div className="space-y-2">
          {participants.map((p) => (
            <Card key={p.id}>
              <p className="font-semibold text-[var(--brand-purple-deep)]">
                {p.display_name}
              </p>
              <p className="text-xs text-[var(--ink-soft)]">
                {p.astalty_id ? `Astalty: ${p.astalty_id}` : "No Astalty ID"}
                {p.interests?.length ? ` · ${p.interests.join(", ")}` : ""}
              </p>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
