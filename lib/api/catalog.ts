import { HTTPError } from "ky"

import { api, call } from "@/lib/api/client"
import type { Album, ReleaseType, Track } from "@/lib/types"

function orderByIds<T extends { id: string }>(items: T[], ids: string[]): T[] {
  const byId = new Map(items.map((it) => [it.id, it]))
  return ids.map((id) => byId.get(id)).filter(Boolean) as T[]
}

export async function listTracks(): Promise<Track[]> {
  return call(() => api.get("tracks").json<Track[]>())
}

export async function listAlbums(): Promise<Album[]> {
  return call(() => api.get("albums").json<Album[]>())
}

export async function getTrack(id: string): Promise<Track | null> {
  try {
    return await api.get(`tracks/${id}`).json<Track>()
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 404) return null
    throw error
  }
}

export async function getTracksByIds(ids: string[]): Promise<Track[]> {
  if (ids.length === 0) return []
  const tracks = await call(() =>
    api.get("tracks", { searchParams: { ids: ids.join(",") } }).json<Track[]>()
  )
  // Preserve the requested order (playlists/albums are ordered lists of ids).
  return orderByIds(tracks, ids)
}

export async function getAlbum(id: string): Promise<Album | null> {
  try {
    return await api.get(`albums/${id}`).json<Album>()
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 404) return null
    throw error
  }
}

export async function getAlbumsByArtist(artistId: string): Promise<Album[]> {
  return call(() =>
    api.get("albums", { searchParams: { artist: artistId } }).json<Album[]>()
  )
}

export async function getTracksByArtist(artistId: string): Promise<Track[]> {
  return call(() =>
    api.get("tracks", { searchParams: { artist: artistId } }).json<Track[]>()
  )
}

export async function getSinglesByArtist(artistId: string): Promise<Track[]> {
  return call(() =>
    api
      .get("tracks", { searchParams: { artist: artistId, type: "single" } })
      .json<Track[]>()
  )
}

export interface BrowseQuery {
  q?: string
  sort?: "listeners" | "date"
  // Kept for signature compatibility; the backend joins artist names itself.
  artistNames?: Record<string, string>
}

export type SortKey = "listeners" | "date"

/**
 * Browse archive (§8.2): the backend searches by track OR artist name and sorts
 * by listener count / release date, returning the joined result directly.
 */
export async function browse(query: BrowseQuery): Promise<{
  albums: Album[]
  singles: Track[]
}> {
  const searchParams: Record<string, string> = {}
  if (query.q?.trim()) searchParams.q = query.q.trim()
  if (query.sort) searchParams.sort = query.sort
  return call(() =>
    api.get("browse", { searchParams }).json<{ albums: Album[]; singles: Track[] }>()
  )
}

// ---- Recommendations (bonus §5.2) -----------------------------------------

export async function getRecommendations(): Promise<Track[]> {
  return call(() => api.get("me/recommendations").json<Track[]>())
}

// ---- Studio (artist works management, §10.2) ------------------------------

export interface PublishInput {
  title: string
  artistId: string
  type: ReleaseType
  genre: string
  year: number
  lyrics?: string
  featuredArtistIds?: string[]
  audioUrl: string
  coverUrl?: string
  // Phase 2: real uploads. When present these are sent as multipart files and
  // stored server-side; the *Url fields remain as a fallback (bundled demo audio).
  audioFile?: File
  coverFile?: File
}

export async function publishWork(input: PublishInput): Promise<Track> {
  const form = new FormData()
  form.append("title", input.title)
  form.append("type", input.type)
  form.append("genre", input.genre)
  if (input.lyrics) form.append("lyrics", input.lyrics)
  if (input.featuredArtistIds?.length) {
    // The backend splits this comma-joined list (camelCase key auto-mapped).
    form.append("featuredArtistIds", input.featuredArtistIds.join(","))
  }
  if (input.audioFile) form.append("audio", input.audioFile)
  else if (input.audioUrl) form.append("sourceUrl", input.audioUrl)
  if (input.coverFile) form.append("cover", input.coverFile)

  return call(() => api.post("tracks", { body: form }).json<Track>())
}

export async function updateTrack(
  id: string,
  patch: Partial<Track>
): Promise<Track> {
  return call(() => api.patch(`tracks/${id}`, { json: patch }).json<Track>())
}

export async function deleteTrack(id: string): Promise<void> {
  await call(() => api.delete(`tracks/${id}`).text())
}

export async function deleteAlbum(id: string): Promise<void> {
  await call(() => api.delete(`albums/${id}`).text())
}

export async function addTrackToAlbum(
  albumId: string,
  trackId: string
): Promise<void> {
  await call(() =>
    api.post(`albums/${albumId}/tracks`, { json: { trackId } }).text()
  )
}
