import { describe, expect, it } from "vitest"

import { isValidJalali, jalaliToGregorian, toJalali } from "@/lib/jalali"

describe("jalali date conversion", () => {
  it("converts a known Gregorian date to Jalali (Persian digits)", () => {
    // 2024-05-04 → 1403/02/15
    expect(toJalali("2024-05-04")).toBe("۱۴۰۳/۰۲/۱۵")
  })

  it("returns empty string for empty input", () => {
    expect(toJalali("")).toBe("")
    expect(toJalali(null)).toBe("")
    expect(toJalali(undefined)).toBe("")
  })

  it("round-trips Gregorian → Jalali → Gregorian", () => {
    const greg = "1998-05-14"
    const jalali = toJalali(greg)
    expect(jalaliToGregorian(jalali)).toBe(greg)
  })

  it("accepts Latin digits and separators", () => {
    expect(jalaliToGregorian("1403/02/15")).toBe("2024-05-04")
    expect(jalaliToGregorian("1403-02-15")).toBe("2024-05-04")
  })

  it("validates Jalali strings", () => {
    expect(isValidJalali("1403/02/15")).toBe(true)
    expect(isValidJalali("1403/13/40")).toBe(false)
    expect(isValidJalali("not-a-date")).toBe(false)
  })
})
