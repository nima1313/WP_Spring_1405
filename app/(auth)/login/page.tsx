"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login, roleHome } from "@/lib/api/users"
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/db/seed"
import { useT } from "@/lib/i18n"
import { useAuthStore } from "@/store/auth-store"

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
type Values = z.infer<typeof schema>

export default function LoginPage() {
  const t = useT()
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const setHydrated = useAuthStore((s) => s.setHydrated)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: Values) {
    try {
      const user = await login(values.email, values.password)
      setUser(user)
      setHydrated(true)
      toast.success(`${t("auth.loginSubtitle")} 🎵`)
      router.push(roleHome(user.role))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا")
    }
  }

  function quickLogin(email: string) {
    form.setValue("email", email)
    form.setValue("password", DEMO_PASSWORD)
    void form.handleSubmit(onSubmit)()
  }

  return (
    <div className="rounded-[2rem] glass-strong p-7 shadow-2xl shadow-primary/10">
      <h1 className="font-display text-2xl font-extrabold">{t("auth.login")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("auth.loginSubtitle")}
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("auth.email")}</Label>
          <Input
            id="email"
            type="email"
            dir="ltr"
            placeholder="you@nava.app"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{t("auth.email")} ✗</p>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              {t("auth.forgot")}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            dir="ltr"
            {...form.register("password")}
          />
        </div>
        <Button
          type="submit"
          className="h-11 w-full rounded-xl text-base"
          disabled={form.formState.isSubmitting}
        >
          {t("auth.login")}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t("auth.noAccount")}{" "}
        <Link href="/register" className="text-primary hover:underline">
          {t("auth.register")}
        </Link>
      </p>

      <div className="mt-6 border-t border-white/10 pt-4">
        <p className="mb-2 text-center text-xs text-muted-foreground">
          ورود سریع با حساب‌های نمونه
        </p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => quickLogin(acc.email)}
              className="rounded-full glass px-3 py-1 text-xs transition hover:bg-white/10"
            >
              {acc.role}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
