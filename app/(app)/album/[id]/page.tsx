"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Disc3, Play } from "lucide-react"

import { CoverImage } from "@/components/common/cover-image"
import { EmptyState } from "@/components/common/empty-state"
import { TrackRow } from "@/components/music/track-row"
import { useAlbum, useArtist, useTracksByIds } from "@/lib/queries"
import { useI18n, useT } from "@/lib/i18n"
import { toJalali } from "@/lib/jalali"
import { usePlayerStore } from "@/store/player-store"

export default function AlbumPage() {
  const t = useT()
  const { locale } = useI18n()
  const params = useParams<{ id: string }>()
  const { data: album, isLoading } = useAlbum(params.id)
  const { data: artist } = useArtist(album?.artistId)
  const { data: tracks = [] } = useTracksByIds(album?.trackIds ?? [])
  const playQueue = usePlayerStore((s) => s.playQueue)

  if (!isLoading && !album) {
    return <EmptyState icon={Disc3} title={t("browse.empty")} className="mt-8" />
  }
  if (!album) return null

  return (
    <div className="space-y-8 pt-2">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end">
        <CoverImage
          seed={album.id}
          src={album.coverUrl || undefined}
          alt={album.title}
          className="size-44 shrink-0 shadow-2xl shadow-primary/20"
          rounded="rounded-3xl"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{t("browse.albums")}</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold md:text-4xl">
            {album.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {artist && (
              <Link
                href={`/artists/${artist.id}`}
                className="font-medium text-foreground hover:text-primary"
              >
                {artist.name}
              </Link>
            )}
            <span aria-hidden>·</span>
            <span>{album.genre}</span>
            <span aria-hidden>·</span>
            <span>
              {locale === "fa"
                ? toJalali(album.releaseDate).slice(0, 4)
                : new Date(album.releaseDate).getFullYear()}
            </span>
          </div>
          {tracks.length > 0 && (
            <button
              type="button"
              onClick={() => playQueue(tracks, 0)}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-primary to-fuchsia-500 px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/40 transition hover:scale-105"
            >
              <Play className="size-4 fill-current" />
              {t("player.play")}
            </button>
          )}
        </div>
      </header>

      <div className="rounded-3xl glass p-2">
        {tracks.map((track) => (
          <TrackRow key={track.id} track={track} context={tracks} />
        ))}
      </div>
    </div>
  )
}
