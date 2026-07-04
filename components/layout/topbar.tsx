"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

import { Brand } from "@/components/layout/brand"
import { LanguageToggle } from "@/components/layout/language-toggle"
import { NotificationsBell } from "@/components/layout/notifications-bell"
import { UserMenu } from "@/components/layout/user-menu"
import { useT } from "@/lib/i18n"

export function Topbar() {
  const t = useT()
  const router = useRouter()
  const [q, setQ] = React.useState("")

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    router.push(`/browse${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`)
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 md:px-8 md:py-4">
      <div className="md:hidden">
        <Brand showName={false} />
      </div>

      <form onSubmit={onSubmit} className="relative flex-1 md:max-w-md">
        <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("common.search")}
          className="bg-sidebar/70 shadow-sm h-11 w-full rounded-2xl glass ps-10 pe-4 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
        />
      </form>

      <div className="flex items-center gap-2">
        <LanguageToggle className="hidden sm:flex" />
        <NotificationsBell />
        <UserMenu />
      </div>
    </header>
  )
}
