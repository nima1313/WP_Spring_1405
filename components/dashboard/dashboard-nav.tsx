"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BadgeCheck,
  Gem,
  LayoutDashboard,
  Receipt,
  Ticket,
} from "lucide-react"

import { dashboardSectionsForRole } from "@/lib/auth/permissions"
import { useT } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"

const ICON: Record<string, typeof Ticket> = {
  "badge-check": BadgeCheck,
  ticket: Ticket,
  receipt: Receipt,
  gem: Gem,
}

export function DashboardNav() {
  const t = useT()
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const sections = dashboardSectionsForRole(user?.role)

  const items = [
    { href: "/dashboard", labelKey: "dash.overview", icon: "overview" },
    ...sections,
  ]

  return (
    <nav className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {items.map(({ href, labelKey, icon }) => {
        const active =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href)
        const Icon = icon === "overview" ? LayoutDashboard : ICON[icon] ?? Ticket
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
              active
                ? "bg-primary/20 text-primary shadow-[0_0_20px_-8px] shadow-primary/60"
                : "glass text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {t(labelKey)}
          </Link>
        )
      })}
    </nav>
  )
}
