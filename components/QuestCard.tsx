import Link from "next/link";
import type { Quest } from "@/lib/types";
import { CATEGORY_META, DIFFICULTY_LABEL, xpRange } from "@/lib/gamification";
import { Pill } from "./ui";

export default function QuestCard({
  quest,
  reason,
}: {
  quest: Quest;
  reason?: string;
}) {
  const meta = CATEGORY_META[quest.category] ?? { emoji: "✨", color: "#3a1d6e" };
  const xp = xpRange(quest.xp);
  return (
    <Link
      href={`/quest/${quest.id}`}
      className="card group relative flex flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:ring-2 hover:ring-[var(--brand-cyan)]"
    >
      {/* Category accent bar */}
      <span
        aria-hidden
        className="block h-1.5 w-full"
        style={{ background: meta.color }}
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl"
            style={{ background: `${meta.color}1a` }}
          >
            {meta.emoji}
          </span>
          <div className="flex flex-wrap gap-1.5">
            <Pill color={meta.color}>{quest.category}</Pill>
            {quest.style === "open" && <Pill color="#19d3e0">Adaptive</Pill>}
            {quest.style === "suggestion" && (
              <Pill color="#19d3e0">Suggestion</Pill>
            )}
          </div>
        </div>

        <h3 className="mt-3 font-display text-lg font-bold leading-snug text-[var(--brand-purple-deep)]">
          {quest.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-[var(--ink-soft)]">
          {quest.description}
        </p>

        {reason && (
          <p className="cyan-callout mt-3 px-3 py-2 text-sm font-medium">
            💡 {reason}
          </p>
        )}

        <div className="mt-4 flex items-center gap-2 border-t border-black/5 pt-3 text-xs font-semibold text-[var(--ink-soft)]">
          <span className="rounded-full bg-[var(--brand-purple-soft)] px-2.5 py-1 text-[var(--brand-purple-deep)]">
            {DIFFICULTY_LABEL[quest.difficulty]}
          </span>
          {quest.est_minutes && <span>⏱ {quest.est_minutes} min</span>}
          <span className="ml-auto rounded-full bg-[var(--brand-cyan-soft)] px-2.5 py-1 font-bold text-[var(--brand-cyan-ink)]">
            {xp.min}–{xp.max} XP
          </span>
        </div>
      </div>
    </Link>
  );
}
