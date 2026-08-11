import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_META, DIFFICULTY_LABEL } from "@/lib/gamification";
import TopBar from "@/components/TopBar";
import QuestAuthor from "@/components/QuestAuthor";
import { SectionTitle, Pill } from "@/components/ui";
import type { Quest } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminQuests() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.role === "participant") redirect("/");

  const supabase = await createClient();
  const { data } = await supabase
    .from("quests")
    .select("*")
    .order("created_at", { ascending: false });
  const quests = (data as Quest[]) ?? [];

  return (
    <>
      <TopBar displayName={profile.display_name} role={profile.role} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <SectionTitle>Quest Library</SectionTitle>
        <p className="mb-4 -mt-2 text-sm text-[var(--ink-soft)]">
          {quests.length} quests. Anyone on the team can add more — AI does the
          heavy lifting.
        </p>

        <div className="mb-8">
          <QuestAuthor />
        </div>

        <div className="space-y-2">
          {quests.map((q) => {
            const meta = CATEGORY_META[q.category] ?? {
              emoji: "✨",
              color: "#5a2da8",
            };
            return (
              <div key={q.id} className="card flex items-center gap-3 p-4">
                <span className="text-2xl">{meta.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[var(--brand-purple-deep)]">
                    {q.title}
                  </p>
                  <p className="text-xs text-[var(--ink-soft)]">
                    {q.category} · {DIFFICULTY_LABEL[q.difficulty]} · +{q.xp} XP
                  </p>
                </div>
                {!q.is_active && <Pill color="#d64545">Hidden</Pill>}
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
