import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getParticipantGoals } from "@/lib/goals/provider";
import { recommendQuests } from "@/lib/ai/jobs";
import { levelInfo, computeStreak, CATEGORIES } from "@/lib/gamification";
import TopBar from "@/components/TopBar";
import QuestCard from "@/components/QuestCard";
import { ProgressBar, SectionTitle } from "@/components/ui";
import type { Quest, Completion } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "participant") redirect("/staff");

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
      <div className="bg-gradient-to-b from-[var(--brand-purple)] to-[var(--brand-purple-deep)] text-white">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <p className="text-white/80">Hi {firstName} 👋</p>
          <div className="mt-1 flex items-end justify-between">
            <h1 className="font-display text-3xl font-extrabold">
              Level {info.level}
            </h1>
            <div className="text-right text-sm text-white/80">
              <div className="text-lg font-bold text-white">{totalXp} XP</div>
              {streak > 0 && <div>🔥 {streak}-day streak</div>}
            </div>
          </div>
          <div className="mt-3">
            <ProgressBar pct={info.pct} />
            <p className="mt-1 text-xs text-white/70">
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
          <SectionTitle>Quests for you</SectionTitle>
          <p className="mb-4 -mt-2 text-sm text-[var(--ink-soft)]">
            Picked for you — but the whole library is yours to explore.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {recCards.map(({ quest, reason }) => (
              <QuestCard key={quest.id} quest={quest} reason={reason} />
            ))}
          </div>
        </section>

        {/* Browse all by category */}
        <section>
          <SectionTitle>All quests</SectionTitle>
          <div className="space-y-8">
            {CATEGORIES.map((cat) => {
              const inCat = quests.filter((q) => q.category === cat);
              if (inCat.length === 0) return null;
              return (
                <div key={cat}>
                  <h3 className="mb-3 font-display text-lg font-bold text-[var(--brand-purple-deep)]">
                    {cat}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {inCat.map((q) => (
                      <QuestCard key={q.id} quest={q} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
