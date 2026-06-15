"use client"

import { useRouter } from "next/navigation"
import { Inbox } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/common/empty-state"
import { TicketStatusBadge } from "@/components/dashboard/status-badge"
import { useTickets } from "@/lib/queries"
import { useT } from "@/lib/i18n"
import { toJalali } from "@/lib/jalali"

export default function TicketsPage() {
  const t = useT()
  const router = useRouter()
  const { data: tickets = [] } = useTickets()

  if (tickets.length === 0) {
    return <EmptyState icon={Inbox} title={t("empty.generic")} />
  }

  return (
    <div className="overflow-hidden rounded-3xl glass">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>{t("dash.ticketId")}</TableHead>
            <TableHead>{t("dash.user")}</TableHead>
            <TableHead>{t("dash.subject")}</TableHead>
            <TableHead className="hidden sm:table-cell">{t("dash.date")}</TableHead>
            <TableHead>{t("dash.status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((tk) => (
            <TableRow
              key={tk.id}
              onClick={() => router.push(`/dashboard/tickets/${tk.id}`)}
              className="cursor-pointer"
            >
              <TableCell className="font-mono text-xs" dir="ltr">
                {tk.id}
              </TableCell>
              <TableCell>{tk.userName}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {tk.subject}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                {toJalali(tk.createdAt)}
              </TableCell>
              <TableCell>
                <TicketStatusBadge status={tk.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
