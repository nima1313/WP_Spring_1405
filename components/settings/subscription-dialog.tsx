"use client"

import { Check } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { TierBadge } from "@/components/common/tier-badge"
import { usePrices, useUpdateUser } from "@/lib/queries"
import { useI18n, useT } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n"
import { formatNumber, formatPrice } from "@/lib/format"
import { isUnlimited, TIER_ORDER, TIERS } from "@/lib/subscriptions"
import type { Tier } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"

// Features included in a tier, as translation keys (with optional params).
function featuresFor(
  tier: Tier,
  t: (k: string, p?: Record<string, string | number>) => string,
  locale: Locale
) {
  const c = TIERS[tier]
  const out: string[] = []
  out.push(
    isUnlimited(c.streamsPerDay)
      ? t("plan.streamsUnlimited")
      : t("plan.streamsLimited", { n: formatNumber(c.streamsPerDay, locale) })
  )
  out.push(
    isUnlimited(c.maxPlaylists)
      ? t("plan.playlistsUnlimited")
      : t("plan.playlistsLimited", { n: formatNumber(c.maxPlaylists, locale) })
  )
  if (c.canUploadAvatar) out.push(t("plan.avatar"))
  if (c.canDownload) out.push(t("plan.download"))
  if (c.earlyAccess) out.push(t("plan.early"))
  if (c.canViewStats) out.push(t("plan.stats"))
  return out
}

export function SubscriptionDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const t = useT()
  const { locale } = useI18n()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const { data: prices } = usePrices()
  const updateUser = useUpdateUser()

  if (!user) return null

  const priceFor = (tier: Tier): string =>
    tier === "basic"
      ? t("tier.basic.short")
      : prices
        ? formatPrice(
            tier === "silver" ? prices.silver : prices.gold,
            prices.currency,
            locale
          )
        : "—"

  function selectPlan(tier: Tier) {
    if (tier === user!.tier) return
    // Mock subscribe (no real payment in phase 1): switch tier and extend a month.
    const expires = new Date(Date.now() + 30 * 864e5).toISOString()
    updateUser.mutate(
      { id: user!.id, patch: { tier, subscriptionExpiresAt: expires } },
      {
        onSuccess: (updated) => {
          setUser(updated)
          toast.success(t("settings.planUpdated"))
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("settings.choosePlan")}</DialogTitle>
          <DialogDescription>{t("settings.choosePlanHint")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3">
          {TIER_ORDER.map((tier) => {
            const current = tier === user.tier
            return (
              <div
                key={tier}
                className={cn(
                  "flex flex-col rounded-2xl border p-4",
                  current
                    ? "border-primary/50 bg-primary/10"
                    : "border-white/10 glass"
                )}
              >
                <TierBadge tier={tier} className="self-start" />
                <p className="mt-3 font-display text-xl font-extrabold">
                  {priceFor(tier)}
                </p>
                {tier !== "basic" && (
                  <p className="-mt-1 text-xs text-muted-foreground">
                    {t("settings.perMonth")}
                  </p>
                )}

                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  {featuresFor(tier, t, locale).map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="mt-4 w-full"
                  variant={current ? "outline" : "default"}
                  disabled={current || updateUser.isPending}
                  onClick={() => selectPlan(tier)}
                >
                  {current ? t("settings.currentPlan") : t("settings.selectPlan")}
                </Button>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
