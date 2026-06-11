import type { Role } from "@/lib/types"

// Centralised role gating so the spec's "no access above your level" rule lives
// in exactly one place (mirrored server-side in phase 2).

export function isStaff(role: Role | undefined): boolean {
  return role === "support" || role === "admin"
}

export function isAdmin(role: Role | undefined): boolean {
  return role === "admin"
}

export function canAccessDashboard(role: Role | undefined): boolean {
  return isStaff(role)
}

/** §3.11.2 — subscriptions & advanced settings are admin-only. */
export function canManageSubscriptions(role: Role | undefined): boolean {
  return isAdmin(role)
}

/** §2.11.2 — the settlement button may be restricted to the admin. */
export function canSettlePayments(role: Role | undefined): boolean {
  return isAdmin(role)
}

export function canAccessStudio(role: Role | undefined): boolean {
  return role === "artist"
}

export interface NavItem {
  href: string
  labelKey: string
  icon: string
}

export function dashboardSectionsForRole(role: Role | undefined): NavItem[] {
  const base: NavItem[] = [
    { href: "/dashboard/verifications", labelKey: "dash.verifications", icon: "badge-check" },
    { href: "/dashboard/tickets", labelKey: "dash.tickets", icon: "ticket" },
  ]
  if (isAdmin(role)) {
    base.push(
      { href: "/dashboard/accounting", labelKey: "dash.accounting", icon: "receipt" },
      { href: "/dashboard/subscriptions", labelKey: "dash.subscriptions", icon: "gem" }
    )
  }
  return base
}
