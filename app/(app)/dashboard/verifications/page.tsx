"use client"

import { useRouter } from "next/navigation"
import { BadgeCheck } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/common/empty-state"
import { VerificationStatusBadge } from "@/components/dashboard/status-badge"
import { useVerifications } from "@/lib/queries"
import { useT } from "@/lib/i18n"

export default function VerificationsPage() {
  const t = useT()
  const router = useRouter()
  const { data: verifications = [] } = useVerifications()

  if (verifications.length === 0) {
    return <EmptyState icon={BadgeCheck} title={t("empty.generic")} />
  }

  return (
    <div className="overflow-hidden rounded-3xl glass">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>{t("dash.artistName")}</TableHead>
            <TableHead>{t("auth.email")}</TableHead>
            <TableHead>{t("dash.status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {verifications.map((v) => (
            <TableRow
              key={v.id}
              onClick={() => router.push(`/dashboard/verifications/${v.id}`)}
              className="cursor-pointer"
            >
              <TableCell className="font-medium">{v.artistName}</TableCell>
              <TableCell className="text-muted-foreground" dir="ltr">
                {v.email}
              </TableCell>
              <TableCell>
                <VerificationStatusBadge status={v.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
