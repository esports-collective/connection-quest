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
  const meta = CATEGORY_META[quest.category] ?? { emoji: "✨", color: "#5a2da8" };
  return (
    <Link
      href={`/quest/${quest.id}`}
      className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div
        className="flex items-center gap-3 px-5 pt-5"
        style={{ color: meta.color }}
      >
        <span className="text-3xl">{meta.emoji}</span>
        <Pill color={meta.color}>{quest.category}</Pill>
        {quest.style === "open" && <Pill color="#10bccb">Adaptive</Pill>}
        {quest.style === "suggestion" && <Pill color="#10bccb">Suggestion</Pill>}
      </div>
      <div className="flex flex-1 flex-col px-5 pb-5 pt-3">
        <h3 className="font-display text-lg font-bold leading-snug text-[var(--brand-purple-deep)]">
          {quest.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-[var(--ink-soft)]">
          {quest.description}
        </p>
        {reason && (
          <p className="mt-3 rounded-xl bg-[var(--brand-cyan-soft)] px-3 py-2 text-sm font-medium text-[#0a6b74]">
            💡 {reason}
          </p>
        )}
        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[var(--ink-soft)]">
          <span className="rounded-full bg-[var(--brand-purple-soft)] px-2.5 py-1 text-[var(--brand-purple-deep)]">
            {DIFFICULTY_LABEL[quest.difficulty]}
          </span>
          {quest.est_minutes && <span>⏱ {quest.est_minutes} min</span>}
          <span className="ml-auto text-[var(--brand-purple)]">
            {xpRange(quest.xp).min}–{xpRange(quest.xp).max} XP
          </span>
        </div>
      </div>
    </Link>
  );
}
