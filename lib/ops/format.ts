import { NOW } from "./data";

/**
 * Every formatter pins an explicit locale and time zone.
 *
 * Without that the server formats in UTC, the browser formats in the
 * visitor's zone, and every date in the ledger becomes a hydration mismatch.
 * The business runs in Toronto — its clients are Intelcom, Canpar and Rona,
 * and it writes cheques, not checks.
 */
const LOCALE = "en-CA";
const TZ = "America/Toronto";

const dayMonth = new Intl.DateTimeFormat(LOCALE, { month: "short", day: "numeric", timeZone: TZ });
const dayMonthYear = new Intl.DateTimeFormat(LOCALE, { month: "short", day: "numeric", year: "numeric", timeZone: TZ });
const weekdayLong = new Intl.DateTimeFormat(LOCALE, { weekday: "short", month: "short", day: "numeric", timeZone: TZ });
const monthYear = new Intl.DateTimeFormat(LOCALE, { month: "short", year: "numeric", timeZone: TZ });
const clock = new Intl.DateTimeFormat(LOCALE, { hour: "numeric", minute: "2-digit", timeZone: TZ });

export const formatDate = (ts: number) => dayMonth.format(ts);
export const formatDateFull = (ts: number) => dayMonthYear.format(ts);
export const formatWeekday = (ts: number) => weekdayLong.format(ts);
export const formatMonth = (ts: number) => monthYear.format(ts);
export const formatTime = (ts: number) => clock.format(ts);

const money0 = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "CAD",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
});

/**
 * Money, always with an explicit sign for negatives.
 *
 * A minus sign does the work colour cannot: it survives greyscale, printing,
 * and every form of colour blindness. Red is the reinforcement, never the
 * signal on its own.
 */
export function money(amount: number, { signed = false }: { signed?: boolean } = {}): string {
  const body = money0.format(Math.abs(amount));
  if (amount < 0) return `−${body}`;
  return signed && amount > 0 ? `+${body}` : body;
}

/** Compact form for axis labels and tight chips. */
export function moneyShort(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "−" : "";
  if (abs >= 1000) return `${sign}$${Math.round(abs / 100) / 10}k`;
  return `${sign}$${abs}`;
}

export const percent = (value: number, digits = 0) => `${value.toFixed(digits)}%`;

/**
 * Change between two periods, derived rather than transcribed.
 *
 * The live build prints "↑ 12%" above a table whose own numbers give 8.9%.
 * Computing it here means the sentence and the table cannot disagree.
 */
export function delta(current: number, previous: number): { pct: number; dir: "up" | "down" | "flat"; label: string } {
  if (previous === 0) {
    return current === 0
      ? { pct: 0, dir: "flat", label: "No activity" }
      : { pct: 100, dir: "up", label: "New this period" };
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const rounded = Math.round(pct * 10) / 10;
  if (Math.abs(rounded) < 0.5) return { pct: 0, dir: "flat", label: "Flat vs last month" };
  const dir = rounded > 0 ? "up" : "down";
  return { pct: Math.abs(rounded), dir, label: `${Math.abs(rounded)}% vs last month` };
}

/** "18 days ago" / "in 4 days" — how the payment pages talk about cycles. */
export function daysAgo(ts: number, now = NOW): string {
  const days = Math.round((now - ts) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days > 0) return `${days} days ago`;
  return `in ${Math.abs(days)} days`;
}

export function relativeTime(ts: number, now = NOW): string {
  const mins = Math.round((now - ts) / 60_000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  return daysAgo(ts, now);
}

export const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/**
 * Two-letter tile for a company.
 *
 * Company names here are single words (Precision, Intelcom), so initials of
 * words would give one letter and every tile would look alike. The first two
 * characters keep six companies distinguishable at 36px.
 */
export const monogramOf = (name: string) => name.slice(0, 2).toUpperCase();
