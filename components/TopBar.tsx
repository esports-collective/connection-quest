"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
    <header className="sticky top-0 z-20 border-b border-[var(--brand-cyan)]/25 text-white shadow-lg shadow-[var(--brand-purple-deep)]/20">
      {/* Row 1 — logo + participant name (deep purple band) */}
      <div className="bg-[var(--brand-purple-deep)]">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link href="/" className="flex items-center">
            <Image
              src="/side-quests-logo.png"
              alt="Side Quests"
              width={250}
              height={202}
              priority
              className="h-12 w-auto object-contain"
            />
          </Link>
          <span className="h-7 w-px bg-white/20" />
          <span className="font-display text-xl font-extrabold tracking-tight text-white">
            {displayName}
          </span>
        </div>
      </div>

      {/* Row 2 — navigation + sign out (brand purple band) */}
      <div className="bg-[var(--brand-purple)]">
        <nav className="mx-auto flex max-w-2xl items-center gap-1 px-4 py-2">
          {nav.map((n) => {
            const active =
              n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  active
                    ? "bg-[var(--brand-cyan)] text-[var(--brand-purple-deep)]"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
          <button
            onClick={signOut}
            className="ml-auto rounded-full border border-white/25 px-3 py-1.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
