import { describe, expect, it } from "vitest"

import {
  canCreatePlaylist,
  canStream,
  remainingStreams,
  TIERS,
  tierConfig,
  UNLIMITED,
} from "@/lib/subscriptions"

describe("subscription tier config (Table 1)", () => {
  it("encodes the basic tier limits", () => {
    expect(TIERS.basic.streamsPerDay).toBe(60)
    expect(TIERS.basic.maxPlaylists).toBe(6)
    expect(TIERS.basic.canUploadAvatar).toBe(false)
    expect(TIERS.basic.canViewStats).toBe(false)
  })

  it("gives silver unlimited streams but capped playlists", () => {
    expect(TIERS.silver.streamsPerDay).toBe(UNLIMITED)
    expect(TIERS.silver.maxPlaylists).toBe(100)
    expect(TIERS.silver.canDownload).toBe(true)
    expect(TIERS.silver.canViewStats).toBe(false)
  })

  it("gives gold everything including stats", () => {
    expect(TIERS.gold.streamsPerDay).toBe(UNLIMITED)
    expect(TIERS.gold.maxPlaylists).toBe(UNLIMITED)
    expect(TIERS.gold.canViewStats).toBe(true)
  })

  it("tierConfig returns the matching record", () => {
    expect(tierConfig("gold")).toBe(TIERS.gold)
  })
})

describe("canCreatePlaylist", () => {
  it("blocks basic users at 6 playlists", () => {
    expect(canCreatePlaylist("basic", 5)).toBe(true)
    expect(canCreatePlaylist("basic", 6)).toBe(false)
  })

  it("blocks silver users at 100 playlists", () => {
    expect(canCreatePlaylist("silver", 99)).toBe(true)
    expect(canCreatePlaylist("silver", 100)).toBe(false)
  })

  it("never blocks gold users", () => {
    expect(canCreatePlaylist("gold", 9999)).toBe(true)
  })
})

describe("stream limits", () => {
  it("counts remaining streams for basic", () => {
    expect(remainingStreams("basic", 0)).toBe(60)
    expect(remainingStreams("basic", 60)).toBe(0)
    expect(remainingStreams("basic", 80)).toBe(0)
  })

  it("reports unlimited for silver/gold", () => {
    expect(remainingStreams("silver", 1000)).toBe(UNLIMITED)
    expect(remainingStreams("gold", 1000)).toBe(UNLIMITED)
  })

  it("blocks basic playback past the daily cap", () => {
    expect(canStream("basic", 59)).toBe(true)
    expect(canStream("basic", 60)).toBe(false)
    expect(canStream("silver", 10_000)).toBe(true)
  })
})
