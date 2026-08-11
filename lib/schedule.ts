// Helpers for the weekly participant schedule. Weekdays are ISO 1=Mon..7=Sun.

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
