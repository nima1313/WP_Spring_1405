import { ensureSeeded } from "@/lib/db/seed"
import { delay, KEYS, readList, writeList } from "@/lib/db/storage"
import type { Artist } from "@/lib/types"

function db(): Artist[] {
  ensureSeeded()
  return readList<Artist>(KEYS.artists)
}

export async function listArtists(): Promise<Artist[]> {
  return delay(db())
}

export async function getArtist(id: string): Promise<Artist | null> {
  return delay(db().find((a) => a.id === id) ?? null)
}

export async function getArtistsByIds(ids: string[]): Promise<Artist[]> {
  const all = db()
  return delay(ids.map((id) => all.find((a) => a.id === id)).filter(Boolean) as Artist[])
}

export async function updateArtist(
  id: string,
  patch: Partial<Artist>
): Promise<Artist> {
  const artists = db()
  const idx = artists.findIndex((a) => a.id === id)
  if (idx === -1) throw new Error("هنرمند یافت نشد.")
  artists[idx] = { ...artists[idx], ...patch, id }
  writeList(KEYS.artists, artists)
  return delay(artists[idx])
}
