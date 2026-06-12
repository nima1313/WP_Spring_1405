"use client"

import { Crown, Gem, Music } from "lucide-react"

import { useT } from "@/lib/i18n"
import type { Tier } from "@/lib/types"
import { cn } from "@/lib/utils"

const STYLES: Record<Tier, string> = {
  basic: "bg-white/10 text-foreground/70",
  silver: "bg-slate-300/20 text-slate-200 ring-1 ring-slate-300/30",
  gold: "bg-amber-400/20 text-amber-300 ring-1 ring-amber-300/40",
}

const ICONS: Record<Tier, typeof Music> = {
  basic: Music,
  silver: Gem,
  gold: Crown,
}

export function TierBadge({
  tier,
  className,
}: {
  tier: Tier
  className?: string
}) {
  const t = useT()
  const Icon = ICONS[tier]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        STYLES[tier],
        className
      )}
    >
      <Icon className="size-3.5" />
      {t(`tier.${tier}`)}
    </span>
  )
}
