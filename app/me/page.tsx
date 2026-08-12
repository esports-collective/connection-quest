import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getParticipantGoals } from "@/lib/goals/provider";
import {
  levelInfo,
  computeStreak,
  computeBadges,
  CATEGORY_META,
} from "@/lib/gamification";
import { STAFF_APP_URL } from "@/lib/constants";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import { ProgressBar, SectionTitle, Card } from "@/components/ui";
import type { CompletionWithQuest } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "participant") redirect(STAFF_APP_URL);

  const supabase = await createClient();
  const { data } = await supabase
    .from("completions")
    .select(
      "*, quest:quests(title,category,capacities,skills_built,difficulty), completion_goals(goal_id)",
    )
    .eq("participant_id", profile.id)
    .order("completed_at", { ascending: false });
  const completions = (data as (CompletionWithQuest & {
    completion_goals: { goal_id: string }[];
  })[]) ?? [];
  const goals = await getParticipantGoals(profile.id);

  const totalXp = completions.reduce((s, c) => s + c.xp_awarded, 0);
  const info = levelInfo(totalXp);
  const streak = computeStreak(completions.map((c) => c.completed_at));
  const badges = computeBadges(completions);

  const goalCounts = new Map<string, number>();
  for (const c of completions) {
    for (const cg of c.completion_goals ?? []) {
      goalCounts.set(cg.goal_id, (goalCounts.get(cg.goal_id) ?? 0) + 1);
    }
  }

  return (
    <>
      <TopBar displayName={profile.display_name} role={profile.role} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* Level card */}
        <Card className="mb-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-[var(--ink-soft)]">
                {profile.display_name}
              </p>
              <h1 className="font-display text-3xl font-extrabold text-[var(--brand-purple-deep)]">
                Level {info.level}
              </h1>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[var(--brand-purple)]">
                {totalXp} XP
              </div>
              <div className="text-sm text-[var(--ink-soft)]">
                {completions.length} quests · {streak > 0 ? `🔥 ${streak}d` : "no streak"}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar pct={info.pct} />
            <p className="mt-1 text-xs text-[var(--ink-soft)]">
              {info.nextLevelAt !== null
                ? `${info.nextLevelAt - totalXp} XP to Level ${info.level + 1}`
                : "Max level!"}
            </p>
          </div>
        </Card>

        {/* Badges */}
        <section className="mb-8">
          <SectionTitle kicker="Achievements">Badges</SectionTitle>
          <div className="grid grid-cols-4 gap-3">
            {badges.map((b) => (
              <div
                key={b.key}
                title={b.hint}
                className={`flex flex-col items-center rounded-2xl p-3 text-center ${
                  b.earned
                    ? "bg-white shadow-sm"
                    : "bg-black/5 opacity-60 grayscale"
                }`}
              >
                <span className="text-3xl">{b.emoji}</span>
                <span
                  className={`mt-1 text-[11px] font-semibold leading-tight ${
                    b.earned
                      ? "text-[var(--brand-purple-deep)]"
                      : "text-[var(--ink-soft)]"
                  }`}
                >
                  {b.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Goals progress */}
        {goals.length > 0 && (
          <section className="mb-8">
            <SectionTitle kicker="What you're working towards">My goals</SectionTitle>
            <div className="space-y-3">
              {goals.map((g) => {
                const n = goalCounts.get(g.id) ?? 0;
                return (
                  <Card key={g.id}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-[var(--brand-purple-deep)]">
                        {g.name}
                      </p>
                      <span className="shrink-0 rounded-full bg-[var(--brand-cyan-soft)] px-3 py-1 text-sm font-bold text-[var(--brand-cyan-ink)]">
                        {n} quest{n === 1 ? "" : "s"}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* History */}
        <section>
          <SectionTitle kicker="Everything you've done">Quest history</SectionTitle>
          {completions.length === 0 ? (
            <Card>
              <p className="text-[var(--ink-soft)]">
                No quests yet — pick one from the Quests page to get started!
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {completions.map((c) => {
                const meta = c.quest
                  ? CATEGORY_META[c.quest.category]
                  : undefined;
                return (
                  <div
                    key={c.id}
                    className="card flex items-center gap-3 p-4"
                  >
                    <span className="text-2xl">{meta?.emoji ?? "📝"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[var(--brand-purple-deep)]">
                        {c.quest?.title ?? c.free_form_title}
                      </p>
                      <p className="text-xs text-[var(--ink-soft)]">
                        {new Date(c.completed_at).toLocaleDateString()} ·{" "}
                        {c.chosen ? "self-chosen" : "suggested"}
                        {c.duration_minutes ? ` · ${c.duration_minutes} min` : ""}
                        {c.sw_present ? " · SW present" : ""}
                      </p>
                      {c.feedback && (
                        <p className="mt-1 text-xs italic text-[var(--ink-soft)]">
                          “{c.feedback}”
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-sm font-bold text-[var(--brand-purple)]">
                      +{c.xp_awarded}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
