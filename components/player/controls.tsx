"use client"

import {
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react"

import { useT } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { usePlayerStore } from "@/store/player-store"

export function TransportControls({
  size = "sm",
}: {
  size?: "sm" | "lg"
}) {
  const t = useT()
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const repeat = usePlayerStore((s) => s.repeat)
  const shuffle = usePlayerStore((s) => s.shuffle)
  const hasTrack = usePlayerStore((s) => s.currentIndex !== -1)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const next = usePlayerStore((s) => s.next)
  const prev = usePlayerStore((s) => s.prev)
  const toggleRepeat = usePlayerStore((s) => s.toggleRepeat)
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle)

  const iconBtn =
    "grid place-items-center rounded-full text-foreground/80 transition hover:text-foreground hover:scale-105 disabled:opacity-40"
  const big = size === "lg"

  return (
    // Transport controls stay LTR even in the RTL app — prev←play→next and the
    // skip icons map to a universal, direction-agnostic layout (as on Spotify).
    <div
      dir="ltr"
      className={cn(
        "flex items-center justify-center",
        big ? "gap-6" : "gap-3"
      )}
    >
      <button
        type="button"
        aria-label={t("player.shuffle")}
        onClick={toggleShuffle}
        className={cn(
          iconBtn,
          big ? "size-10" : "size-8",
          shuffle && "text-primary"
        )}
      >
        <Shuffle className={big ? "size-5" : "size-4"} />
      </button>

      <button
        type="button"
        aria-label={t("player.prev")}
        onClick={prev}
        disabled={!hasTrack}
        className={cn(iconBtn, big ? "size-11" : "size-9")}
      >
        <SkipBack className={cn("fill-current", big ? "size-6" : "size-5")} />
      </button>

      <button
        type="button"
        aria-label={isPlaying ? t("player.pause") : t("player.play")}
        onClick={togglePlay}
        disabled={!hasTrack}
        className={cn(
          "grid place-items-center rounded-full bg-gradient-to-br from-primary to-fuchsia-500 text-primary-foreground shadow-lg shadow-primary/40 transition hover:scale-105 active:scale-95 disabled:opacity-40",
          big ? "size-16" : "size-11"
        )}
      >
        {isPlaying ? (
          <Pause className={cn("fill-current", big ? "size-7" : "size-5")} />
        ) : (
          <Play
            className={cn("translate-x-px fill-current", big ? "size-7" : "size-5")}
          />
        )}
      </button>

      <button
        type="button"
        aria-label={t("player.next")}
        onClick={() => next(false)}
        disabled={!hasTrack}
        className={cn(iconBtn, big ? "size-11" : "size-9")}
      >
        <SkipForward className={cn("fill-current", big ? "size-6" : "size-5")} />
      </button>

      <button
        type="button"
        aria-label={t("player.repeat")}
        onClick={toggleRepeat}
        className={cn(
          iconBtn,
          big ? "size-10" : "size-8",
          repeat !== "off" && "text-primary"
        )}
      >
        {repeat === "one" ? (
          <Repeat1 className={big ? "size-5" : "size-4"} />
        ) : (
          <Repeat className={big ? "size-5" : "size-4"} />
        )}
      </button>
    </div>
  )
}
