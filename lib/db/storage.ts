// Tiny typed LocalStorage layer. Every repository reads/writes through here so
// that phase 2 can replace the repository bodies with `ky` calls and delete
// this file without touching the rest of the app.

const PREFIX = "nava:"

export const KEYS = {
  users: "users",
  artists: "artists",
  albums: "albums",
  tracks: "tracks",
  playlists: "playlists",
  notifications: "notifications",
  tickets: "tickets",
  verifications: "verifications",
  accounting: "accounting",
  prices: "prices",
  streams: "streams",
  recents: "recents",
  credentials: "credentials",
  seeded: "seeded",
  sessionUserId: "session-user-id",
} as const

export type CollectionKey = (typeof KEYS)[keyof typeof KEYS]

function isBrowser() {
  return typeof window !== "undefined"
}

export function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function write<T>(key: string, value: T): void {
  if (!isBrowser()) return
  window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
}

export function remove(key: string): void {
  if (!isBrowser()) return
  window.localStorage.removeItem(PREFIX + key)
}

export function readList<T>(key: string): T[] {
  return read<T[]>(key, [])
}

export function writeList<T>(key: string, list: T[]): void {
  write(key, list)
}

let counter = 0
export function uid(prefix = "id"): string {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`
}

/** Simulate async latency so query hooks behave like real network calls. */
export function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}
