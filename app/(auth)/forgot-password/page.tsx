"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { MailCheck } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useT } from "@/lib/i18n"

const schema = z.object({ email: z.string().email() })
type Values = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const t = useT()
  const [sent, setSent] = React.useState(false)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  })

  // Phase 1 mock: "sends" a recovery email by simply showing a confirmation.
  function onSubmit() {
    setSent(true)
  }

  return (
    <div className="rounded-[2rem] glass-strong p-7 shadow-2xl shadow-primary/10">
      <h1 className="font-display text-2xl font-extrabold">
        {t("auth.forgotTitle")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("auth.forgotHint")}</p>

      {sent ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl glass px-6 py-8 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-primary/15 text-primary">
            <MailCheck className="size-7" />
          </div>
          <p className="text-sm text-muted-foreground">
            لینک بازیابی به {form.getValues("email")} ارسال شد.
          </p>
        </div>
      ) : (
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
          <Button type="submit" className="h-11 w-full rounded-xl text-base">
            {t("auth.sendRecovery")}
          </Button>
        </form>
      )}

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          {t("common.back")} {t("auth.login")}
        </Link>
      </p>
    </div>
  )
}
