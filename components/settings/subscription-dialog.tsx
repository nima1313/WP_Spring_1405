"use client"

import * as React from "react"
import { Check, Loader2 } from "lucide-react"
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
import {
  initiatePurchase,
  type PurchasablePlan,
  type PurchaseMonths,
} from "@/lib/api/billing"
import { usePrices } from "@/lib/queries"
import { useI18n, useT } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n"
import { formatNumber, formatPrice } from "@/lib/format"
import { isUnlimited, TIER_ORDER, TIERS } from "@/lib/subscriptions"
import type { Tier } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"

const MONTH_OPTIONS: PurchaseMonths[] = [1, 3, 6, 12]

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
  const { data: prices } = usePrices()

  const [selected, setSelected] = React.useState<PurchasablePlan | null>(null)
  const [months, setMonths] = React.useState<PurchaseMonths>(1)
  const [submitting, setSubmitting] = React.useState(false)

  if (!user) return null

  const unitPrice = (tier: PurchasablePlan): number =>
    prices ? (tier === "silver" ? prices.silver : prices.gold) : 0

  const priceFor = (tier: Tier): string =>
    tier === "basic"
      ? t("tier.basic.short")
      : prices
        ? formatPrice(unitPrice(tier as PurchasablePlan), prices.currency, locale)
        : "—"

  function onSelect(tier: Tier) {
    if (tier === user!.tier || tier === "basic") return
    setSelected(tier as PurchasablePlan)
    setMonths(1)
  }

  async function onPay() {
    if (!selected) return
    setSubmitting(true)
    try {
      // Server computes months × price, creates a pending payment, and returns
      // the gateway URL (mock bank page or Zarinpal sandbox) to redirect to.
      const { redirectUrl } = await initiatePurchase(selected, months)
      window.location.href = redirectUrl
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("settings.planUpdated"))
      setSubmitting(false)
    }
  }

  const total = selected ? unitPrice(selected) * months : 0

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
            const isSelected = tier === selected
            return (
              <div
                key={tier}
                className={cn(
                  "flex flex-col rounded-2xl border p-4",
                  current
                    ? "border-primary/50 bg-primary/10"
                    : isSelected
                      ? "border-primary/40 bg-primary/5"
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
                  disabled={current || tier === "basic"}
                  onClick={() => onSelect(tier)}
                >
                  {current ? t("settings.currentPlan") : t("settings.selectPlan")}
                </Button>
              </div>
            )
          })}
        </div>

        {/* Period picker + checkout (§3.6, 1/3/6/12 months) */}
        {selected && (
          <div className="mt-2 space-y-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {t("settings.selectPlan")} — <TierBadge tier={selected} />
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {MONTH_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonths(m)}
                  className={cn(
                    "rounded-xl px-4 py-2 text-sm font-medium transition",
                    months === m
                      ? "bg-primary/25 text-primary"
                      : "glass text-muted-foreground hover:text-foreground"
                  )}
                >
                  {formatNumber(m, locale)} {t("settings.perMonth")}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("settings.perMonth")}
              </span>
              <span className="font-display text-lg font-extrabold">
                {prices ? formatPrice(total, prices.currency, locale) : "—"}
              </span>
            </div>

            <Button className="w-full gap-2" onClick={onPay} disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {t("settings.selectPlan")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
