import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getParticipantGoals } from "@/lib/goals/provider";
import { recommendQuests } from "@/lib/ai/jobs";
import { STAFF_APP_URL } from "@/lib/constants";
import { levelInfo, computeStreak } from "@/lib/gamification";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import QuestCard from "@/components/QuestCard";
import { ProgressBar, SectionTitle } from "@/components/ui";
import type { Quest, Completion } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "participant") redirect(STAFF_APP_URL);

  const supabase = await createClient();
  const [{ data: questsData }, { data: completionsData }] = await Promise.all([
    supabase.from("quests").select("*").eq("is_active", true).order("code"),
    supabase
      .from("completions")
      .select("*")
      .eq("participant_id", profile.id)
      .order("completed_at", { ascending: false }),
  ]);
  const quests = (questsData as Quest[]) ?? [];
  const completions = (completionsData as Completion[]) ?? [];
  const goals = await getParticipantGoals(profile.id);

  const totalXp = completions.reduce((s, c) => s + c.xp_awarded, 0);
  const info = levelInfo(totalXp);
  const streak = computeStreak(completions.map((c) => c.completed_at));

  const recentQuestIds = completions
    .map((c) => c.quest_id)
    .filter((id): id is string => !!id);
  const { recs } = await recommendQuests({
    profile,
    goals,
    quests,
    recentQuestIds,
  });
  const questById = new Map(quests.map((q) => [q.id, q]));
  const recCards = recs
    .map((r) => ({ quest: questById.get(r.questId), reason: r.reason }))
    .filter((x): x is { quest: Quest; reason: string } => !!x.quest);

  const firstName = profile.display_name.split(" ")[0];

  return (
    <>
      <TopBar displayName={profile.display_name} role={profile.role} />

      {/* Hero */}
      <div className="relative overflow-hidden bg-[var(--brand-purple)] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[var(--brand-cyan)]/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-2xl px-4 py-7">
          <p className="font-display text-2xl font-extrabold tracking-tight text-[var(--brand-cyan)]">
            Hi {firstName} <span className="align-middle">👋</span>
          </p>
          <div className="mt-3 flex items-end justify-between">
            <h1 className="font-display text-4xl font-extrabold tracking-tight">
              Level {info.level}
            </h1>
            <div className="text-right text-sm text-white/80">
              <div className="text-xl font-extrabold text-white">
                {totalXp} XP
              </div>
              {streak > 0 && <div>🔥 {streak}-day streak</div>}
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar pct={info.pct} onDark />
            <p className="mt-1.5 text-xs text-white/70">
              {info.nextLevelAt !== null
                ? `${info.nextLevelAt - totalXp} XP to Level ${info.level + 1}`
                : "Max level — legend!"}
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* Recommendations */}
        <section className="mb-8">
          <SectionTitle kicker="Picked for you">Quests for you</SectionTitle>
          <p className="mb-4 -mt-2 text-sm text-[var(--ink-soft)]">
            Picked for you — but the whole library is yours to explore.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {recCards.map(({ quest, reason }) => (
              <QuestCard key={quest.id} quest={quest} reason={reason} />
            ))}
          </div>
        </section>

        {/* Explore the full library */}
        <section>
          <Link
            href="/library"
            className="card group flex items-center gap-4 p-5 transition duration-200 hover:-translate-y-1 hover:ring-2 hover:ring-[var(--brand-cyan)]"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-purple-soft)] text-3xl">
              🧭
            </span>
            <div className="min-w-0 flex-1">
              <p className="kicker">Quest library</p>
              <h3 className="mt-1 font-display text-lg font-bold text-[var(--brand-purple-deep)]">
                Explore all {quests.length} quests
              </h3>
              <p className="text-sm text-[var(--ink-soft)]">
                Browse by category and find your next adventure.
              </p>
            </div>
            <span className="font-display text-2xl font-black text-[var(--brand-purple)] transition group-hover:translate-x-1">
              ›
            </span>
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
