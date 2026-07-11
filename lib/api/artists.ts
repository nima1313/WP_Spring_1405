import { HTTPError } from "ky"

import { api, call } from "@/lib/api/client"
import type { Artist } from "@/lib/types"

export async function listArtists(): Promise<Artist[]> {
  return call(() => api.get("artists").json<Artist[]>())
}

export async function getArtist(id: string): Promise<Artist | null> {
  try {
    return await api.get(`artists/${id}`).json<Artist>()
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 404) return null
    throw error
  }
}

export async function getArtistsByIds(ids: string[]): Promise<Artist[]> {
  if (ids.length === 0) return []
  const artists = await call(() =>
    api.get("artists", { searchParams: { ids: ids.join(",") } }).json<Artist[]>()
  )
  const byId = new Map(artists.map((a) => [a.id, a]))
  return ids.map((id) => byId.get(id)).filter(Boolean) as Artist[]
}

export async function updateArtist(
  id: string,
  patch: Partial<Artist>
): Promise<Artist> {
  return call(() => api.patch(`artists/${id}`, { json: patch }).json<Artist>())
}
