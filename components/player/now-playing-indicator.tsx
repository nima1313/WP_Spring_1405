"use client"

import { cn } from "@/lib/utils"

// Three animated equalizer bars shown next to the currently-playing row.
export function NowPlayingIndicator({
  playing = true,
  className,
}: {
  playing?: boolean
  className?: string
}) {
  return (
    <span
      className={cn("flex h-4 items-end gap-0.5", className)}
      aria-hidden="true"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-0.5 origin-bottom rounded-full bg-primary"
          style={{
            height: "100%",
            animation: playing
              ? `eq-bar ${0.7 + i * 0.25}s ease-in-out ${i * 0.15}s infinite`
              : "none",
            transform: playing ? undefined : "scaleY(0.3)",
          }}
        />
      ))}
    </span>
  )
}
