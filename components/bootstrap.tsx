"use client"

import * as React from "react"

import { getCurrentUser } from "@/lib/api/users"
import { ensureSeeded } from "@/lib/db/seed"
import { useAuthStore } from "@/store/auth-store"
import { usePlayerStore } from "@/store/player-store"

// Runs once on mount: seeds the mock DB, rehydrates persisted stores, then
// reconciles the auth session. Kept out of SSR so hydration stays clean.

export function Bootstrap() {
  React.useEffect(() => {
    ensureSeeded()
    void usePlayerStore.persist.rehydrate()
    void useAuthStore.persist.rehydrate()

    const stored = useAuthStore.getState().user
    if (!stored) {
      getCurrentUser().then((u) => {
        if (u) useAuthStore.getState().setUser(u)
        useAuthStore.getState().setHydrated(true)
      })
    } else {
      useAuthStore.getState().setHydrated(true)
    }
  }, [])

  return null
}
