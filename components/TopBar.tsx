"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/types";

// This is the participant app (quests.esportscollective.com.au). Staff and
// admin navigation lives in the separate staff app.
const nav = [
  { href: "/", label: "Quests" },
  { href: "/me", label: "My Progress" },
  { href: "/log", label: "Log Activity" },
];

export default function TopBar({
  displayName,
  role,
}: {
  displayName: string;
  role: Role;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🗺️</span>
          <span className="font-display text-xl font-extrabold text-[var(--brand-purple-deep)]">
            Quests
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {nav.map((n) => {
            const active =
              n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  active
                    ? "bg-[var(--brand-purple)] text-white"
                    : "text-[var(--brand-purple-deep)] hover:bg-[var(--brand-purple-soft)]"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 pb-2 text-xs text-[var(--ink-soft)]">
        <span>
          {displayName} · {role}
        </span>
        <button onClick={signOut} className="font-semibold hover:text-[var(--brand-purple)]">
          Sign out
        </button>
      </div>
    </header>
  );
}
