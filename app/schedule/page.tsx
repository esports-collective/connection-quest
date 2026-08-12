import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { STAFF_APP_URL } from "@/lib/constants";
import { CATEGORY_META } from "@/lib/gamification";
import {
  WEEKDAYS,
  weekdayLong,
  formatTimeRange,
  streamMix,
  formatHours,
  STREAM_LABELS,
  STREAM_COLOR,
} from "@/lib/schedule";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import { Card, Pill } from "@/components/ui";
import type { Quest, Session, SessionQuest } from "@/lib/types";

export const dynamic = "force-dynamic";

type QuestLite = Pick<
  Quest,
  "id" | "title" | "category" | "difficulty" | "xp" | "est_minutes"
>;

// A session-customers row with its catalogue session embedded.
type AssignedRow = { session: Session | null };

export default async function SchedulePage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "participant") redirect(STAFF_APP_URL);

  const supabase = await createClient();

  // The NDIS sessions staff have assigned this participant, from the shared
  // catalogue. RLS (session_customers_select_own) already scopes this to them.
  const { data: assignedData } = await supabase
    .from("session_customers")
    .select(
      "session:sessions(id,name,weekday,starts_at,ends_at,has_support,ratio,stream,is_active)",
    );
  const sessions = ((assignedData as AssignedRow[] | null) ?? [])
    .map((r) => r.session)
    .filter((s): s is Session => !!s && s.is_active)
    .sort((a, b) => a.weekday - b.weekday || a.starts_at.localeCompare(b.starts_at));

  // Quests this participant has attached to those sessions, plus quest details.
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

  // Weekly quests always show; once-off quests only until their date passes.
  const today = new Date().toISOString().slice(0, 10);
  const linksBySession = new Map<string, SessionQuest[]>();
  for (const l of links) {
    if (l.recurrence === "once" && l.scheduled_date && l.scheduled_date < today) {
      continue;
    }
    const arr = linksBySession.get(l.session_id) ?? [];
    arr.push(l);
    linksBySession.set(l.session_id, arr);
  }

  // Weekly totals + the Gaming vs Skill development split — the same figures the
  // support team sees on this participant's NDIS profile in the staff app.
  const mix = streamMix(sessions);

  // Group sessions under their weekday, in Mon→Sun order.
  const days = WEEKDAYS.map((d) => ({
    ...d,
    sessions: sessions.filter((s) => s.weekday === d.iso),
  })).filter((d) => d.sessions.length > 0);

  return (
    <>
      <TopBar displayName={profile.display_name} role={profile.role} />

      {/* Hero */}
      <div className="relative overflow-hidden bg-[var(--brand-purple)] text-white">
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
            The NDIS sessions your support team has you in — and the quests
            you&apos;ve planned for them.
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
            {/* Weekly hours + stream mix — mirrors the staff-app NDIS profile. */}
            <Card>
              <div className="flex items-baseline justify-between gap-3">
                <span className="kicker">Total hours / week</span>
                <span className="font-display text-3xl font-black text-[var(--brand-purple-deep)]">
                  {formatHours(mix.totalHours)}
                </span>
              </div>
              <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-[var(--brand-purple-soft)]">
                <span
                  style={{
                    width: `${mix.gamingPct}%`,
                    backgroundColor: STREAM_COLOR.gaming,
                  }}
                  aria-hidden
                />
                <span
                  style={{
                    width: `${mix.skillPct}%`,
                    backgroundColor: STREAM_COLOR.skill_development,
                  }}
                  aria-hidden
                />
              </div>
              <div className="mt-3 grid gap-1.5 text-sm">
                {(["gaming", "skill_development"] as const).map((stream) => (
                  <div
                    key={stream}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="flex items-center gap-2 font-semibold text-[var(--brand-purple-deep)]">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: STREAM_COLOR[stream] }}
                        aria-hidden
                      />
                      {STREAM_LABELS[stream]}
                    </span>
                    <span className="text-[var(--ink-soft)]">
                      {stream === "gaming" ? mix.gamingPct : mix.skillPct}% ·{" "}
                      {formatHours(
                        stream === "gaming" ? mix.gamingHours : mix.skillHours,
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {days.map((day) => (
              <section key={day.iso}>
                <h2 className="mb-3 font-display text-xl font-extrabold text-[var(--brand-purple-deep)]">
                  {weekdayLong(day.iso)}
                </h2>
                <div className="space-y-3">
                  {day.sessions.map((s) => {
                    const questLinks = linksBySession.get(s.id) ?? [];
                    return (
                      <Card key={s.id}>
                        <div className="flex items-start gap-3">
                          <span
                            className="mt-1.5 inline-block h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: STREAM_COLOR[s.stream] }}
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-display text-lg font-bold leading-tight text-[var(--brand-purple-deep)]">
                              {s.name}
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-[var(--ink-soft)]">
                              {formatTimeRange(s.starts_at, s.ends_at)}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {s.has_support ? (
                                <Pill color="#0f97a4">🤝 Support worker</Pill>
                              ) : (
                                <Pill>On your own</Pill>
                              )}
                              {s.ratio && <Pill>{s.ratio}</Pill>}
                            </div>
                          </div>
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
                                      <Pill color="#c07c14">
                                        {l.scheduled_date
                                          ? `Once · ${new Date(
                                              l.scheduled_date + "T00:00:00",
                                            ).toLocaleDateString(undefined, {
                                              day: "numeric",
                                              month: "short",
                                            })}`
                                          : "Once"}
                                      </Pill>
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
