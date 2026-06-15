"use client"

import { useT } from "@/lib/i18n"
import type {
  PaymentStatus,
  TicketStatus,
  VerificationStatus,
} from "@/lib/types"
import { cn } from "@/lib/utils"

const TONE = {
  neutral: "bg-white/10 text-foreground/70",
  blue: "bg-sky-400/15 text-sky-300 ring-1 ring-sky-400/30",
  green: "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30",
  amber: "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30",
  red: "bg-destructive/15 text-destructive ring-1 ring-destructive/30",
}

function Pill({ tone, children }: { tone: keyof typeof TONE; children: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONE[tone]
      )}
    >
      {children}
    </span>
  )
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const t = useT()
  const tone = status === "open" ? "amber" : status === "answered" ? "green" : "neutral"
  return <Pill tone={tone}>{t(`dash.status.${status}`)}</Pill>
}

export function VerificationStatusBadge({
  status,
}: {
  status: VerificationStatus
}) {
  const t = useT()
  const tone =
    status === "pending" ? "amber" : status === "approved" ? "green" : "red"
  return <Pill tone={tone}>{t(`dash.status.${status}`)}</Pill>
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const t = useT()
  return (
    <Pill tone={status === "settled" ? "green" : "amber"}>
      {t(`dash.pay.${status}`)}
    </Pill>
  )
}
