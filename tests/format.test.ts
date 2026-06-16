import { describe, expect, it } from "vitest"

import {
  formatCompact,
  formatDuration,
  formatNumber,
  formatPrice,
  toFaDigits,
} from "@/lib/format"

describe("formatDuration", () => {
  it("formats seconds as m:ss", () => {
    expect(formatDuration(0)).toBe("0:00")
    expect(formatDuration(5)).toBe("0:05")
    expect(formatDuration(65)).toBe("1:05")
    expect(formatDuration(605)).toBe("10:05")
  })

  it("guards against invalid input", () => {
    expect(formatDuration(-3)).toBe("0:00")
    expect(formatDuration(NaN)).toBe("0:00")
  })
})

describe("digit + number formatting", () => {
  it("converts Latin digits to Persian", () => {
    expect(toFaDigits(1234)).toBe("۱۲۳۴")
  })

  it("formats numbers per locale", () => {
    expect(formatNumber(1234, "en")).toBe("1,234")
    // fa converts the digits to Persian but keeps the grouping comma.
    expect(formatNumber(1234, "fa")).toBe("۱,۲۳۴")
  })

  it("compacts large counts", () => {
    expect(formatCompact(950, "en")).toBe("950")
    expect(formatCompact(12400, "en")).toBe("12.4K")
    expect(formatCompact(2_500_000, "en")).toBe("2.5M")
  })

  it("formats a price with currency", () => {
    expect(formatPrice(79000, "Toman", "en")).toBe("79,000 Toman")
  })
})
