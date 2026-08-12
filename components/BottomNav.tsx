"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The five participant destinations, with an emoji glyph each. Mirrors the
// desktop nav in TopBar; kept here so the bottom bar can carry its own icons.
const tabs = [
  { href: "/", label: "Quests", icon: "🎯" },
  { href: "/schedule", label: "Schedule", icon: "🗓️" },
  { href: "/library", label: "Library", icon: "🧭" },
  { href: "/me", label: "Progress", icon: "📈" },
  { href: "/log", label: "Log", icon: "✍️" },
];

/**
 * Phone navigation: a fixed bottom tab bar, one tap from anywhere and reachable
 * one-handed. Shown below `sm` only; the desktop two-band nav in TopBar takes
 * over at wider widths, where the row of links fits comfortably.
 */
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[var(--brand-purple-deep)] sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-2xl grid-cols-5">
        {tabs.map((t) => {
          const active =
            t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 px-1 py-2 transition ${
                  active ? "text-[var(--brand-cyan)]" : "text-white/60"
                }`}
                style={{ minHeight: "56px" }}
              >
                <span aria-hidden className="text-xl leading-none">
                  {t.icon}
                </span>
                <span className="label-caps text-[0.62rem] leading-none tracking-[0.04em]">
                  {t.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
