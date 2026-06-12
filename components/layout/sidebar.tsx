"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bell,
  Disc3,
  Home,
  LayoutDashboard,
  ListMusic,
  Mic2,
  Settings,
} from "lucide-react"

import { Brand } from "@/components/layout/brand"
import { TierBadge } from "@/components/common/tier-badge"
import { canAccessDashboard, canAccessStudio } from "@/lib/auth/permissions"
import { useT } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"

interface Item {
  href: string
  label: string
  icon: typeof Home
}

export function Sidebar() {
  const t = useT()
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)

  const items: Item[] = [
    { href: "/", label: t("nav.home"), icon: Home },
    { href: "/browse", label: t("nav.browse"), icon: Disc3 },
    { href: "/library/playlists", label: t("nav.playlists"), icon: ListMusic },
    { href: "/notifications", label: t("nav.notifications"), icon: Bell },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ]
  if (user && canAccessStudio(user.role))
    items.push({ href: "/studio", label: t("nav.studio"), icon: Mic2 })
  if (user && canAccessDashboard(user.role))
    items.push({
      href: "/dashboard",
      label: t("nav.dashboard"),
      icon: LayoutDashboard,
    })

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <aside className="fixed top-4 bottom-4 start-4 z-40 hidden w-[248px] flex-col rounded-3xl glass p-4 md:flex">
      <div className="px-2 pt-1 pb-4">
        <Brand />
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-primary/15 text-primary shadow-[0_0_24px_-8px] shadow-primary/60"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          )
        })}
      </nav>

      {user && (
        <Link
          href={`/u/${user.handle}`}
          className="mt-2 flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2.5 transition hover:bg-white/10"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {user.displayName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.handle}
            </p>
          </div>
          <TierBadge tier={user.tier} />
        </Link>
      )}
    </aside>
  )
}
