"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Brand } from "@/components/layout/brand"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { FullscreenPlayer } from "@/components/player/fullscreen-player"
import { LyricsView } from "@/components/player/lyrics-view"
import { PlayerBar } from "@/components/player/player-bar"
import { QueuePanel } from "@/components/player/queue-panel"
import { useAuthStore } from "@/store/auth-store"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const hydrated = useAuthStore((s) => s.hydrated)
  const user = useAuthStore((s) => s.user)

  React.useEffect(() => {
    if (hydrated && !user) router.replace("/login")
  }, [hydrated, user, router])

  if (!hydrated) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="animate-pulse">
          <Brand />
        </div>
      </div>
    )
  }
  if (!user) return null

  return (
    <div className="relative min-h-dvh">
      <Sidebar />
      <div className="flex min-h-dvh flex-col md:ps-[272px]">
        <Topbar />
        <main className="flex-1 px-4 pb-44 md:px-8 md:pb-32">{children}</main>
      </div>
      <PlayerBar />
      <MobileNav />
      <FullscreenPlayer />
      <QueuePanel />
      <LyricsView />
    </div>
  )
}
