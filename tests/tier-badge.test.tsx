import { describe, expect, it } from "vitest"
import { screen } from "@testing-library/react"

import { TierBadge } from "@/components/common/tier-badge"
import { renderWithI18n } from "./utils"

describe("TierBadge", () => {
  it("labels the gold tier in Persian", () => {
    renderWithI18n(<TierBadge tier="gold" />)
    expect(screen.getByText("طلایی")).toBeInTheDocument()
  })

  it("labels the basic and silver tiers", () => {
    const { rerender } = renderWithI18n(<TierBadge tier="basic" />)
    expect(screen.getByText("پایه")).toBeInTheDocument()
    rerender(<TierBadge tier="silver" />)
    expect(screen.getByText("نقره‌ای")).toBeInTheDocument()
  })
})
