"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ShieldAlert } from "lucide-react"

import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { EmptyState } from "@/components/common/empty-state"
import { canAccessDashboard } from "@/lib/auth/permissions"
import { useT } from "@/lib/i18n"
import { useAuthStore } from "@/store/auth-store"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = useT()
  const router = useRouter()
  const hydrated = useAuthStore((s) => s.hydrated)
  const user = useAuthStore((s) => s.user)
  const allowed = canAccessDashboard(user?.role)

  React.useEffect(() => {
    if (hydrated && user && !allowed) router.replace("/")
  }, [hydrated, user, allowed, router])

  if (hydrated && user && !allowed) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title={t("dash.adminOnly")}
        className="mt-8"
      />
    )
  }

  return (
    <div className="space-y-6 pt-2">
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-2xl font-extrabold md:text-3xl">
          {t("dash.title")}
        </h1>
        <DashboardNav />
      </div>
      {children}
    </div>
  )
}
