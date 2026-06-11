"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { User } from "@/lib/types"

interface AuthState {
  user: User | null
  hydrated: boolean
  setUser: (user: User | null) => void
  clear: () => void
  setHydrated: (v: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hydrated: false,
      setUser: (user) => set({ user }),
      clear: () => set({ user: null }),
      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name: "nava-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user }),
      // We rehydrate manually after mount so SSR (always logged-out) and the
      // first client render agree, avoiding hydration mismatches.
      skipHydration: true,
    }
  )
)
