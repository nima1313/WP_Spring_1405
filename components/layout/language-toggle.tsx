"use client"

import { Languages } from "lucide-react"

import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n()
  return (
    <button
      type="button"
      aria-label="toggle language"
      onClick={() => setLocale(locale === "fa" ? "en" : "fa")}
      className={cn(
        "flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-xs font-medium transition hover:bg-white/10",
        className
      )}
    >
      <Languages className="size-4" />
      {locale === "fa" ? "EN" : "فا"}
    </button>
  )
}
