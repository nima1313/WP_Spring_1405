"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Bell,
  Globe,
  Moon,
  Sun,
  Trash2,
  Volume2,
} from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { SubscriptionDialog } from "@/components/settings/subscription-dialog"
import { TierBadge } from "@/components/common/tier-badge"
import { updateMySettings } from "@/lib/api/settings"
import { deleteAccount, getCurrentUser } from "@/lib/api/users"
import { useI18n, useT } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n"
import { toFaDigits } from "@/lib/format"
import { toJalali } from "@/lib/jalali"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import { usePlayerStore } from "@/store/player-store"

function Row({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: typeof Bell
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl glass px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          <Icon className="size-4.5" />
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <div className="shrink-0 sm:min-w-[180px] sm:text-end">{children}</div>
    </div>
  )
}

export default function SettingsPage() {
  const t = useT()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale, setLocale } = useI18n()
  const { theme, setTheme } = useTheme()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const clear = useAuthStore((s) => s.clear)

  // The payment gateway redirects back here with ?payment=success|failed. Toast
  // the outcome, refresh the session (the tier/expiry changed server-side), and
  // strip the query so a refresh doesn't re-toast.
  const paymentResult = searchParams.get("payment")
  React.useEffect(() => {
    if (!paymentResult) return
    if (paymentResult === "success") {
      getCurrentUser().then((u) => u && setUser(u))
      toast.success(t("settings.planUpdated"))
    } else {
      toast.error(t("settings.planUpdated"))
    }
    router.replace("/settings")
  }, [paymentResult, router, setUser, t])

  const volume = usePlayerStore((s) => s.volume)
  const setVolume = usePlayerStore((s) => s.setVolume)

  const [notifEnabled, setNotifEnabled] = React.useState(true)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [planOpen, setPlanOpen] = React.useState(false)

  if (!user) return null

  function onDelete() {
    deleteAccount(user!.id).then(() => {
      clear()
      toast.success(t("settings.deleteAccount"))
      router.replace("/login")
    })
  }

  return (
    <div className="space-y-6 pt-2">
      <h1 className="font-display text-2xl font-extrabold md:text-3xl">
        {t("settings.title")}
      </h1>

      {/* Subscription */}
      <section className="space-y-3">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-primary/25 via-fuchsia-500/10 to-transparent p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                {t("settings.subscription")}
              </p>
              <div className="mt-1">
                <TierBadge tier={user.tier} className="text-sm" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("settings.expiresOn")}:{" "}
                {toJalali(user.subscriptionExpiresAt)}
              </p>
            </div>
            <Button onClick={() => setPlanOpen(true)} className="shrink-0">
              {user.tier === "gold"
                ? t("settings.managePlan")
                : t("settings.upgrade")}
            </Button>
          </div>
        </div>
      </section>

      <div className="space-y-3">
        <Row
          icon={Bell}
          title={t("settings.notifications")}
          hint={t("settings.notificationsHint")}
        >
          <Switch
            checked={notifEnabled}
            onCheckedChange={(v) => setNotifEnabled(v === true)}
          />
        </Row>

        <Row icon={Volume2} title={t("settings.volume")}>
          <div className="flex items-center gap-3" dir="ltr">
            <Slider
              value={[Math.round(volume * 100)]}
              max={100}
              step={1}
              onValueChange={(v) =>
                setVolume((Array.isArray(v) ? v[0] : v) / 100)
              }
              className="w-40"
            />
            <span className="w-9 text-end text-xs tabular-nums text-muted-foreground">
              {locale === "fa"
                ? toFaDigits(Math.round(volume * 100))
                : Math.round(volume * 100)}
            </span>
          </div>
        </Row>

        <Row icon={Globe} title={t("settings.language")}>
          <div className="inline-flex items-center gap-1 rounded-xl glass p-1">
            {(["fa", "en"] as Locale[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => {
                  setLocale(l)
                  void updateMySettings({ locale: l }).catch(() => undefined)
                }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                  locale === l
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {l === "fa" ? "فارسی" : "English"}
              </button>
            ))}
          </div>
        </Row>

        <Row icon={theme === "light" ? Sun : Moon} title={t("settings.theme")}>
          <div className="inline-flex items-center gap-1 rounded-xl glass p-1">
            {(["dark", "light"] as const).map((th) => (
              <button
                key={th}
                type="button"
                onClick={() => {
                  setTheme(th)
                  void updateMySettings({ theme: th }).catch(() => undefined)
                }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                  theme === th
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t(`settings.theme.${th}`)}
              </button>
            ))}
          </div>
        </Row>

        <Row
          icon={Trash2}
          title={t("settings.deleteAccount")}
          hint={t("settings.deleteAccountHint")}
        >
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            {t("settings.deleteAccount")}
          </Button>
        </Row>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>{t("settings.deleteAccount")}</DialogTitle>
            <DialogDescription>
              {t("settings.deleteAccountHint")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SubscriptionDialog open={planOpen} onOpenChange={setPlanOpen} />
    </div>
  )
}
