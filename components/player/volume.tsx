"use client"

import { useRef, useState } from "react"
import { Volume1, Volume2, VolumeX } from "lucide-react"

import { Slider } from "@/components/ui/slider"
import { useT } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { usePlayerStore } from "@/store/player-store"

export function VolumeControl({ className }: { className?: string }) {
  const t = useT()
  const [showSlider, setShowSlider] = useState(false)
  const isTouchRef = useRef(false)
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)
  const setVolume = usePlayerStore((s) => s.setVolume)
  const toggleMute = usePlayerStore((s) => s.toggleMute)

  const effective = muted ? 0 : volume
  const Icon = effective === 0 ? VolumeX : effective < 0.5 ? Volume1 : Volume2

  return (
    <div className={cn("group relative flex items-center gap-2", className)}>
      <button
        type="button"
        aria-label={t("player.volume")}
        onTouchStart={() => {
          isTouchRef.current = true
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (isTouchRef.current) {
            isTouchRef.current = false
            setShowSlider((v) => !v)
          } else {
            toggleMute()
          }
        }}
        className="text-foreground/70 transition hover:text-foreground"
      >
        <Icon className="size-5" />
      </button>

      {/* Desktop: افقی با hover */}
      <div
        dir="ltr"
        className="hidden w-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:w-24 group-hover:opacity-100 md:block"
      >
        <Slider
          value={[effective * 100]}
          max={100}
          step={1}
          aria-label={t("player.volume")}
          onValueChange={(v) =>
            setVolume((Array.isArray(v) ? v[0] : (v as number)) / 100)
          }
          className="w-24"
        />
      </div>

      {/* Mobile: عمودی با tap */}
      {showSlider && (
        <>
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setShowSlider(false)}
          />
          <div className="absolute bottom-10 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2 rounded-2xl bg-sidebar/95 p-3 shadow-xl md:hidden">
            <span className="text-xs tabular-nums text-muted-foreground">
              {Math.round(effective * 100)}
            </span>
            <div dir="ltr">
              <Slider
                value={[effective * 100]}
                max={100}
                step={1}
                orientation="vertical"
                aria-label={t("player.volume")}
                onValueChange={(v) =>
                  setVolume((Array.isArray(v) ? v[0] : (v as number)) / 100)
                }
                className="h-24"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}