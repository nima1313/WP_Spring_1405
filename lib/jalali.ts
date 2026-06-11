import jalaali from "jalaali-js"

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"

function toPersianDigits(n: number, pad = 2): string {
  return String(n)
    .padStart(pad, "0")
    .replace(/\d/g, (c) => PERSIAN_DIGITS[+c])
}

function normalisePersianDigits(str: string): string {
  return str.replace(/[۰-۹]/g, (c) => String(PERSIAN_DIGITS.indexOf(c)))
}

/**
 * Converts a Gregorian date string (YYYY-MM-DD) or ISO timestamp to a
 * Persian-numeral Jalali display string, e.g. "۱۴۰۳/۰۲/۱۵".
 * Returns "" for empty/null input and the original string for anything
 * that cannot be parsed (e.g. "—").
 */
export function toJalali(gregorianStr: string | null | undefined): string {
  if (!gregorianStr) return ""
  const datePart = gregorianStr.slice(0, 10)
  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return gregorianStr
  const [, y, m, d] = match.map(Number)
  try {
    const { jy, jm, jd } = jalaali.toJalaali(y, m, d)
    return `${toPersianDigits(jy, 4)}/${toPersianDigits(jm)}/${toPersianDigits(jd)}`
  } catch {
    return gregorianStr
  }
}

/**
 * Converts a Jalali date string entered by the user to a Gregorian YYYY-MM-DD
 * string. Accepts Persian digits (۱۴۰۳/۰۲/۱۵), Latin digits (1403/02/15),
 * various separators (/ - .), or compact 8-digit form (14030215).
 * Returns "" if the input is empty or does not form a valid Jalali date.
 */
export function toJalaliMonthDay(gregorianStr: string | null | undefined): string {
  const full = toJalali(gregorianStr)
  if (!full) return ""
  const parts = full.split("/")
  return parts.length === 3 ? `${parts[1]}/${parts[2]}` : full
}

export function jalaliToGregorian(jalaliStr: string): string {
  if (!jalaliStr) return ""
  const normalised = normalisePersianDigits(jalaliStr)
  const match = normalised.match(/^(\d{4})[\/\-.]?(\d{2})[\/\-.]?(\d{2})$/)
  if (!match) return ""
  const [, jy, jm, jd] = match.map(Number)
  if (!jalaali.isValidJalaaliDate(jy, jm, jd)) return ""
  try {
    const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd)
    return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`
  } catch {
    return ""
  }
}

export function isValidJalali(str: string): boolean {
  return jalaliToGregorian(str) !== ""
}
