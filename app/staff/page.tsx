import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { levelInfo } from "@/lib/gamification";
import TopBar from "@/components/TopBar";
import StaffLogger from "@/components/StaffLogger";
import { Card, SectionTitle } from "@/components/ui";
import type { Profile, Quest } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StaffFloor() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.role === "participant") redirect("/");

  const supabase = await createClient();
  const [{ data: participantsData }, { data: questsData }, { data: comps }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("role", "participant")
        .order("display_name"),
      supabase
        .from("quests")
        .select("id,title,category")
        .eq("is_active", true)
        .order("code"),
      supabase.from("completions").select("participant_id, xp_awarded, completed_at"),
    ]);

  const participants = (participantsData as Profile[]) ?? [];
  const quests = (questsData as Pick<Quest, "id" | "title" | "category">[]) ?? [];
  const completions = comps ?? [];

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const stats = new Map<string, { xp: number; total: number; month: number }>();
  for (const c of completions) {
    const s = stats.get(c.participant_id) ?? { xp: 0, total: 0, month: 0 };
    s.xp += c.xp_awarded;
    s.total += 1;
    if (new Date(c.completed_at) >= monthStart) s.month += 1;
    stats.set(c.participant_id, s);
  }

  return (
    <>
      <TopBar displayName={profile.display_name} role={profile.role} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <SectionTitle
          right={
            <Link
              href="/staff/notes"
              className="text-sm font-semibold text-[var(--brand-purple)]"
            >
              Note queue →
            </Link>
          }
        >
          The Floor
        </SectionTitle>
        <p className="mb-4 -mt-2 text-sm text-[var(--ink-soft)]">
          Everyone active today. Log a quest for anyone — it&apos;s attributed to
          you.
        </p>

        <div className="space-y-3">
          {participants.map((p) => {
            const s = stats.get(p.id) ?? { xp: 0, total: 0, month: 0 };
            const info = levelInfo(s.xp);
            return (
              <Card key={p.id}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-bold text-[var(--brand-purple-deep)]">
                      {p.display_name}
                    </p>
                    <p className="text-xs text-[var(--ink-soft)]">
                      Level {info.level} · {s.xp} XP · {s.month} this month
                    </p>
                  </div>
                </div>
                <StaffLogger
                  participantId={p.id}
                  participantName={p.display_name}
                  quests={quests}
                />
              </Card>
            );
          })}
          {participants.length === 0 && (
            <Card>
              <p className="text-[var(--ink-soft)]">No participants yet.</p>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
