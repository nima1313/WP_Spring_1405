"use client"

import { Receipt, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/common/empty-state"
import { PaymentStatusBadge } from "@/components/dashboard/status-badge"
import { useAccounting, usePrices, useSettlePayment } from "@/lib/queries"
import { canAccessDashboard, canSettlePayments } from "@/lib/auth/permissions"
import { useI18n, useT } from "@/lib/i18n"
import { formatNumber, formatPrice } from "@/lib/format"
import { useAuthStore } from "@/store/auth-store"

export default function AccountingPage() {
  const t = useT()
  const { locale } = useI18n()
  const user = useAuthStore((s) => s.user)
  const { data: rows = [] } = useAccounting()
  const { data: prices } = usePrices()
  const settle = useSettlePayment()

  // Accounting is admin-only (§11.2); support has no access.
  if (!canAccessDashboard(user?.role) || user?.role !== "admin") {
    return <EmptyState icon={ShieldAlert} title={t("dash.adminOnly")} />
  }

  const canSettle = canSettlePayments(user?.role)
  const currency = prices?.currency ?? "تومان"

  if (rows.length === 0) {
    return <EmptyState icon={Receipt} title={t("empty.generic")} />
  }

  return (
    <div className="overflow-hidden rounded-3xl glass">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>{t("dash.artistName")}</TableHead>
            <TableHead className="hidden sm:table-cell">
              {t("studio.stats")}
            </TableHead>
            <TableHead>{t("dash.uniqueListeners")}</TableHead>
            <TableHead className="hidden md:table-cell">
              {t("dash.streams")}
            </TableHead>
            <TableHead>{t("dash.reward")}</TableHead>
            <TableHead>{t("dash.payStatus")}</TableHead>
            {canSettle && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.artistName}</TableCell>
              <TableCell
                className="hidden sm:table-cell font-mono text-xs text-muted-foreground"
                dir="ltr"
              >
                {r.artistProId}
              </TableCell>
              <TableCell className="tabular-nums">
                {formatNumber(r.uniqueListeners, locale)}
              </TableCell>
              <TableCell className="hidden md:table-cell tabular-nums">
                {formatNumber(r.streams, locale)}
              </TableCell>
              <TableCell className="tabular-nums">
                {formatPrice(r.reward, currency, locale)}
              </TableCell>
              <TableCell>
                <PaymentStatusBadge status={r.status} />
              </TableCell>
              {canSettle && (
                <TableCell>
                  {r.status === "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={settle.isPending}
                      onClick={() =>
                        settle.mutate(r.id, {
                          onSuccess: () => toast.success(t("dash.settle")),
                        })
                      }
                    >
                      {t("dash.settle")}
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
