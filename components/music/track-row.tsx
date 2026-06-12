"use client"

import Link from "next/link"
import { Pause, Play, X } from "lucide-react"

import { CoverImage } from "@/components/common/cover-image"
import { NowPlayingIndicator } from "@/components/player/now-playing-indicator"
import { TrackActions } from "@/components/music/track-actions"
import { useArtistMap } from "@/lib/queries"
import { useI18n } from "@/lib/i18n"
import { formatDuration, toFaDigits } from "@/lib/format"
import type { Track } from "@/lib/types"
import { cn } from "@/lib/utils"
import { usePlayerStore } from "@/store/player-store"

export function TrackRow({
  track,
  context,
  onRemove,
}: {
  track: Track
  context?: Track[]
  onRemove?: () => void
}) {
  const { locale } = useI18n()
  const artists = useArtistMap()
  const playTrack = usePlayerStore((s) => s.playTrack)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const currentId = usePlayerStore((s) => s.queue[s.currentIndex]?.id)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const active = currentId === track.id
  const dur = formatDuration(track.duration)

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-white/5",
        active && "bg-white/5"
      )}
    >
      <button
        type="button"
        onClick={() => (active ? togglePlay() : playTrack(track, context))}
        className="relative shrink-0"
        aria-label={track.title}
      >
        <CoverImage
          seed={track.id}
          src={track.coverUrl || undefined}
          alt={track.title}
          className="size-12"
          rounded="rounded-xl"
        />
        <span className="absolute inset-0 grid place-items-center rounded-xl bg-black/45 opacity-0 transition group-hover:opacity-100">
          {active && isPlaying ? (
            <Pause className="size-5 fill-current" />
          ) : (
            <Play className="size-5 translate-x-px fill-current" />
          )}
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", active && "text-primary")}>
          {track.title}
        </p>
        <Link
          href={`/artists/${track.artistId}`}
          className="truncate text-xs text-muted-foreground hover:text-foreground"
        >
          {artists[track.artistId]?.name}
        </Link>
      </div>

      {active && isPlaying && <NowPlayingIndicator className="me-1" />}
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {locale === "fa" ? toFaDigits(dur) : dur}
      </span>
      <TrackActions track={track} className="shrink-0" />
      {onRemove && (
        <button
          type="button"
          aria-label="remove"
          onClick={onRemove}
          className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
