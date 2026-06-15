"use client"

import Link from "next/link"
import {
  BadgeCheck,
  ChevronLeft,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react"

import {
  useAccounting,
  useMonthlyRevenue,
  usePrices,
  useTickets,
  useVerifications,
} from "@/lib/queries"
import { useI18n, useT } from "@/lib/i18n"
import { isAdmin } from "@/lib/auth/permissions"
import { formatNumber, formatPrice } from "@/lib/format"
import { useAuthStore } from "@/store/auth-store"

export default function DashboardOverviewPage() {
  const t = useT()
  const { locale } = useI18n()
  const user = useAuthStore((s) => s.user)
  const admin = isAdmin(user?.role)

  const { data: tickets = [] } = useTickets()
  const { data: verifications = [] } = useVerifications()
  const { data: accounting = [] } = useAccounting()
  const { data: prices } = usePrices()
  const { data: revenue = 0 } = useMonthlyRevenue(prices)

  const openTickets = tickets.filter((tk) => tk.status === "open").length
  const pendingVerifs = verifications.filter(
    (v) => v.status === "pending"
  ).length
  const pendingPayments = accounting.filter(
    (r) => r.status === "pending"
  ).length

  const cards = [
    {
      label: t("dash.tickets"),
      value: formatNumber(openTickets, locale),
      hint: t("dash.status.open"),
      icon: Ticket,
      href: "/dashboard/tickets",
    },
    {
      label: t("dash.verifications"),
      value: formatNumber(pendingVerifs, locale),
      hint: t("dash.status.pending"),
      icon: BadgeCheck,
      href: "/dashboard/verifications",
    },
  ]
  if (admin) {
    cards.push(
      {
        label: t("dash.accounting"),
        value: formatNumber(pendingPayments, locale),
        hint: t("dash.pay.pending"),
        icon: Users,
        href: "/dashboard/accounting",
      },
      {
        label: t("dash.monthlyRevenue"),
        value: prices ? formatPrice(revenue, prices.currency, locale) : "—",
        hint: t("dash.subscriptions"),
        icon: TrendingUp,
        href: "/dashboard/subscriptions",
      }
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, hint, icon: Icon, href }) => (
        <Link
          key={label}
          href={href}
          className="group rounded-3xl glass p-5 transition hover:bg-white/10"
        >
          <div className="flex items-center justify-between">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
              <Icon className="size-5" />
            </div>
            <ChevronLeft className="size-4 text-muted-foreground transition group-hover:text-foreground rtl:rotate-0 ltr:rotate-180" />
          </div>
          <p className="mt-4 font-display text-2xl font-extrabold">{value}</p>
          <p className="mt-1 text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </Link>
      ))}
    </div>
  )
}
