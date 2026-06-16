import { describe, expect, it } from "vitest"

import {
  canAccessDashboard,
  canAccessStudio,
  canManageSubscriptions,
  canSettlePayments,
  dashboardSectionsForRole,
  isAdmin,
  isStaff,
} from "@/lib/auth/permissions"

describe("role permissions", () => {
  it("identifies staff roles", () => {
    expect(isStaff("support")).toBe(true)
    expect(isStaff("admin")).toBe(true)
    expect(isStaff("listener")).toBe(false)
    expect(isStaff(undefined)).toBe(false)
  })

  it("restricts admin-only abilities", () => {
    expect(isAdmin("admin")).toBe(true)
    expect(isAdmin("support")).toBe(false)
    expect(canManageSubscriptions("admin")).toBe(true)
    expect(canManageSubscriptions("support")).toBe(false)
    expect(canSettlePayments("admin")).toBe(true)
    expect(canSettlePayments("support")).toBe(false)
  })

  it("gates dashboard and studio access", () => {
    expect(canAccessDashboard("support")).toBe(true)
    expect(canAccessDashboard("listener")).toBe(false)
    expect(canAccessStudio("artist")).toBe(true)
    expect(canAccessStudio("listener")).toBe(false)
  })

  it("shows support only tickets + verifications", () => {
    const sections = dashboardSectionsForRole("support").map((s) => s.href)
    expect(sections).toContain("/dashboard/tickets")
    expect(sections).toContain("/dashboard/verifications")
    expect(sections).not.toContain("/dashboard/accounting")
    expect(sections).not.toContain("/dashboard/subscriptions")
  })

  it("shows admin all dashboard sections", () => {
    const sections = dashboardSectionsForRole("admin").map((s) => s.href)
    expect(sections).toContain("/dashboard/accounting")
    expect(sections).toContain("/dashboard/subscriptions")
  })
})
