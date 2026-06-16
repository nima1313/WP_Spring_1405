"use client"

import * as React from "react"

import { useI18n } from "@/lib/i18n"
import { formatDuration, toFaDigits } from "@/lib/format"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

export function SeekBar({
  value,
  max,
  onSeek,
  showLabels = true,
  className,
}: {
  value: number
  max: number
  onSeek: (t: number) => void
  showLabels?: boolean
  className?: string
}) {
  const { locale } = useI18n()
  const [scrubbing, setScrubbing] = React.useState<number | null>(null)
  const display = scrubbing ?? value
  const safeMax = max > 0 ? max : 0
  const clamped = Math.min(Math.max(display, 0), safeMax)

  const fmt = (n: number) => {
    const s = formatDuration(n)
    return locale === "fa" ? toFaDigits(s) : s
  }

  return (
    // The scrubber is LTR even in the RTL app: progress fills left→right,
    // elapsed on the left, total on the right — the universal media convention.
    <div dir="ltr" className={cn("flex w-full items-center gap-2", className)}>
      {showLabels && (
        <span className="w-10 shrink-0 text-end text-[11px] tabular-nums text-muted-foreground">
          {fmt(clamped)}
        </span>
      )}
      <Slider
        value={[Math.min(display, safeMax)]}
        max={safeMax || 1}
        step={1}
        aria-label="seek"
        onValueChange={(v) =>
          setScrubbing(Array.isArray(v) ? v[0] : (v as number))
        }
        onValueCommitted={(v) => {
          const t = Array.isArray(v) ? v[0] : (v as number)
          onSeek(t)
          setScrubbing(null)
        }}
        className="grow"
      />
      {showLabels && (
        <span className="w-10 shrink-0 text-[11px] tabular-nums text-muted-foreground">
          {fmt(safeMax)}
        </span>
      )}
    </div>
  )
}
