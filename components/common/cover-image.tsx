"use client"

import { cn } from "@/lib/utils"

// Deterministic gradient cover derived from a seed string — gives every track /
// album a distinct, on-brand artwork without bundling image files.

const PALETTES: [string, string, string][] = [
  ["#8B5CF6", "#EC4899", "#22D3EE"],
  ["#6366F1", "#A855F7", "#F472B6"],
  ["#7C3AED", "#2DD4BF", "#818CF8"],
  ["#D946EF", "#8B5CF6", "#38BDF8"],
  ["#A855F7", "#F59E0B", "#EC4899"],
  ["#4F46E5", "#06B6D4", "#A78BFA"],
]

function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i)
  return Math.abs(h)
}

export function CoverImage({
  seed,
  src,
  alt,
  className,
  rounded = "rounded-2xl",
}: {
  seed: string
  src?: string
  alt?: string
  className?: string
  rounded?: string
}) {
  const h = hash(seed)
  const [a, b, c] = PALETTES[h % PALETTES.length]
  const angle = h % 360

  if (src) {
    return (
      // User-provided avatars/covers are data URLs or arbitrary hosts, so the
      // plain <img> is intentional (next/image optimization doesn't apply).
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt ?? ""}
        className={cn("object-cover", rounded, className)}
      />
    )
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn("relative overflow-hidden", rounded, className)}
      style={{
        backgroundImage: `linear-gradient(${angle}deg, ${a}, ${b})`,
      }}
    >
      <div
        className="absolute inset-0 opacity-70 mix-blend-screen"
        style={{
          backgroundImage: `radial-gradient(60% 60% at 70% 20%, ${c}88, transparent 70%)`,
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_100%,rgba(0,0,0,0.35),transparent_50%)]" />
    </div>
  )
}
