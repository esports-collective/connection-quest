import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { STAFF_APP_URL } from "@/lib/constants";
import { CATEGORY_META } from "@/lib/gamification";
import { WEEKDAYS, weekdayLong, formatTimeRange } from "@/lib/schedule";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import { Card, Pill } from "@/components/ui";
import type { Quest, ScheduleSession, SessionQuest } from "@/lib/types";

export const dynamic = "force-dynamic";

type QuestLite = Pick<
  Quest,
  "id" | "title" | "category" | "difficulty" | "xp" | "est_minutes"
>;

export default async function SchedulePage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "participant") redirect(STAFF_APP_URL);

  const supabase = await createClient();

  // Sessions for this participant (RLS already scopes to them).
  const { data: sessionsData } = await supabase
    .from("schedule_sessions")
    .select("*")
    .eq("is_active", true)
    .order("weekday")
    .order("starts_at");
  const sessions = (sessionsData as ScheduleSession[]) ?? [];

  // Quests attached to those sessions, plus the quest details, in two small
  // follow-up queries (kept simple rather than relying on nested embedding).
  const sessionIds = sessions.map((s) => s.id);
  let links: SessionQuest[] = [];
  if (sessionIds.length) {
    const { data } = await supabase
      .from("session_quests")
      .select("*")
      .in("session_id", sessionIds);
    links = (data as SessionQuest[]) ?? [];
  }

  const questIds = [...new Set(links.map((l) => l.quest_id))];
  const questById = new Map<string, QuestLite>();
  if (questIds.length) {
    const { data } = await supabase
      .from("quests")
      .select("id,title,category,difficulty,xp,est_minutes")
      .in("id", questIds);
    for (const q of (data as QuestLite[]) ?? []) questById.set(q.id, q);
  }

  const linksBySession = new Map<string, SessionQuest[]>();
  for (const l of links) {
    const arr = linksBySession.get(l.session_id) ?? [];
    arr.push(l);
    linksBySession.set(l.session_id, arr);
  }

  // Group sessions under their weekday, in Mon→Sun order.
  const days = WEEKDAYS.map((d) => ({
    ...d,
    sessions: sessions.filter((s) => s.weekday === d.iso),
  })).filter((d) => d.sessions.length > 0);

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
          <span className="kicker kicker-on-dark">Your week</span>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">
            My Schedule
          </h1>
          <p className="mt-2 max-w-md text-white/75">
            The sessions your support team has set up for you — and the quests
            planned for them.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {days.length === 0 ? (
          <Card>
            <p className="font-semibold text-[var(--brand-purple-deep)]">
              No sessions yet
            </p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Your support team sets up your sessions. In the meantime, you can
              pick any quest and do it your own way.
            </p>
            <Link
              href="/library"
              className="mt-3 inline-block text-sm font-semibold text-[var(--brand-purple)] hover:underline"
            >
              Explore the quest library →
            </Link>
          </Card>
        ) : (
          <div className="space-y-7">
            {days.map((day) => (
              <section key={day.iso}>
                <h2 className="mb-3 font-display text-xl font-extrabold text-white">
                  {weekdayLong(day.iso)}
                </h2>
                <div className="space-y-3">
                  {day.sessions.map((s) => {
                    const questLinks = linksBySession.get(s.id) ?? [];
                    return (
                      <Card key={s.id}>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-lg font-bold text-[var(--brand-purple-deep)]">
                            {formatTimeRange(s.starts_at, s.ends_at)}
                          </span>
                          {s.has_support ? (
                            <Pill color="#0f97a4">🤝 Support worker</Pill>
                          ) : (
                            <Pill>On your own</Pill>
                          )}
                          {s.label && <Pill>{s.label}</Pill>}
                        </div>

                        {questLinks.length > 0 ? (
                          <ul className="mt-3 space-y-2">
                            {questLinks.map((l) => {
                              const q = questById.get(l.quest_id);
                              if (!q) return null;
                              const meta = CATEGORY_META[q.category] ?? {
                                emoji: "✨",
                                color: "#3a1d6e",
                              };
                              return (
                                <li key={l.id}>
                                  <Link
                                    href={`/quest/${q.id}`}
                                    className="flex items-center gap-3 rounded-2xl bg-[var(--brand-purple-soft)] px-3 py-2 transition hover:brightness-95"
                                  >
                                    <span className="text-xl">{meta.emoji}</span>
                                    <span className="min-w-0 flex-1 font-semibold text-[var(--brand-purple-deep)]">
                                      {q.title}
                                    </span>
                                    {l.recurrence === "weekly" ? (
                                      <Pill color="#6c3fc5">Weekly</Pill>
                                    ) : (
                                      <Pill color="#c07c14">Once</Pill>
                                    )}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="mt-3 text-sm text-[var(--ink-soft)]">
                            No quests planned yet — you can pick any quest from
                            the library when you get here.
                          </p>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Independent-quests reminder */}
        <div className="cyan-callout mt-8 px-4 py-3 text-sm font-medium">
          💡 Quests aren&apos;t just for sessions. You can pick any quest and do
          it your own way, anytime —{" "}
          <Link href="/library" className="font-bold underline">
            browse the library
          </Link>
          .
        </div>
      </main>
      <Footer />
    </>
  );
}
