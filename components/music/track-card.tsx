"use client"

import Link from "next/link"
import { Play, Sparkles } from "lucide-react"

import { CoverImage } from "@/components/common/cover-image"
import { NowPlayingIndicator } from "@/components/player/now-playing-indicator"
import { TrackActions } from "@/components/music/track-actions"
import { useAlbumMap, useArtistMap } from "@/lib/queries"
import { useT } from "@/lib/i18n"
import type { Track } from "@/lib/types"
import { cn } from "@/lib/utils"
import { usePlayerStore } from "@/store/player-store"

export function TrackCard({
  track,
  context,
  className,
}: {
  track: Track
  context?: Track[]
  className?: string
}) {
  const t = useT()
  const artists = useArtistMap()
  const albums = useAlbumMap()
  const playTrack = usePlayerStore((s) => s.playTrack)
  const currentId = usePlayerStore((s) => s.queue[s.currentIndex]?.id)
  const isPlaying = usePlayerStore((s) => s.isPlaying)

  const artist = artists[track.artistId]
  const album = track.albumId ? albums[track.albumId] : undefined
  const active = currentId === track.id

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => playTrack(track, context)}
      className={cn(
        "group relative w-[164px] shrink-0 cursor-pointer rounded-3xl glass-card p-3 transition hover:-translate-y-1 hover:bg-white/10",
        className
      )}
    >
      <div className="relative mb-3">
        <CoverImage
          seed={track.id}
          src={track.coverUrl || undefined}
          alt={track.title}
          className="aspect-square w-full"
        />
        {track.earlyAccess && (
          <span className="absolute top-2 start-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-amber-300 backdrop-blur">
            <Sparkles className="size-3" />
            {t("home.earlyAccess")}
          </span>
        )}
        <span className="absolute bottom-2 end-2 grid size-11 translate-y-2 place-items-center rounded-full bg-gradient-to-br from-primary to-fuchsia-500 text-primary-foreground opacity-0 shadow-lg shadow-primary/40 transition group-hover:translate-y-0 group-hover:opacity-100">
          {active && isPlaying ? (
            <NowPlayingIndicator />
          ) : (
            <Play className="size-5 translate-x-px fill-current" />
          )}
        </span>
        <span className="absolute top-1 end-1 opacity-0 transition group-hover:opacity-100">
          <TrackActions track={track} />
        </span>
      </div>
      <p
        className={cn(
          "truncate text-sm font-semibold",
          active && "text-primary"
        )}
      >
        {track.title}
      </p>
      <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
        {artist && (
          <Link
            href={`/artists/${artist.id}`}
            onClick={(e) => e.stopPropagation()}
            className="truncate hover:text-foreground"
          >
            {artist.name}
          </Link>
        )}
        {album && (
          <>
            <span aria-hidden>·</span>
            <Link
              href={`/album/${album.id}`}
              onClick={(e) => e.stopPropagation()}
              className="truncate hover:text-foreground"
            >
              {album.title}
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
