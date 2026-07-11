"use client"

import * as React from "react"

import { getCurrentUser } from "@/lib/api/users"
import { useAuthStore } from "@/store/auth-store"
import { usePlayerStore } from "@/store/player-store"

// Runs once on mount: rehydrates persisted stores, then reconciles the auth
// session against the backend (GET /api/me). Kept out of SSR so hydration stays
// clean. The backend owns all data now — there is no client-side seeding.

export function Bootstrap() {
  React.useEffect(() => {
    void usePlayerStore.persist.rehydrate()
    void useAuthStore.persist.rehydrate()

    // /api/me is the source of truth. Show the persisted snapshot instantly to
    // avoid a flash, then always reconcile against the backend so a stale
    // snapshot — or a session that no longer matches (deleted account) — can't
    // linger.
    const stored = useAuthStore.getState().user
    if (stored) useAuthStore.getState().setHydrated(true)
    getCurrentUser().then((u) => {
      useAuthStore.getState().setUser(u)
      useAuthStore.getState().setHydrated(true)
    })
  }, [])

  return null
}
