"use client"

import { ArrowDown, ArrowUp, X } from "lucide-react"

import { CoverImage } from "@/components/common/cover-image"
import { NowPlayingIndicator } from "@/components/player/now-playing-indicator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useArtistMap } from "@/lib/queries"
import { useT } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { usePlayerStore } from "@/store/player-store"
import { useUIStore } from "@/store/ui-store"

export function QueuePanel() {
  const t = useT()
  const artists = useArtistMap()
  const open = useUIStore((s) => s.queueOpen)
  const setOpen = useUIStore((s) => s.setQueueOpen)
  const queue = usePlayerStore((s) => s.queue)
  const currentIndex = usePlayerStore((s) => s.currentIndex)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const playQueue = usePlayerStore((s) => s.playQueue)
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue)
  const reorderQueue = usePlayerStore((s) => s.reorderQueue)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="left"
        className="glass-strong w-full gap-0 border-white/10 sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle className="font-display text-lg">
            {t("player.queue")}
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-3 pb-6">
          {queue.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              {t("player.queueEmpty")}
            </p>
          ) : (
            <ul className="space-y-1">
              {queue.map((track, i) => {
                const active = i === currentIndex
                return (
                  <li
                    key={`${track.id}-${i}`}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-white/5",
                      active && "bg-white/10"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => playQueue(queue, i)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-start"
                    >
                      <div className="relative">
                        <CoverImage
                          seed={track.id}
                          src={track.coverUrl || undefined}
                          alt={track.title}
                          className="size-10 shrink-0"
                          rounded="rounded-lg"
                        />
                        {active && (
                          <span className="absolute inset-0 grid place-items-center rounded-lg bg-black/40">
                            <NowPlayingIndicator playing={isPlaying} />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "truncate text-sm",
                            active && "font-semibold text-primary"
                          )}
                        >
                          {track.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {artists[track.artistId]?.name}
                        </p>
                      </div>
                    </button>
                    <div className="flex shrink-0 items-center opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        aria-label="move up"
                        disabled={i === 0}
                        onClick={() => reorderQueue(i, i - 1)}
                        className="grid size-7 place-items-center rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowUp className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="move down"
                        disabled={i === queue.length - 1}
                        onClick={() => reorderQueue(i, i + 1)}
                        className="grid size-7 place-items-center rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowDown className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="remove"
                        onClick={() => removeFromQueue(i)}
                        className="grid size-7 place-items-center rounded-md text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
