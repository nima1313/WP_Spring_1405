"use client"

import { BellOff, CheckCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/common/empty-state"
import { NotificationCard } from "@/components/notifications/notification-card"
import { useNotificationMutations, useNotifications } from "@/lib/queries"
import { useT } from "@/lib/i18n"
import { useAuthStore } from "@/store/auth-store"

export default function NotificationsPage() {
  const t = useT()
  const user = useAuthStore((s) => s.user)
  const { data: notifications = [] } = useNotifications(user?.id)
  const { markRead, markAll, remove } = useNotificationMutations(user?.id)

  const hasUnread = notifications.some((n) => !n.read)

  return (
    <div className="space-y-5 pt-2">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold md:text-3xl">
          {t("notif.title")}
        </h1>
        {hasUnread && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => markAll.mutate()}
          >
            <CheckCheck className="size-4" />
            {t("notif.markAllRead")}
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={BellOff} title={t("notif.empty")} />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              onMarkRead={(id) => markRead.mutate(id)}
              onDelete={(id) => remove.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
