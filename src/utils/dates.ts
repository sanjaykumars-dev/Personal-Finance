/** Dates are stored as local calendar strings (YYYY-MM-DD) to avoid timezone drift. */

const pad = (n: number): string => String(n).padStart(2, "0");

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** Parses YYYY-MM-DD as a local date. */
export function parseISODate(value: string): Date {
  const [y = 1970, m = 1, d = 1] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function currentMonthKey(): string {
  return monthKey(new Date());
}

export function monthKeyOf(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function shiftMonth(key: string, delta: number): string {
  const [y = 1970, m = 1] = key.split("-").map(Number);
  return monthKey(new Date(y, m - 1 + delta, 1));
}

/** Oldest first, ending with `endKey`. */
export function lastMonths(count: number, endKey = currentMonthKey()): string[] {
  return Array.from({ length: count }, (_, i) => shiftMonth(endKey, i - (count - 1)));
}

const monthLongFormat = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });
// en-US gives "Sep" rather than en-GB's "Sept".
const monthShortFormat = new Intl.DateTimeFormat("en-US", { month: "short" });
const monthNameFormat = new Intl.DateTimeFormat("en-GB", { month: "long" });

/** 02 Oct 2026 */
export function formatDate(isoDate: string): string {
  const date = parseISODate(isoDate);
  return `${pad(date.getDate())} ${monthShortFormat.format(date)} ${date.getFullYear()}`;
}

/** October 2026 */
export function formatMonth(key: string): string {
  return monthLongFormat.format(parseISODate(`${key}-01`));
}

/** Oct */
export function formatMonthShort(key: string): string {
  return monthShortFormat.format(parseISODate(`${key}-01`));
}

/** October */
export function formatMonthName(key: string): string {
  return monthNameFormat.format(parseISODate(`${key}-01`));
}

/** Whole calendar months from `from` until `to` (at least 0). */
export function monthsBetween(from: Date, to: Date): number {
  return Math.max(0, (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()));
}

export function relativeDay(isoDate: string): string {
  const today = todayISO();
  if (isoDate === today) return "Today";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (isoDate === toISODate(yesterday)) return "Yesterday";
  return formatDate(isoDate);
}
