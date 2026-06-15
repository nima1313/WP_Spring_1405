"use client"

import * as React from "react"
import { Gem, ShieldAlert, TrendingUp } from "lucide-react"
import { Cell, Pie, PieChart } from "recharts"
import { toast } from "sonner"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/common/empty-state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useMonthlyRevenue,
  usePrices,
  useUpdatePrices,
  useUserDistribution,
} from "@/lib/queries"
import { canManageSubscriptions } from "@/lib/auth/permissions"
import { useI18n, useT } from "@/lib/i18n"
import { formatNumber, formatPrice } from "@/lib/format"
import { useAuthStore } from "@/store/auth-store"

const TIER_COLORS: Record<string, string> = {
  basic: "var(--color-basic)",
  silver: "var(--color-silver)",
  gold: "var(--color-gold)",
}

export default function SubscriptionsPage() {
  const t = useT()
  const { locale } = useI18n()
  const user = useAuthStore((s) => s.user)

  const { data: prices } = usePrices()
  const { data: distribution = [] } = useUserDistribution()
  const updatePrices = useUpdatePrices()

  const [silver, setSilver] = React.useState("")
  const [gold, setGold] = React.useState("")
  const [pricesKey, setPricesKey] = React.useState<string | null>(null)

  // Seed the form once prices load / change (render-phase derived state).
  if (prices && pricesKey !== prices.updatedAt) {
    setPricesKey(prices.updatedAt)
    setSilver(String(prices.silver))
    setGold(String(prices.gold))
  }

  // Live revenue follows the form inputs so the admin sees the impact instantly.
  const draftPrices = React.useMemo(
    () => ({
      silver: Number(silver) || prices?.silver || 0,
      gold: Number(gold) || prices?.gold || 0,
    }),
    [silver, gold, prices]
  )
  const { data: revenue = 0 } = useMonthlyRevenue(draftPrices)

  if (!canManageSubscriptions(user?.role)) {
    return <EmptyState icon={ShieldAlert} title={t("dash.adminOnly")} />
  }

  const currency = prices?.currency ?? "تومان"

  const chartConfig: ChartConfig = {
    count: { label: t("dash.user") },
    basic: { label: t("tier.basic"), color: "var(--chart-3)" },
    silver: { label: t("tier.silver"), color: "var(--chart-2)" },
    gold: { label: t("tier.gold"), color: "var(--chart-1)" },
  }
  const chartData = distribution.map((d) => ({
    tier: d.tier,
    label: t(`tier.${d.tier}`),
    count: d.count,
    fill: TIER_COLORS[d.tier],
  }))

  function onUpdate(e: React.FormEvent) {
    e.preventDefault()
    updatePrices.mutate(
      { silver: Number(silver), gold: Number(gold) },
      { onSuccess: () => toast.success(t("dash.updatePrices")) }
    )
  }

  const totalUsers = distribution.reduce((s, d) => s + d.count, 0)

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Price control */}
      <form
        onSubmit={onUpdate}
        className="space-y-4 rounded-3xl glass-strong p-6"
      >
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Gem className="size-5 text-primary" />
          {t("dash.priceControl")}
        </h2>
        <div className="space-y-1.5">
          <Label htmlFor="silver">{t("dash.silverPrice")}</Label>
          <Input
            id="silver"
            type="number"
            dir="ltr"
            value={silver}
            onChange={(e) => setSilver(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gold">{t("dash.goldPrice")}</Label>
          <Input
            id="gold"
            type="number"
            dir="ltr"
            value={gold}
            onChange={(e) => setGold(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={updatePrices.isPending}>
          {t("dash.updatePrices")}
        </Button>
        <p className="text-xs text-muted-foreground">
          {t("settings.expiresOn")}: {currency}
        </p>
      </form>

      {/* Revenue widgets */}
      <div className="space-y-3">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-primary/25 via-fuchsia-500/10 to-transparent p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="size-4" />
            {t("dash.monthlyRevenue")}
          </div>
          <p className="mt-2 font-display text-3xl font-extrabold">
            {formatPrice(revenue, currency, locale)}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {distribution.map((d) => (
            <div key={d.tier} className="rounded-2xl glass px-3 py-3 text-center">
              <p className="font-display text-xl font-bold">
                {formatNumber(d.count, locale)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t(`tier.${d.tier}`)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Distribution pie */}
      <div className="rounded-3xl glass-strong p-6 lg:col-span-2">
        <h2 className="font-display text-lg font-bold">
          {t("dash.userDistribution")}
        </h2>
        {totalUsers === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {t("empty.generic")}
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto mt-4 aspect-square max-h-[260px]"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="label"
                innerRadius={60}
                strokeWidth={4}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.tier} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          {chartData.map((d) => (
            <div key={d.tier} className="flex items-center gap-2 text-sm">
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: d.fill }}
              />
              {d.label} · {formatNumber(d.count, locale)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
