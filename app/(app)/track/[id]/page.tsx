"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { Music, Pause, Play } from "lucide-react"

import { CoverImage } from "@/components/common/cover-image"
import { EmptyState } from "@/components/common/empty-state"
import { TrackActions } from "@/components/music/track-actions"
import { useAlbum, useArtist, useTrack } from "@/lib/queries"
import { useI18n, useT } from "@/lib/i18n"
import { formatCompact, formatDuration, toFaDigits } from "@/lib/format"
import { tierConfig } from "@/lib/subscriptions"
import { useAuthStore } from "@/store/auth-store"
import { usePlayerStore } from "@/store/player-store"

export default function TrackPage() {
  const t = useT()
  const { locale } = useI18n()
  const params = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const { data: track, isLoading } = useTrack(params.id)
  const { data: artist } = useArtist(track?.artistId)
  const { data: album } = useAlbum(track?.albumId)

  const playTrack = usePlayerStore((s) => s.playTrack)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const currentId = usePlayerStore((s) => s.queue[s.currentIndex]?.id)
  const isPlaying = usePlayerStore((s) => s.isPlaying)

  if (!isLoading && !track) {
    return <EmptyState icon={Music} title={t("browse.empty")} className="mt-8" />
  }
  if (!track) return null

  const active = currentId === track.id
  const canViewStats = user ? tierConfig(user.tier).canViewStats : false
  const dur = formatDuration(track.duration)

  return (
    <div className="space-y-8 pt-2">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end">
        <CoverImage
          seed={track.id}
          src={track.coverUrl || undefined}
          alt={track.title}
          className="size-44 shrink-0 shadow-2xl shadow-primary/20"
          rounded="rounded-3xl"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{t("browse.singles")}</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold md:text-4xl">
            {track.title}
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
            {album && (
              <>
                <span aria-hidden>·</span>
                <Link href={`/album/${album.id}`} className="hover:text-foreground">
                  {album.title}
                </Link>
              </>
            )}
            <span aria-hidden>·</span>
            <span className="tabular-nums">
              {locale === "fa" ? toFaDigits(dur) : dur}
            </span>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => (active ? togglePlay() : playTrack(track))}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-primary to-fuchsia-500 px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/40 transition hover:scale-105"
            >
              {active && isPlaying ? (
                <Pause className="size-4 fill-current" />
              ) : (
                <Play className="size-4 fill-current" />
              )}
              {active && isPlaying ? t("player.pause") : t("player.play")}
            </button>
            <TrackActions track={track} />
          </div>
        </div>
      </header>

      {canViewStats && (
        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          <div className="rounded-2xl glass px-4 py-3">
            <p className="text-xs text-muted-foreground">{t("player.listeners")}</p>
            <p className="mt-1 font-display text-xl font-bold">
              {formatCompact(track.listeners, locale)}
            </p>
          </div>
          <div className="rounded-2xl glass px-4 py-3">
            <p className="text-xs text-muted-foreground">{t("player.streams")}</p>
            <p className="mt-1 font-display text-xl font-bold">
              {formatCompact(track.streams, locale)}
            </p>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">{t("player.lyrics")}</h2>
        <div className="rounded-3xl glass p-6">
          {track.lyrics ? (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-8 text-foreground/90">
              {track.lyrics}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">{t("player.noLyrics")}</p>
          )}
        </div>
      </section>
    </div>
  )
}
