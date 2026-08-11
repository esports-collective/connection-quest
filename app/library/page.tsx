import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { STAFF_APP_URL } from "@/lib/constants";
import { CATEGORIES } from "@/lib/gamification";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import QuestCard from "@/components/QuestCard";
import CategoryTile from "@/components/CategoryTile";
import { SectionTitle } from "@/components/ui";
import type { Quest } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "participant") redirect(STAFF_APP_URL);

  const { category } = await searchParams;

  const supabase = await createClient();
  const { data } = await supabase
    .from("quests")
    .select("*")
    .eq("is_active", true)
    .order("code");
  const quests = (data as Quest[]) ?? [];

  const countByCategory = new Map<string, number>();
  for (const q of quests) {
    countByCategory.set(q.category, (countByCategory.get(q.category) ?? 0) + 1);
  }
  const categories = CATEGORIES.filter((c) => (countByCategory.get(c) ?? 0) > 0);

  const selected =
    category && categories.includes(category as (typeof CATEGORIES)[number])
      ? category
      : null;
  const inCategory = selected
    ? quests.filter((q) => q.category === selected)
    : [];

  return (
    <>
      <TopBar displayName={profile.display_name} role={profile.role} />

      {/* Hero */}
      <div className="brand-gradient relative overflow-hidden text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[var(--brand-cyan)]/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-2xl px-4 py-7">
          <span className="kicker kicker-on-dark">Quest Library</span>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">
            {selected ?? "Browse every quest"}
          </h1>
          <p className="mt-2 max-w-md text-white/75">
            {selected
              ? `Quests to build ${selected.toLowerCase()}. Pick one to get started.`
              : "Pick a category to explore the quests inside it."}
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {!selected ? (
          <>
            <SectionTitle kicker="Choose a category">Categories</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              {categories.map((cat) => (
                <CategoryTile
                  key={cat}
                  category={cat}
                  count={countByCategory.get(cat) ?? 0}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <Link
              href="/library"
              className="mb-4 inline-block text-sm font-semibold text-[var(--brand-cyan)] hover:text-white"
            >
              ← All categories
            </Link>

            {/* Quick category switcher */}
            <div className="mb-5 flex flex-wrap gap-2">
              {categories.map((cat) => {
                const active = cat === selected;
                return (
                  <Link
                    key={cat}
                    href={`/library?category=${encodeURIComponent(cat)}`}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                      active
                        ? "bg-[var(--brand-cyan)] text-[var(--brand-purple-deep)]"
                        : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    {cat}
                  </Link>
                );
              })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {inCategory.map((q) => (
                <QuestCard key={q.id} quest={q} />
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
