import { HTTPError } from "ky"

import { api, call } from "@/lib/api/client"
import type { RecentItem, Tier } from "@/lib/types"

export async function todayStreamCount(_userId: string): Promise<number> {
  const { count } = await call(() =>
    api.get("me/streams/today").json<{ count: number }>()
  )
  return count
}

export class StreamLimitError extends Error {
  constructor() {
    super("daily stream limit reached")
    this.name = "StreamLimitError"
  }
}

/**
 * Records a play. The §9.2 basic-tier 60/day cap is enforced server-side; a 429
 * with {code:"stream_limit"} is translated back into StreamLimitError so the
 * player (audio-engine.tsx) keeps its existing catch untouched. The `tier`
 * argument is ignored now that the server derives it from the session.
 */
export async function recordStream(
  _userId: string,
  trackId: string,
  _tier: Tier
): Promise<{ todayCount: number }> {
  try {
    return await api
      .post("streams", { json: { trackId } })
      .json<{ todayCount: number }>()
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 429) {
      throw new StreamLimitError()
    }
    throw error
  }
}

/** Records a "recently played" entry (e.g. when a playlist is opened). */
export async function addRecent(
  _userId: string,
  kind: RecentItem["kind"],
  refId: string
): Promise<void> {
  await call(() => api.post("me/recents", { json: { kind, refId } }).text())
}

export async function listRecents(_userId: string): Promise<RecentItem[]> {
  return call(() => api.get("me/recents").json<RecentItem[]>())
}

export interface TierDistribution {
  tier: Tier
  count: number
}

export async function userDistribution(): Promise<TierDistribution[]> {
  return call(() =>
    api.get("stats/user-distribution").json<TierDistribution[]>()
  )
}

export async function monthlyRevenue(_prices?: {
  silver: number
  gold: number
}): Promise<number> {
  // The backend computes revenue from live tier counts × current prices.
  const { revenue } = await call(() =>
    api.get("stats/monthly-revenue").json<{ revenue: number }>()
  )
  return revenue
}
