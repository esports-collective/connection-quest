import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/session";
import { STAFF_APP_URL } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_META, DIFFICULTY_LABEL, xpRange } from "@/lib/gamification";
import TopBar from "@/components/TopBar";
import YesNoFlow from "@/components/YesNoFlow";
import { Pill } from "@/components/ui";
import type { Quest } from "@/lib/types";

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

  const meta = CATEGORY_META[quest.category] ?? { emoji: "✨", color: "#5a2da8" };

  return (
    <>
      <TopBar displayName={profile.display_name} role={profile.role} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Link
          href="/"
          className="mb-4 inline-block text-sm font-semibold text-[var(--brand-purple)]"
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
              {quest.style === "open" && <Pill color="#10bccb">Adaptive</Pill>}
              {quest.style === "suggestion" && (
                <Pill color="#10bccb">Suggestion</Pill>
              )}
            </div>
          </div>
          <div className="px-6 pb-6 pt-3">
            <h1 className="font-display text-3xl font-extrabold text-[var(--brand-purple-deep)]">
              {quest.title}
            </h1>
            <p className="mt-2 text-lg text-[var(--ink)]">{quest.description}</p>

            {quest.style === "suggestion" && (
              <p className="mt-3 rounded-xl bg-[var(--brand-cyan-soft)] px-3 py-2 text-sm font-medium text-[#0a6b74]">
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
              <span className="rounded-full bg-[var(--brand-cyan-soft)] px-3 py-1 text-[#0a6b74]">
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

        <div className="mt-6">
          <YesNoFlow
            questId={quest.id}
            title={quest.title}
            xp={quest.xp}
            questions={quest.yn_questions}
          />
        </div>
      </main>
    </>
  );
}
