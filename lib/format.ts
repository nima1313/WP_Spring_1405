import type { Locale } from "@/lib/i18n/dictionaries"

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹"

export function toFaDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[+d])
}

export function formatNumber(n: number, locale: Locale = "fa"): string {
  const formatted = new Intl.NumberFormat("en-US").format(n)
  return locale === "fa" ? toFaDigits(formatted) : formatted
}

/** Compact counts: 12.4K / 1.2M. */
export function formatCompact(n: number, locale: Locale = "fa"): string {
  let out: string
  if (n >= 1_000_000) out = `${(n / 1_000_000).toFixed(1)}M`
  else if (n >= 1_000) out = `${(n / 1_000).toFixed(1)}K`
  else out = String(n)
  return locale === "fa" ? toFaDigits(out) : out
}

export function formatPrice(
  n: number,
  currency: string,
  locale: Locale = "fa"
): string {
  return `${formatNumber(n, locale)} ${currency}`
}
