import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import TopBar from "@/components/TopBar";
import NoteQueue, { type NoteRow } from "@/components/NoteQueue";
import { SectionTitle } from "@/components/ui";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.role === "participant") redirect("/");

  const supabase = await createClient();
  const [{ data: participantsData }, { data: notesData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, cadence")
      .eq("role", "participant")
      .order("display_name"),
    supabase
      .from("period_notes")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const participants = (
    (participantsData as Pick<Profile, "id" | "display_name" | "cadence">[]) ??
    []
  ).map((p) => ({ id: p.id, name: p.display_name, cadence: p.cadence }));

  const nameById = new Map(participants.map((p) => [p.id, p.name]));
  const notes: NoteRow[] = (notesData ?? []).map(
    (n: Record<string, unknown>) => ({
      id: n.id as string,
      participant_id: n.participant_id as string,
      participantName: nameById.get(n.participant_id as string) ?? "Participant",
      period_start: n.period_start as string,
      period_end: n.period_end as string,
      cadence: n.cadence as string,
      draft_body: n.draft_body as string,
      status: n.status as string,
    }),
  );

  return (
    <>
      <TopBar displayName={profile.display_name} role={profile.role} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <SectionTitle>Note Queue</SectionTitle>
        <p className="mb-4 -mt-2 text-sm text-[var(--ink-soft)]">
          AI drafts one note per participant per period, organised by their
          goals. Review, edit, approve.
        </p>
        <NoteQueue participants={participants} initialNotes={notes} />
      </main>
    </>
  );
}
