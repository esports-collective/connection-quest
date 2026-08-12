"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "./BottomNav";
import type { Role } from "@/lib/types";

// This is the participant app (quests.esportscollective.com.au). Staff and
// admin navigation lives in the separate staff app.
const nav = [
  { href: "/", label: "Quests" },
  { href: "/schedule", label: "Schedule" },
  { href: "/library", label: "Library" },
  { href: "/me", label: "Progress" },
  { href: "/log", label: "Log" },
];

export default function TopBar({
  displayName,
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
    <>
      <header className="sticky top-0 z-20 border-b border-[var(--brand-cyan)]/25 text-white shadow-lg shadow-[var(--brand-purple-deep)]/20">
        {/* Row 1 — logo + participant name (deep purple band). On phones this is
            the only top bar; the destinations live in the bottom tab bar. */}
        <div className="bg-[var(--brand-purple-deep)]">
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
            <Link href="/" className="flex items-center">
              <Image
                src="/side-quests-logo.png"
                alt="Side Quests"
                width={250}
                height={202}
                priority
                className="h-11 w-auto object-contain sm:h-12"
              />
            </Link>
            <span className="h-7 w-px bg-white/20" />
            <span className="min-w-0 flex-1 truncate font-display text-lg font-extrabold tracking-tight text-white sm:text-xl">
              {displayName}
            </span>
            {/* Sign out lives up here on phones (the nav row is hidden); on
                desktop it moves into the nav row below. */}
            <button
              onClick={signOut}
              className="label-caps shrink-0 rounded-full border-2 border-white/25 px-3 py-1.5 text-xs text-white/80 transition hover:border-[var(--brand-cyan)] hover:text-white sm:hidden"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Row 2 — navigation + sign out (deep purple band). Active page marked
            by a cyan underline, following app.esportscollective.com.au. Hidden
            on phones, where the bottom tab bar takes over. */}
        <div className="hidden bg-[var(--brand-purple-deep)] sm:block">
          <nav className="mx-auto flex max-w-2xl items-center gap-1 px-4">
            {nav.map((n) => {
              const active =
                n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex items-center px-3 pb-2.5 pt-2 text-[0.98rem] font-semibold tracking-[0.01em] transition ${
                    active ? "text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  {n.label}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-[var(--brand-cyan)]"
                    />
                  )}
                </Link>
              );
            })}
            <button
              onClick={signOut}
              className="label-caps ml-auto my-1.5 rounded-full border-2 border-white/25 px-4 py-1.5 text-xs text-white/80 transition hover:border-[var(--brand-cyan)] hover:text-white"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <BottomNav />
    </>
  );
}
