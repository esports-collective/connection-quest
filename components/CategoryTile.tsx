import Link from "next/link";
import { CATEGORY_META } from "@/lib/gamification";

export default function CategoryTile({
  category,
  count,
}: {
  category: string;
  count: number;
}) {
  const meta = CATEGORY_META[category] ?? { emoji: "✨", color: "#3a1d6e" };
  return (
    <Link
      href={`/library?category=${encodeURIComponent(category)}`}
      className="group relative flex min-h-[132px] flex-col justify-between overflow-hidden rounded-[var(--radius)] p-5 text-white shadow-lg shadow-black/25 transition duration-200 hover:-translate-y-1 hover:ring-2 hover:ring-[var(--brand-cyan)]"
      style={{
        background: `linear-gradient(150deg, ${meta.color} 0%, ${meta.color}cc 60%, ${meta.color}99 100%)`,
      }}
    >
      {/* Chevron watermark */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-3 -top-4 font-display text-7xl font-black leading-none text-white/15 transition group-hover:text-white/25"
      >
        ›
      </span>
      <span className="text-4xl">{meta.emoji}</span>
      <div className="relative">
        <h3 className="text-xl font-bold leading-tight">{category}</h3>
        <p className="text-sm text-white/85">
          {count} quest{count === 1 ? "" : "s"}
        </p>
      </div>
    </Link>
  );
}
