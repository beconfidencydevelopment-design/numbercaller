import { NOW } from "./data";

/**
 * All formatting pins an explicit timeZone and locale. Without that the server
 * renders in UTC, the browser renders in the visitor's zone, and every
 * timestamp in the table becomes a hydration mismatch.
 */
const TZ = "Europe/London";
const LOCALE = "en-GB";

const clock = new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });
const dayShort = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", timeZone: TZ });
const weekday = new Intl.DateTimeFormat(LOCALE, { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
const full = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });

export const formatClock = (ts: number) => clock.format(ts);
export const formatDay = (ts: number) => dayShort.format(ts);
export const formatFull = (ts: number) => full.format(ts);
export const formatWeekday = (ts: number) => weekday.format(ts);

/** "in 45m" / "1h 12m ago" — the phrasing dispatchers actually scan for. */
export function formatRelative(ts: number, now = NOW): string {
  const mins = Math.round((ts - now) / 60000);
  const abs = Math.abs(mins);
  if (abs < 1) return "just now";
  const body = abs < 60 ? `${abs}m` : abs < 1440 ? `${Math.floor(abs / 60)}h ${abs % 60}m` : `${Math.floor(abs / 1440)}d`;
  return mins < 0 ? `${body} ago` : `in ${body}`;
}

/** Signed countdown for the SLA column. Overdue reads as "-1h 12m". */
export function formatCountdown(mins: number): string {
  const abs = Math.abs(mins);
  const body = abs < 60 ? `${abs}m` : `${Math.floor(abs / 60)}h ${String(abs % 60).padStart(2, "0")}m`;
  return mins < 0 ? `−${body}` : body;
}

export const initialsOf = (name: string) =>
  name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
