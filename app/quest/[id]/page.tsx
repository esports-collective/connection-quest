import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/session";
import { STAFF_APP_URL } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_META, DIFFICULTY_LABEL, xpRange } from "@/lib/gamification";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import YesNoFlow from "@/components/YesNoFlow";
import AddToSchedule from "@/components/AddToSchedule";
import { Pill } from "@/components/ui";
import type { Quest, ScheduleSession, SessionQuest } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function QuestDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "participant") redirect(STAFF_APP_URL);

  const supabase = await createClient();
  const { data } = await supabase.from("quests").select("*").eq("id", id).single();
  const quest = data as Quest | null;
  if (!quest) notFound();

  const meta = CATEGORY_META[quest.category] ?? { emoji: "✨", color: "#3a1d6e" };

  // The participant's sessions + any existing links for this quest, so they can
  // plan the quest into their schedule (once-off or weekly).
  const { data: sessionsData } = await supabase
    .from("schedule_sessions")
    .select("id, weekday, starts_at, ends_at")
    .eq("participant_id", profile.id)
    .eq("is_active", true)
    .order("weekday")
    .order("starts_at");
  const sessions = (sessionsData as Pick<
    ScheduleSession,
    "id" | "weekday" | "starts_at" | "ends_at"
  >[]) ?? [];

  let scheduleLinks: Pick<
    SessionQuest,
    "id" | "session_id" | "recurrence" | "scheduled_date"
  >[] = [];
  if (sessions.length) {
    const { data } = await supabase
      .from("session_quests")
      .select("id, session_id, recurrence, scheduled_date")
      .eq("quest_id", quest.id)
      .in(
        "session_id",
        sessions.map((s) => s.id),
      );
    scheduleLinks = data ?? [];
  }

  return (
    <>
      <TopBar displayName={profile.display_name} role={profile.role} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Link
          href="/"
          className="mb-4 inline-block text-sm font-semibold text-[var(--brand-cyan)] hover:text-white"
        >
          ← All quests
        </Link>

        <div className="card overflow-hidden">
          <div
            className="px-6 pt-6"
            style={{ color: meta.color }}
          >
            <div className="flex items-center gap-3">
              <span className="text-4xl">{meta.emoji}</span>
              <Pill color={meta.color}>{quest.category}</Pill>
              {quest.style === "open" && <Pill color="#19d3e0">Adaptive</Pill>}
              {quest.style === "suggestion" && (
                <Pill color="#19d3e0">Suggestion</Pill>
              )}
            </div>
          </div>
          <div className="px-6 pb-6 pt-3">
            <h1 className="font-display text-3xl font-extrabold text-[var(--brand-purple-deep)]">
              {quest.title}
            </h1>
            <p className="mt-2 text-lg text-[var(--ink)]">{quest.description}</p>

            {quest.style === "suggestion" && (
              <p className="cyan-callout mt-3 px-3 py-2 text-sm font-medium">
                💡 Just a suggestion — do it however you like. There&apos;s no
                right way.
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-2 text-sm font-semibold text-[var(--ink-soft)]">
              <span className="rounded-full bg-[var(--brand-purple-soft)] px-3 py-1 text-[var(--brand-purple-deep)]">
                {DIFFICULTY_LABEL[quest.difficulty]}
              </span>
              {quest.est_minutes && (
                <span className="rounded-full bg-[var(--brand-purple-soft)] px-3 py-1 text-[var(--brand-purple-deep)]">
                  ⏱ {quest.est_minutes} min
                </span>
              )}
              {quest.location && (
                <span className="rounded-full bg-[var(--brand-purple-soft)] px-3 py-1 text-[var(--brand-purple-deep)]">
                  📍 {quest.location}
                </span>
              )}
              <span className="rounded-full bg-[var(--brand-cyan-soft)] px-3 py-1 text-[var(--brand-cyan-ink)]">
                {xpRange(quest.xp).min}–{xpRange(quest.xp).max} XP
              </span>
            </div>

            {quest.style !== "suggestion" && quest.steps.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                  How to do it
                </p>
                <ol className="mt-2 space-y-2">
                  {quest.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand-purple)] text-sm font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="pt-0.5 text-[var(--ink)]">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {quest.capacities.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                  What this builds
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {quest.capacities.map((c) => (
                    <Pill key={c}>{c}</Pill>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {sessions.length > 0 && (
          <div className="mt-6">
            <AddToSchedule
              questId={quest.id}
              sessions={sessions}
              initialLinks={scheduleLinks}
            />
          </div>
        )}

        <div className="mt-6">
          <YesNoFlow
            questId={quest.id}
            title={quest.title}
            xp={quest.xp}
            questions={quest.yn_questions}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
