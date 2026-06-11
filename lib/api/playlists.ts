import { ensureSeeded } from "@/lib/db/seed"
import { delay, KEYS, readList, uid, writeList } from "@/lib/db/storage"
import type { Playlist } from "@/lib/types"

function db(): Playlist[] {
  ensureSeeded()
  return readList<Playlist>(KEYS.playlists)
}

export async function listPlaylistsByOwner(
  ownerId: string
): Promise<Playlist[]> {
  return delay(db().filter((p) => p.ownerId === ownerId))
}

export async function getPlaylist(id: string): Promise<Playlist | null> {
  return delay(db().find((p) => p.id === id) ?? null)
}

export async function createPlaylist(
  ownerId: string,
  name: string
): Promise<Playlist> {
  const playlists = db()
  const now = new Date().toISOString()
  const playlist: Playlist = {
    id: uid("pl"),
    name,
    ownerId,
    trackIds: [],
    createdAt: now,
    updatedAt: now,
  }
  writeList(KEYS.playlists, [...playlists, playlist])
  return delay(playlist)
}

export async function renamePlaylist(
  id: string,
  name: string
): Promise<Playlist> {
  const playlists = db()
  const idx = playlists.findIndex((p) => p.id === id)
  if (idx === -1) throw new Error("پلی‌لیست یافت نشد.")
  playlists[idx] = {
    ...playlists[idx],
    name,
    updatedAt: new Date().toISOString(),
  }
  writeList(KEYS.playlists, playlists)
  return delay(playlists[idx])
}

export async function deletePlaylist(id: string): Promise<void> {
  writeList(
    KEYS.playlists,
    db().filter((p) => p.id !== id)
  )
  return delay(undefined)
}

export async function addTrackToPlaylist(
  playlistId: string,
  trackId: string
): Promise<Playlist> {
  const playlists = db()
  const idx = playlists.findIndex((p) => p.id === playlistId)
  if (idx === -1) throw new Error("پلی‌لیست یافت نشد.")
  if (!playlists[idx].trackIds.includes(trackId)) {
    playlists[idx] = {
      ...playlists[idx],
      trackIds: [...playlists[idx].trackIds, trackId],
      updatedAt: new Date().toISOString(),
    }
    writeList(KEYS.playlists, playlists)
  }
  return delay(playlists[idx])
}

export async function removeTrackFromPlaylist(
  playlistId: string,
  trackId: string
): Promise<Playlist> {
  const playlists = db()
  const idx = playlists.findIndex((p) => p.id === playlistId)
  if (idx === -1) throw new Error("پلی‌لیست یافت نشد.")
  playlists[idx] = {
    ...playlists[idx],
    trackIds: playlists[idx].trackIds.filter((t) => t !== trackId),
    updatedAt: new Date().toISOString(),
  }
  writeList(KEYS.playlists, playlists)
  return delay(playlists[idx])
}
