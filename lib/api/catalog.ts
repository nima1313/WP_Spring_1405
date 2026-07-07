import { ensureSeeded } from "@/lib/db/seed"
import { delay, KEYS, readList, uid, writeList } from "@/lib/db/storage"
import type { Album, ReleaseType, Track } from "@/lib/types"

function tracksDb(): Track[] {
  ensureSeeded()
  return readList<Track>(KEYS.tracks)
}
function albumsDb(): Album[] {
  ensureSeeded()
  return readList<Album>(KEYS.albums)
}

export async function listTracks(): Promise<Track[]> {
  return delay(tracksDb())
}

export async function listAlbums(): Promise<Album[]> {
  return delay(albumsDb())
}

export async function getTrack(id: string): Promise<Track | null> {
  return delay(tracksDb().find((t) => t.id === id) ?? null)
}

export async function getTracksByIds(ids: string[]): Promise<Track[]> {
  const all = tracksDb()
  return delay(
    ids.map((id) => all.find((t) => t.id === id)).filter(Boolean) as Track[]
  )
}

export async function getAlbum(id: string): Promise<Album | null> {
  return delay(albumsDb().find((a) => a.id === id) ?? null)
}

export async function getAlbumsByArtist(artistId: string): Promise<Album[]> {
  return delay(albumsDb().filter((a) => a.artistId === artistId))
}

export async function getTracksByArtist(artistId: string): Promise<Track[]> {
  return delay(
    tracksDb().filter(
      (t) => t.artistId === artistId || t.featuredArtistIds.includes(artistId)
    )
  )
}

export async function getSinglesByArtist(artistId: string): Promise<Track[]> {
  return delay(
    tracksDb().filter((t) => t.artistId === artistId && t.type === "single")
  )
}

export interface BrowseQuery {
  q?: string
  sort?: "listeners" | "date"
  artistNames?: Record<string, string>
}

export type SortKey = "listeners" | "date"

function sortTracks(list: Track[], sort: SortKey): Track[] {
  return [...list].sort((a, b) =>
    sort === "listeners"
      ? b.listeners - a.listeners
      : +new Date(b.releaseDate) - +new Date(a.releaseDate)
  )
}

function sortAlbums(list: Album[], sort: SortKey, tracks: Track[]): Album[] {
  const listenersOf = (al: Album) =>
    al.trackIds.reduce(
      (sum, id) => sum + (tracks.find((t) => t.id === id)?.listeners ?? 0),
      0
    )
  return [...list].sort((a, b) =>
    sort === "listeners"
      ? listenersOf(b) - listenersOf(a)
      : +new Date(b.releaseDate) - +new Date(a.releaseDate)
  )
}

/**
 * Browse archive (§8.2): search simultaneously by track OR artist name, with
 * sort by listener count / release date. `artistNames` maps artistId→name so a
 * query can match the artist of a track/album too.
 */
export async function browse(query: BrowseQuery): Promise<{
  albums: Album[]
  singles: Track[]
}> {
  const tracks = tracksDb()
  const albums = albumsDb()
  const sort: SortKey = query.sort ?? "date"
  const q = query.q?.trim().toLowerCase() ?? ""
  const names = query.artistNames ?? {}

  const matchTrack = (t: Track) =>
    !q ||
    t.title.toLowerCase().includes(q) ||
    (names[t.artistId]?.toLowerCase().includes(q) ?? false)
  const matchAlbum = (a: Album) =>
    !q ||
    a.title.toLowerCase().includes(q) ||
    (names[a.artistId]?.toLowerCase().includes(q) ?? false)

  const singles = sortTracks(
    tracks.filter((t) => t.type === "single" && matchTrack(t)),
    sort
  )
  const filteredAlbums = sortAlbums(albums.filter(matchAlbum), sort, tracks)
  return delay({ albums: filteredAlbums, singles })
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
}

export async function publishWork(input: PublishInput): Promise<Track> {
  const tracks = tracksDb()
  const track: Track = {
    id: uid("tr"),
    title: input.title,
    artistId: input.artistId,
    featuredArtistIds: input.featuredArtistIds ?? [],
    coverUrl: input.coverUrl ?? "",
    audioUrl: input.audioUrl,
    duration: 200,
    lyrics: input.lyrics,
    genre: input.genre,
    releaseDate: new Date().toISOString(),
    type: input.type,
    listeners: 0,
    streams: 0,
    earlyAccess: true,
  }
  writeList(KEYS.tracks, [track, ...tracks])

  if (input.type === "album") {
    const albums = albumsDb()
    writeList(KEYS.albums, [
      {
        id: uid("al"),
        title: input.title,
        artistId: input.artistId,
        coverUrl: input.coverUrl ?? "",
        releaseDate: track.releaseDate,
        genre: input.genre,
        trackIds: [track.id],
      },
      ...albums,
    ])
  }
  return delay(track)
}

export async function updateTrack(
  id: string,
  patch: Partial<Track>
): Promise<Track> {
  const tracks = tracksDb()
  const idx = tracks.findIndex((t) => t.id === id)
  if (idx === -1) throw new Error("اثر یافت نشد.")
  tracks[idx] = { ...tracks[idx], ...patch, id }
  writeList(KEYS.tracks, tracks)
  return delay(tracks[idx])
}

export async function deleteTrack(id: string): Promise<void> {
  writeList(
    KEYS.tracks,
    tracksDb().filter((t) => t.id !== id)
  )
  return delay(undefined)
}
export async function deleteAlbum(id: string): Promise<void> {
  const album = albumsDb().find((a) => a.id === id)
  if (album) {
    writeList(KEYS.tracks, tracksDb().filter((t) => !album.trackIds.includes(t.id)))
  }
  writeList(KEYS.albums, albumsDb().filter((a) => a.id !== id))
  return delay(undefined)
}
