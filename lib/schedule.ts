// Helpers for the weekly participant schedule. Weekdays are ISO 1=Mon..7=Sun.

import type { SessionStream } from "@/lib/types";

export const WEEKDAYS: { iso: number; short: string; long: string }[] = [
  { iso: 1, short: "Mon", long: "Monday" },
  { iso: 2, short: "Tue", long: "Tuesday" },
  { iso: 3, short: "Wed", long: "Wednesday" },
  { iso: 4, short: "Thu", long: "Thursday" },
  { iso: 5, short: "Fri", long: "Friday" },
  { iso: 6, short: "Sat", long: "Saturday" },
  { iso: 7, short: "Sun", long: "Sunday" },
];

export function weekdayLong(iso: number): string {
  return WEEKDAYS.find((d) => d.iso === iso)?.long ?? "";
}

/** "15:00:00" → "3:00pm"; a whole-hour time drops the ":00". */
export function formatTime(hhmmss: string): string {
  const [hStr, mStr] = hhmmss.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12}${period}` : `${hour12}:${mStr}${period}`;
}

/** "15:00:00"–"18:00:00" → "3:00pm – 6:00pm". */
export function formatTimeRange(startsAt: string, endsAt: string): string {
  return `${formatTime(startsAt)} – ${formatTime(endsAt)}`;
}

/** How the two funding streams read on screen — same words as the staff app. */
export const STREAM_LABELS: Record<SessionStream, string> = {
  gaming: "Gaming",
  skill_development: "Skill development",
};

/**
 * The brand colour each stream is drawn in, shared by the mix bar and the
 * per-session dots. Gaming = violet, skill development = cyan, matching the
 * staff app's NDIS view.
 */
export const STREAM_COLOR: Record<SessionStream, string> = {
  gaming: "var(--brand-violet)",
  skill_development: "var(--brand-cyan)",
};

/** Hours between two stored `time` values ("15:00:00"), as a number. */
export function sessionHours(startsAt: string, endsAt: string): number {
  const mins = (t: string): number => {
    const m = /^(\d{1,2}):(\d{2})/.exec(t);
    return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
  };
  return Math.max(0, mins(endsAt) - mins(startsAt)) / 60;
}

/** "15 h", "1 h 45 m", "45 m" — how the hub says it. */
export function formatHours(hours: number): string {
  const whole = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(whole / 60);
  const m = whole % 60;
  if (h === 0) return `${m} m`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} m`;
}

/** Weekly totals + the Gaming vs Skill development split, by hours. */
export function streamMix(
  sessions: { starts_at: string; ends_at: string; stream: SessionStream }[],
): {
  totalHours: number;
  gamingHours: number;
  skillHours: number;
  gamingPct: number;
  skillPct: number;
} {
  let gaming = 0;
  let total = 0;
  for (const s of sessions) {
    const h = sessionHours(s.starts_at, s.ends_at);
    total += h;
    if (s.stream === "gaming") gaming += h;
  }
  const gamingPct = total > 0 ? Math.round((gaming / total) * 100) : 0;
  return {
    totalHours: total,
    gamingHours: gaming,
    skillHours: total - gaming,
    gamingPct,
    skillPct: total > 0 ? 100 - gamingPct : 0,
  };
}
