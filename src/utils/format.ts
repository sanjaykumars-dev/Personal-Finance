import type { CurrencyCode } from "@/types";

const LOCALE_BY_CURRENCY: Record<CurrencyCode, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  JPY: "ja-JP",
  AUD: "en-AU",
  CAD: "en-CA",
  SGD: "en-SG",
  AED: "en-AE",
};

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  INR: "INR (₹) Indian Rupee",
  USD: "USD ($) US Dollar",
  EUR: "EUR (€) Euro",
  GBP: "GBP (£) British Pound",
  JPY: "JPY (¥) Japanese Yen",
  AUD: "AUD (A$) Australian Dollar",
  CAD: "CAD (C$) Canadian Dollar",
  SGD: "SGD (S$) Singapore Dollar",
  AED: "AED (د.إ) UAE Dirham",
};

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(currency: CurrencyCode, compact: boolean): Intl.NumberFormat {
  const key = `${currency}:${compact}`;
  let cached = formatters.get(key);
  if (!cached) {
    cached = new Intl.NumberFormat(LOCALE_BY_CURRENCY[currency], {
      style: "currency",
      currency,
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: compact ? 1 : 0,
      minimumFractionDigits: 0,
    });
    formatters.set(key, cached);
  }
  return cached;
}

/** ₹1,24,580 (INR uses lakh grouping via the en-IN locale). Rounds to whole units. */
export function formatCurrency(amount: number, currency: CurrencyCode): string {
  return formatter(currency, false).format(Math.round(amount));
}

/** ₹1.2L / $12K, for chart axes. */
export function formatCompactCurrency(amount: number, currency: CurrencyCode): string {
  return formatter(currency, true).format(amount);
}

/** +₹67,693 / -₹8,000 */
export function formatSignedCurrency(amount: number, type: "income" | "expense", currency: CurrencyCode): string {
  return `${type === "income" ? "+" : "−"}${formatCurrency(Math.abs(amount), currency)}`;
}

export function currencySymbol(currency: CurrencyCode): string {
  const part = formatter(currency, false)
    .formatToParts(0)
    .find((p) => p.type === "currency");
  return part?.value ?? currency;
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}
