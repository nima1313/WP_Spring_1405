"use client"

import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { ChevronDown, Headphones, ListMusic, Mic2, Radio } from "lucide-react"

import { CoverImage } from "@/components/common/cover-image"
import { TransportControls } from "@/components/player/controls"
import { SeekBar } from "@/components/player/seek-bar"
import { useArtistMap } from "@/lib/queries"
import { useI18n, useT } from "@/lib/i18n"
import { formatCompact } from "@/lib/format"
import { tierConfig } from "@/lib/subscriptions"
import { useAuthStore } from "@/store/auth-store"
import { usePlayerStore } from "@/store/player-store"
import { useUIStore } from "@/store/ui-store"
import { VolumeControl } from "@/components/player/volume"
export function FullscreenPlayer() {
  const t = useT()
  const { locale } = useI18n()
  const artists = useArtistMap()
  const user = useAuthStore((s) => s.user)
  const expanded = useUIStore((s) => s.playerExpanded)
  const setExpanded = useUIStore((s) => s.setPlayerExpanded)
  const setQueueOpen = useUIStore((s) => s.setQueueOpen)
  const setLyricsOpen = useUIStore((s) => s.setLyricsOpen)
  const current = usePlayerStore((s) => s.queue[s.currentIndex] ?? null)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const seek = usePlayerStore((s) => s.seek)

  const artist = current ? artists[current.artistId] : undefined
  const canViewStats = user ? tierConfig(user.tier).canViewStats : false

  return (
    <AnimatePresence>
      {expanded && current && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 280 }}
          className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-[#0B0712]"
        >
          {/* ambient cover glow */}
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-60">
            <CoverImage
              seed={current.id}
              src={current.coverUrl || undefined}
              className="size-full scale-150 blur-3xl"
              rounded="rounded-none"
            />
          </div>

          <div className="flex items-center justify-between p-4">
            <button
              type="button"
              aria-label={t("common.close")}
              onClick={() => setExpanded(false)}
              className="grid size-10 place-items-center rounded-full glass"
            >
              <ChevronDown className="size-5" />
            </button>
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t("player.nowPlaying")}
            </span>
            <button
              type="button"
              aria-label={t("player.queue")}
              onClick={() => setQueueOpen(true)}
              className="grid size-10 place-items-center rounded-full glass"
            >
              <ListMusic className="size-5" />
            </button>
          </div>

          <div className="flex flex-1 flex-col justify-center gap-8 px-6 pb-10">
            <CoverImage
              seed={current.id}
              src={current.coverUrl || undefined}
              alt={current.title}
              className="mx-auto aspect-square w-full max-w-sm shadow-2xl shadow-primary/30"
              rounded="rounded-[2rem]"
            />

            <div className="space-y-2 text-center">
              <h2 className="font-display text-2xl font-bold">
                {current.title}
              </h2>
              {artist && (
                <Link
                  href={`/artists/${artist.id}`}
                  onClick={() => setExpanded(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {artist.name}
                </Link>
              )}
            </div>

            {canViewStats && (
              <div className="mx-auto flex items-center gap-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Headphones className="size-4" />
                  {formatCompact(current.listeners, locale)}{" "}
                  {t("player.listeners")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Radio className="size-4" />
                  {formatCompact(current.streams, locale)} {t("player.streams")}
                </span>
              </div>
            )}

            <SeekBar value={currentTime} max={duration} onSeek={seek} />

            <TransportControls size="lg" />
              <VolumeControl className="mx-auto" />
            {current.lyrics && (
              <button
                type="button"
                onClick={() => setLyricsOpen(true)}
                className="mx-auto flex items-center gap-2 rounded-full glass px-4 py-2 text-sm text-foreground/80"
              >
                <Mic2 className="size-4" />
                {t("player.lyrics")}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
