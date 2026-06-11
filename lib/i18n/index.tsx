"use client"

import * as React from "react"
import {
  dictionaries,
  dirFor,
  type Locale,
  LOCALES,
} from "@/lib/i18n/dictionaries"

const STORAGE_KEY = "nava-locale"

interface I18nContextValue {
  locale: Locale
  dir: "rtl" | "ltr"
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = React.createContext<I18nContextValue | null>(null)

function applyDocument(locale: Locale) {
  if (typeof document === "undefined") return
  document.documentElement.lang = locale
  document.documentElement.dir = dirFor(locale)
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>("fa")

  // Read persisted locale after mount (avoids SSR/client mismatch — the server
  // always renders fa/rtl, matching the <html> attributes).
  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && LOCALES.includes(stored as Locale)) {
      // Intentional post-hydration sync from an external store (localStorage);
      // doing it in render would cause an SSR/client hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocaleState(stored as Locale)
      applyDocument(stored as Locale)
    }
  }, [])

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
    applyDocument(next)
  }, [])

  const t = React.useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const table = dictionaries[locale]
      let value = table[key] ?? dictionaries.fa[key] ?? key
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(new RegExp(`{${k}}`, "g"), String(v))
        }
      }
      return value
    },
    [locale]
  )

  const value = React.useMemo<I18nContextValue>(
    () => ({ locale, dir: dirFor(locale), setLocale, t }),
    [locale, setLocale, t]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within <I18nProvider>")
  return ctx
}

/** Convenience hook returning just the translate function. */
export function useT() {
  return useI18n().t
}

export type { Locale }
