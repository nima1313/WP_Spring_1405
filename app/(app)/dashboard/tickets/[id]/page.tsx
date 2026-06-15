"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ChevronRight, Send } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/common/empty-state"
import { TicketStatusBadge } from "@/components/dashboard/status-badge"
import { Textarea } from "@/components/ui/textarea"
import { useTicket, useTicketMutations } from "@/lib/queries"
import { useT } from "@/lib/i18n"
import { toJalali } from "@/lib/jalali"
import { cn } from "@/lib/utils"

export default function TicketDetailPage() {
  const t = useT()
  const params = useParams<{ id: string }>()
  const { data: ticket, isLoading } = useTicket(params.id)
  const { reply } = useTicketMutations()
  const [body, setBody] = React.useState("")

  if (!isLoading && !ticket) {
    return <EmptyState title={t("empty.generic")} />
  }
  if (!ticket) return null

  function onSend() {
    if (!body.trim()) return
    reply.mutate(
      { id: ticket!.id, body: body.trim() },
      {
        onSuccess: () => {
          setBody("")
          toast.success(t("common.send"))
        },
      }
    )
  }

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard/tickets"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className="size-4 rtl:rotate-0 ltr:rotate-180" />
        {t("dash.tickets")}
      </Link>

      <div className="rounded-3xl glass p-5">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h2 className="font-display text-lg font-bold">{ticket.subject}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {ticket.userName} · {toJalali(ticket.createdAt)}
            </p>
          </div>
          <TicketStatusBadge status={ticket.status} />
        </div>

        <div className="space-y-3 py-4">
          {ticket.messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex",
                m.authorRole === "support" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                  m.authorRole === "support"
                    ? "bg-primary/20 text-foreground"
                    : "glass"
                )}
              >
                <p>{m.body}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {toJalali(m.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {ticket.status !== "closed" && (
          <div className="flex items-end gap-2 border-t border-white/10 pt-4">
            <Textarea
              rows={2}
              value={body}
              placeholder={t("dash.reply")}
              onChange={(e) => setBody(e.target.value)}
              className="flex-1 resize-none"
            />
            <Button onClick={onSend} disabled={reply.isPending} className="gap-2">
              <Send className="size-4" />
              {t("common.send")}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
