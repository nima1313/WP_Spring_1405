"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { registerArtist } from "@/lib/api/users"
import { useT } from "@/lib/i18n"

const schema = z.object({
  artistName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  sampleWorks: z.string().min(4),
})
type Values = z.infer<typeof schema>

export default function ArtistRegisterPage() {
  const t = useT()
  const [submitted, setSubmitted] = React.useState(false)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { artistName: "", email: "", password: "", sampleWorks: "" },
  })

  async function onSubmit(values: Values) {
    try {
      await registerArtist(values)
      setSubmitted(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا")
    }
  }

  if (submitted) {
    return (
      <div className="rounded-[2rem] glass-strong p-8 text-center shadow-2xl shadow-primary/10">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary/15 text-primary">
          <CheckCircle2 className="size-8" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-extrabold">
          {t("auth.pendingTitle")}
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {t("auth.pendingBody")}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 px-6 text-sm font-semibold text-primary-foreground"
        >
          {t("auth.login")}
        </Link>
      </div>
    )
  }

  const errors = form.formState.errors

  return (
    <div className="rounded-[2rem] glass-strong p-7 shadow-2xl shadow-primary/10">
      <h1 className="font-display text-2xl font-extrabold">
        {t("auth.asArtist")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("auth.sampleWorksHint")}
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="artistName">{t("auth.artistName")}</Label>
          <Input id="artistName" {...form.register("artistName")} />
          {errors.artistName && (
            <p className="text-xs text-destructive">{t("auth.artistName")} ✗</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("auth.email")}</Label>
          <Input id="email" type="email" dir="ltr" {...form.register("email")} />
          {errors.email && (
            <p className="text-xs text-destructive">{t("auth.email")} ✗</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <Input
            id="password"
            type="password"
            dir="ltr"
            {...form.register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{t("auth.password")} ✗</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sampleWorks">{t("auth.sampleWorks")}</Label>
          <Textarea
            id="sampleWorks"
            rows={3}
            placeholder={t("auth.sampleWorksHint")}
            {...form.register("sampleWorks")}
          />
          {errors.sampleWorks && (
            <p className="text-xs text-destructive">{t("auth.sampleWorks")} ✗</p>
          )}
        </div>
        <Button
          type="submit"
          className="h-11 w-full rounded-xl text-base"
          disabled={form.formState.isSubmitting}
        >
          {t("auth.submitRequest")}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t("auth.asListener")}{" "}
        <Link href="/register" className="text-primary hover:underline">
          {t("auth.register")}
        </Link>
      </p>
    </div>
  )
}
