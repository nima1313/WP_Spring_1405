"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { getMySettings } from "@/lib/api/settings"
import { useI18n } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n/dictionaries"
import { useAuthStore } from "@/store/auth-store"

// §3.5 preference sync (pull side): whenever a user signs in, fetch their
// server-stored settings and apply language + theme locally. The push side
// (persisting a change) lives in the settings page toggles, which call
// updateMySettings. Kept as a null-rendering component mounted under both the
// theme and i18n providers so it can drive them.

export function PreferenceSync() {
  const userId = useAuthStore((s) => s.user?.id)
  const { setLocale, locale } = useI18n()
  const { setTheme } = useTheme()
  const appliedFor = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!userId || appliedFor.current === userId) return
    appliedFor.current = userId
    getMySettings()
      .then((s) => {
        if (s.locale && s.locale !== locale) setLocale(s.locale as Locale)
        if (s.theme) setTheme(s.theme)
      })
      .catch(() => {
        // Non-fatal: fall back to the locally persisted preferences.
        appliedFor.current = null
      })
  }, [userId, setLocale, setTheme, locale])

  return null
}
