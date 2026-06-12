"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Mic2 } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { JalaliDateInput } from "@/components/ui/jalali-date-input"
import { Label } from "@/components/ui/label"
import { registerListener, roleHome } from "@/lib/api/users"
import { useT } from "@/lib/i18n"
import type { Gender } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"

const schema = z
  .object({
    displayName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    confirm: z.string().min(6),
    birthday: z.string().optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
    acceptPrivacy: z.literal(true),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "mismatch",
  })
type Values = z.infer<typeof schema>

const GENDERS: Gender[] = ["male", "female", "other"]

export default function RegisterPage() {
  const t = useT()
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const setHydrated = useAuthStore((s) => s.setHydrated)
  const [privacyOpen, setPrivacyOpen] = React.useState(false)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirm: "",
      birthday: "",
      gender: undefined,
      acceptPrivacy: false as unknown as true,
    },
  })

  async function onSubmit(values: Values) {
    try {
      const user = await registerListener({
        displayName: values.displayName,
        email: values.email,
        password: values.password,
        birthday: values.birthday || undefined,
        gender: values.gender,
      })
      setUser(user)
      setHydrated(true)
      toast.success(`${t("auth.registerSubtitle")} 🎉`)
      router.push(roleHome(user.role))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا")
    }
  }

  const errors = form.formState.errors

  return (
    <div className="rounded-[2rem] glass-strong p-7 shadow-2xl shadow-primary/10">
      <h1 className="font-display text-2xl font-extrabold">
        {t("auth.register")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("auth.registerSubtitle")}
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="displayName">{t("auth.username")}</Label>
          <Input id="displayName" {...form.register("displayName")} />
          {errors.displayName && (
            <p className="text-xs text-destructive">{t("auth.username")} ✗</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">{t("auth.email")}</Label>
          <Input id="email" type="email" dir="ltr" {...form.register("email")} />
          {errors.email && (
            <p className="text-xs text-destructive">{t("auth.email")} ✗</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              dir="ltr"
              {...form.register("password")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">{t("auth.confirmPassword")}</Label>
            <Input
              id="confirm"
              type="password"
              dir="ltr"
              {...form.register("confirm")}
            />
          </div>
        </div>
        {errors.confirm && (
          <p className="text-xs text-destructive">
            {t("auth.confirmPassword")} ✗
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>{t("auth.birthday")}</Label>
            <Controller
              control={form.control}
              name="birthday"
              render={({ field }) => (
                <JalaliDateInput
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("auth.gender")}</Label>
            <Controller
              control={form.control}
              name="gender"
              render={({ field }) => (
                <div className="flex h-9 items-center gap-1 rounded-md glass p-1">
                  {GENDERS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => field.onChange(g)}
                      className={cn(
                        "flex-1 rounded-sm px-1 py-1 text-xs transition",
                        field.value === g
                          ? "bg-primary/20 text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t(`auth.gender.${g}`)}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>
        </div>

        <Controller
          control={form.control}
          name="acceptPrivacy"
          render={({ field }) => (
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={field.value === true}
                onChange={(e) => field.onChange(e.target.checked)}
                className="mt-0.5 size-4 accent-[var(--primary)]"
              />
              <span className="text-muted-foreground">
                {t("auth.acceptPrivacy")} (
                <button
                  type="button"
                  onClick={() => setPrivacyOpen(true)}
                  className="text-primary hover:underline"
                >
                  {t("auth.privacy")}
                </button>
                )
              </span>
            </label>
          )}
        />
        {errors.acceptPrivacy && (
          <p className="text-xs text-destructive">{t("auth.acceptPrivacy")} ✗</p>
        )}

        <Button
          type="submit"
          className="h-11 w-full rounded-xl text-base"
          disabled={form.formState.isSubmitting}
        >
          {t("auth.register")}
        </Button>
      </form>

      <div className="mt-4 space-y-2 text-center text-sm">
        <p className="text-muted-foreground">
          {t("auth.haveAccount")}{" "}
          <Link href="/login" className="text-primary hover:underline">
            {t("auth.login")}
          </Link>
        </p>
        <Link
          href="/register/artist"
          className="inline-flex items-center gap-1.5 rounded-full glass px-4 py-1.5 text-xs transition hover:bg-white/10"
        >
          <Mic2 className="size-3.5" />
          {t("auth.asArtist")}
        </Link>
      </div>

      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>{t("auth.privacyTitle")}</DialogTitle>
            <DialogDescription className="text-start leading-7">
              اطلاعات حساب شما تنها برای ارائه خدمات استریم موسیقی استفاده می‌شود.
              نوا داده‌های شما را با اشخاص ثالث به اشتراک نمی‌گذارد و شما در هر
              زمان می‌توانید حساب خود را حذف کنید. با ادامه ثبت‌نام، استفاده از
              این اطلاعات را می‌پذیرید.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                form.setValue("acceptPrivacy", true as unknown as true, {
                  shouldValidate: true,
                })
                setPrivacyOpen(false)
              }}
            >
              {t("auth.acceptPrivacy")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
