import { HTTPError } from "ky"

import { api, call } from "@/lib/api/client"
import type { Playlist } from "@/lib/types"

export async function listPlaylistsByOwner(
  ownerId: string
): Promise<Playlist[]> {
  return call(() =>
    api.get("playlists", { searchParams: { owner: ownerId } }).json<Playlist[]>()
  )
}

export async function getPlaylist(id: string): Promise<Playlist | null> {
  try {
    return await api.get(`playlists/${id}`).json<Playlist>()
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 404) return null
    throw error
  }
}

export async function createPlaylist(
  _ownerId: string,
  name: string
): Promise<Playlist> {
  // Over the tier cap the backend answers 403 {code: "playlist_limit"}, which
  // `call` surfaces as an ApiError the dialog can branch on.
  return call(() => api.post("playlists", { json: { name } }).json<Playlist>())
}

export async function renamePlaylist(
  id: string,
  name: string
): Promise<Playlist> {
  return call(() => api.patch(`playlists/${id}`, { json: { name } }).json<Playlist>())
}

export async function deletePlaylist(id: string): Promise<void> {
  await call(() => api.delete(`playlists/${id}`).text())
}

export async function addTrackToPlaylist(
  playlistId: string,
  trackId: string
): Promise<Playlist> {
  return call(() =>
    api.put(`playlists/${playlistId}/tracks/${trackId}`).json<Playlist>()
  )
}

export async function removeTrackFromPlaylist(
  playlistId: string,
  trackId: string
): Promise<Playlist> {
  return call(() =>
    api.delete(`playlists/${playlistId}/tracks/${trackId}`).json<Playlist>()
  )
}
