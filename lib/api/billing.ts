import { api, call } from "@/lib/api/client"
import type { Prices, Tier } from "@/lib/types"

export async function getPrices(): Promise<Prices> {
  return call(() => api.get("plans").json<Prices>())
}

/**
 * §3.11.2 — the admin edits prices at runtime; the backend persists the two plan
 * rows and every price reader picks up the new values instantly, no code change.
 */
export async function updatePrices(
  silver: number,
  gold: number
): Promise<Prices> {
  return call(() => api.patch("plans", { json: { silver, gold } }).json<Prices>())
}

export type PurchasablePlan = Exclude<Tier, "basic">
export type PurchaseMonths = 1 | 3 | 6 | 12

export interface PurchaseInit {
  paymentId: string
  redirectUrl: string
}

/**
 * Starts a subscription purchase (§3.6). The server computes the amount
 * (months × price), creates a pending Payment, and hands back the gateway URL
 * the browser should redirect to (mock bank page or Zarinpal sandbox).
 */
export async function initiatePurchase(
  tier: PurchasablePlan,
  months: PurchaseMonths
): Promise<PurchaseInit> {
  return call(() =>
    api.post("payments", { json: { tier, months } }).json<PurchaseInit>()
  )
}
