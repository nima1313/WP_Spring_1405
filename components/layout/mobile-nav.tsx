"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Disc3, Home, ListMusic, User as UserIcon } from "lucide-react"

import { useT } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"

export function MobileNav() {
  const t = useT()
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)

  const items = [
    { href: "/", label: t("nav.home"), icon: Home },
    { href: "/library/playlists", label: t("nav.playlists"), icon: ListMusic },
    { href: "/browse", label: t("nav.browse"), icon: Disc3, center: true },
    { href: "/notifications", label: t("nav.notifications"), icon: Bell },
    {
      href: user ? `/u/${user.handle}` : "/settings",
      label: t("nav.profile"),
      icon: UserIcon,
    },
  ]

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <nav className="fixed bottom-4 start-3 end-3 z-40 flex items-center justify-around rounded-2xl glass-strong px-2 py-2 md:hidden">
      {items.map(({ href, label, icon: Icon, center }) =>
        center ? (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className="grid size-12 -translate-y-3 place-items-center rounded-2xl bg-gradient-to-br from-primary to-fuchsia-500 text-primary-foreground shadow-lg shadow-primary/40"
          >
            <Icon className="size-6" />
          </Link>
        ) : (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={cn(
              "grid size-11 place-items-center rounded-xl transition",
              isActive(href)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-5" />
          </Link>
        )
      )}
    </nav>
  )
}
