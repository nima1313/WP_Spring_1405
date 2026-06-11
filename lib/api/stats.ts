import { ensureSeeded } from "@/lib/db/seed"
import { delay, KEYS, readList, uid, writeList } from "@/lib/db/storage"
import { canStream, TIER_ORDER } from "@/lib/subscriptions"
import type {
  RecentItem,
  StreamEvent,
  Tier,
  Track,
  User,
} from "@/lib/types"

function isToday(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export async function todayStreamCount(userId: string): Promise<number> {
  ensureSeeded()
  return delay(
    readList<StreamEvent>(KEYS.streams).filter(
      (s) => s.userId === userId && isToday(s.at)
    ).length
  )
}

export class StreamLimitError extends Error {
  constructor() {
    super("daily stream limit reached")
    this.name = "StreamLimitError"
  }
}

/**
 * Records a play. Enforces the §9.2 basic-tier 60/day cap (throws
 * StreamLimitError when exceeded), bumps the track's stream counter, and adds a
 * "recently played" entry.
 */
export async function recordStream(
  userId: string,
  trackId: string,
  tier: Tier
): Promise<{ todayCount: number }> {
  ensureSeeded()
  const events = readList<StreamEvent>(KEYS.streams)
  const usedToday = events.filter(
    (s) => s.userId === userId && isToday(s.at)
  ).length
  if (!canStream(tier, usedToday)) throw new StreamLimitError()

  events.push({ id: uid("st"), userId, trackId, at: new Date().toISOString() })
  writeList(KEYS.streams, events)

  const tracks = readList<Track>(KEYS.tracks)
  const idx = tracks.findIndex((t) => t.id === trackId)
  if (idx !== -1) {
    tracks[idx] = { ...tracks[idx], streams: tracks[idx].streams + 1 }
    writeList(KEYS.tracks, tracks)
  }
  addRecent(userId, "track", trackId)
  return delay({ todayCount: usedToday + 1 })
}

export function addRecent(
  userId: string,
  kind: RecentItem["kind"],
  refId: string
): void {
  const recents = readList<RecentItem>(KEYS.recents).filter(
    (r) => !(r.userId === userId && r.kind === kind && r.refId === refId)
  )
  recents.unshift({ userId, kind, refId, at: new Date().toISOString() })
  writeList(KEYS.recents, recents.slice(0, 50))
}

export async function listRecents(userId: string): Promise<RecentItem[]> {
  ensureSeeded()
  return delay(
    readList<RecentItem>(KEYS.recents)
      .filter((r) => r.userId === userId)
      .sort((a, b) => +new Date(b.at) - +new Date(a.at))
  )
}

export interface TierDistribution {
  tier: Tier
  count: number
}

export async function userDistribution(): Promise<TierDistribution[]> {
  ensureSeeded()
  const users = readList<User>(KEYS.users).filter((u) => u.role === "listener")
  return delay(
    TIER_ORDER.map((tier) => ({
      tier,
      count: users.filter((u) => u.tier === tier).length,
    }))
  )
}

export async function monthlyRevenue(prices: {
  silver: number
  gold: number
}): Promise<number> {
  ensureSeeded()
  const users = readList<User>(KEYS.users).filter((u) => u.role === "listener")
  const silver = users.filter((u) => u.tier === "silver").length
  const gold = users.filter((u) => u.tier === "gold").length
  return delay(silver * prices.silver + gold * prices.gold)
}
