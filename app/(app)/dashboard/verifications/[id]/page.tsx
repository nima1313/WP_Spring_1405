"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Check, ChevronRight, ExternalLink, X } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/common/empty-state"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { VerificationStatusBadge } from "@/components/dashboard/status-badge"
import { useVerification, useVerificationMutations } from "@/lib/queries"
import { useT } from "@/lib/i18n"
import { toJalali } from "@/lib/jalali"

export default function VerificationDetailPage() {
  const t = useT()
  const params = useParams<{ id: string }>()
  const { data: v, isLoading } = useVerification(params.id)
  const { approve, reject } = useVerificationMutations()
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [reason, setReason] = React.useState("")

  if (!isLoading && !v) return <EmptyState title={t("empty.generic")} />
  if (!v) return null

  const pending = v.status === "pending"

  function onApprove() {
    approve.mutate(v!.id, {
      onSuccess: () => toast.success(t("dash.approve")),
    })
  }

  function onReject() {
    if (!reason.trim()) return
    reject.mutate(
      { id: v!.id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success(t("dash.reject"))
          setRejectOpen(false)
        },
      }
    )
  }

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard/verifications"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className="size-4 rtl:rotate-0 ltr:rotate-180" />
        {t("dash.verifications")}
      </Link>

      <div className="space-y-5 rounded-3xl glass p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold">{v.artistName}</h2>
            <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
              {v.email}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {toJalali(v.createdAt)}
            </p>
          </div>
          <VerificationStatusBadge status={v.status} />
        </div>

        <div className="space-y-2">
          <Label>{t("auth.sampleWorks")}</Label>
          <a
            href={v.sampleWorks}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl glass px-4 py-2.5 text-sm text-primary transition hover:bg-white/10"
            dir="ltr"
          >
            <ExternalLink className="size-4" />
            {t("dash.viewSamples")}
          </a>
        </div>

        {v.reason && (
          <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {t("dash.rejectReason")}: {v.reason}
          </div>
        )}

        {pending && (
          <div className="flex items-center gap-2 border-t border-white/10 pt-5">
            <Button onClick={onApprove} disabled={approve.isPending} className="gap-2">
              <Check className="size-4" />
              {t("dash.approve")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setRejectOpen(true)}
              className="gap-2"
            >
              <X className="size-4" />
              {t("dash.reject")}
            </Button>
          </div>
        )}
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>{t("dash.rejectReason")}</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={3}
            value={reason}
            autoFocus
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("dash.rejectReason")}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={onReject}
              disabled={reject.isPending}
            >
              {t("dash.reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
