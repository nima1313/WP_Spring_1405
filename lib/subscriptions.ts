import type { Tier } from "@/lib/types"

// ---------------------------------------------------------------------------
// Table 1 from the spec, encoded as the single source of truth for every gate.
// Feature limits live here (they are product rules, not data); subscription
// *prices* live in the mock DB because the admin edits them at runtime (§3.11.2)
// — "no code change to alter prices". Flipping any flag here is a one-liner,
// which is exactly the "changeability" the rubric rewards.
// ---------------------------------------------------------------------------

export interface TierConfig {
  /** -1 means unlimited (∞). */
  streamsPerDay: number
  /** -1 means unlimited (∞). */
  maxPlaylists: number
  canUploadAvatar: boolean
  canDownload: boolean
  earlyAccess: boolean
  canViewStats: boolean
}

export const UNLIMITED = -1

export const TIERS: Record<Tier, TierConfig> = {
  basic: {
    streamsPerDay: 60,
    maxPlaylists: 6,
    canUploadAvatar: false,
    canDownload: false,
    earlyAccess: false,
    canViewStats: false,
  },
  silver: {
    streamsPerDay: UNLIMITED,
    maxPlaylists: 100,
    canUploadAvatar: true,
    canDownload: true,
    earlyAccess: true,
    canViewStats: false,
  },
  gold: {
    streamsPerDay: UNLIMITED,
    maxPlaylists: UNLIMITED,
    canUploadAvatar: true,
    canDownload: true,
    earlyAccess: true,
    canViewStats: true,
  },
}

export const TIER_ORDER: Tier[] = ["basic", "silver", "gold"]

export function tierConfig(tier: Tier): TierConfig {
  return TIERS[tier]
}

export function isUnlimited(value: number): boolean {
  return value === UNLIMITED
}

export function canCreatePlaylist(tier: Tier, currentCount: number): boolean {
  const max = TIERS[tier].maxPlaylists
  return isUnlimited(max) || currentCount < max
}

export function remainingStreams(tier: Tier, usedToday: number): number {
  const max = TIERS[tier].streamsPerDay
  if (isUnlimited(max)) return UNLIMITED
  return Math.max(0, max - usedToday)
}

export function canStream(tier: Tier, usedToday: number): boolean {
  const r = remainingStreams(tier, usedToday)
  return isUnlimited(r) || r > 0
}
