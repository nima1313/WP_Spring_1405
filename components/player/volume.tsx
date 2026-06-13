"use client"

import { Volume1, Volume2, VolumeX } from "lucide-react"

import { Slider } from "@/components/ui/slider"
import { useT } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { usePlayerStore } from "@/store/player-store"

export function VolumeControl({ className }: { className?: string }) {
  const t = useT()
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)
  const setVolume = usePlayerStore((s) => s.setVolume)
  const toggleMute = usePlayerStore((s) => s.toggleMute)

  const effective = muted ? 0 : volume
  const Icon = effective === 0 ? VolumeX : effective < 0.5 ? Volume1 : Volume2

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        aria-label={t("player.volume")}
        onClick={toggleMute}
        className="text-foreground/70 transition hover:text-foreground"
      >
        <Icon className="size-5" />
      </button>
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
  )
}
