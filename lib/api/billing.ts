import { ensureSeeded } from "@/lib/db/seed"
import { delay, KEYS, read, write } from "@/lib/db/storage"
import type { Prices } from "@/lib/types"

const FALLBACK: Prices = {
  silver: 79000,
  gold: 149000,
  currency: "تومان",
  updatedAt: new Date().toISOString(),
}

export async function getPrices(): Promise<Prices> {
  ensureSeeded()
  return delay(read<Prices>(KEYS.prices, FALLBACK))
}

/**
 * §3.11.2 — the admin edits prices at runtime; the new values take effect across
 * the whole system instantly with no code change because every price reader
 * pulls from here.
 */
export async function updatePrices(
  silver: number,
  gold: number
): Promise<Prices> {
  const next: Prices = {
    silver,
    gold,
    currency: "تومان",
    updatedAt: new Date().toISOString(),
  }
  write(KEYS.prices, next)
  return delay(next)
}
