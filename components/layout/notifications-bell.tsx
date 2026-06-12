"use client"

import Link from "next/link"
import { Bell } from "lucide-react"

import { useUnreadCount } from "@/lib/queries"
import { useI18n, useT } from "@/lib/i18n"
import { toFaDigits } from "@/lib/format"
import { useAuthStore } from "@/store/auth-store"

export function NotificationsBell() {
  const t = useT()
  const { locale } = useI18n()
  const user = useAuthStore((s) => s.user)
  const { data: count = 0 } = useUnreadCount(user?.id)

  return (
    <Link
      href="/notifications"
      aria-label={t("nav.notifications")}
      className="relative grid size-10 place-items-center rounded-full glass transition hover:bg-white/10"
    >
      <Bell className="size-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -end-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {locale === "fa" ? toFaDigits(count) : count}
        </span>
      )}
    </Link>
  )
}
