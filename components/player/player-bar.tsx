"use client"

import Link from "next/link"
import { ChevronUp, ListMusic, Mic2, Pause, Play, SkipForward } from "lucide-react"

import { CoverImage } from "@/components/common/cover-image"
import { TransportControls } from "@/components/player/controls"
import { SeekBar } from "@/components/player/seek-bar"
import { VolumeControl } from "@/components/player/volume"
import { useArtistMap } from "@/lib/queries"
import { useT } from "@/lib/i18n"
import { usePlayerStore } from "@/store/player-store"
import { useUIStore } from "@/store/ui-store"

export function PlayerBar() {
  const t = useT()
  const artists = useArtistMap()
  const current = usePlayerStore((s) => s.queue[s.currentIndex] ?? null)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const next = usePlayerStore((s) => s.next)
  const seek = usePlayerStore((s) => s.seek)
  const setQueueOpen = useUIStore((s) => s.setQueueOpen)
  const setLyricsOpen = useUIStore((s) => s.setLyricsOpen)
  const setExpanded = useUIStore((s) => s.setPlayerExpanded)

  if (!current) return null
  const artist = artists[current.artistId]
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <>
      {/* Desktop floating bar */}
      <div className="fixed bottom-4 z-50 hidden start-[272px] end-6 md:block">
        <div className="glass-strong glow-sm grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] items-center gap-4 rounded-3xl px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <CoverImage
              seed={current.id}
              src={current.coverUrl || undefined}
              alt={current.title}
              className="size-12 shrink-0"
              rounded="rounded-xl"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{current.title}</p>
              {artist && (
                <Link
                  href={`/artists/${artist.id}`}
                  className="truncate text-xs text-muted-foreground hover:text-foreground"
                >
                  {artist.name}
                </Link>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <TransportControls size="sm" />
            <SeekBar
              value={currentTime}
              max={duration}
              onSeek={seek}
              className="mt-0.5"
            />
          </div>

          <div className="flex items-center justify-end gap-1">
            {current.lyrics && (
              <button
                type="button"
                aria-label={t("player.lyrics")}
                onClick={() => setLyricsOpen(true)}
                className="grid size-9 place-items-center rounded-full text-foreground/70 transition hover:bg-white/10 hover:text-foreground"
              >
                <Mic2 className="size-5" />
              </button>
            )}
            <button
              type="button"
              aria-label={t("player.queue")}
              onClick={() => setQueueOpen(true)}
              className="grid size-9 place-items-center rounded-full text-foreground/70 transition hover:bg-white/10 hover:text-foreground"
            >
              <ListMusic className="size-5" />
            </button>
            <VolumeControl className="ms-1" />
          </div>
        </div>
      </div>

      {/* Mobile mini-player */}
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="glass-strong fixed bottom-[84px] z-50 start-3 end-3 flex items-center gap-3 overflow-hidden rounded-2xl p-2 text-start md:hidden"
      >
        <CoverImage
          seed={current.id}
          src={current.coverUrl || undefined}
          alt={current.title}
          className="size-11 shrink-0"
          rounded="rounded-lg"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{current.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {artist?.name}
          </p>
        </div>
        <span
          role="button"
          tabIndex={0}
          aria-label={isPlaying ? t("player.pause") : t("player.play")}
          onClick={(e) => {
            e.stopPropagation()
            togglePlay()
          }}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-fuchsia-500 text-primary-foreground"
        >
          {isPlaying ? (
            <Pause className="size-5 fill-current" />
          ) : (
            <Play className="size-5 translate-x-px fill-current" />
          )}
        </span>
        <span
          role="button"
          tabIndex={0}
          aria-label={t("player.next")}
          onClick={(e) => {
            e.stopPropagation()
            next(false)
          }}
          className="grid size-9 shrink-0 place-items-center text-foreground/80"
        >
          <SkipForward className="size-5 fill-current" />
        </span>
        <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
        <span
          className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
          style={{ width: `${pct}%` }}
        />
      </button>
    </>
  )
}
