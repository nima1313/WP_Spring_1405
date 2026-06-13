"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useT } from "@/lib/i18n"
import { usePlayerStore } from "@/store/player-store"
import { useUIStore } from "@/store/ui-store"

export function LyricsView() {
  const t = useT()
  const open = useUIStore((s) => s.lyricsOpen)
  const setOpen = useUIStore((s) => s.setLyricsOpen)
  const current = usePlayerStore((s) => s.queue[s.currentIndex] ?? null)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="left"
        className="glass-strong w-full gap-0 border-white/10 sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle className="font-display text-lg">
            {t("player.lyrics")}
          </SheetTitle>
          {current && (
            <p className="text-sm text-muted-foreground">{current.title}</p>
          )}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 pb-10">
          {current?.lyrics ? (
            <pre className="font-sans text-lg leading-relaxed whitespace-pre-wrap text-foreground/90">
              {current.lyrics}
            </pre>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {t("player.noLyrics")}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
