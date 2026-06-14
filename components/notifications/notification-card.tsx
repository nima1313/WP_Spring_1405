"use client"

import Link from "next/link"
import {
  Bell,
  BadgeCheck,
  Check,
  CreditCard,
  Disc3,
  Trash2,
  UserPlus,
  Wallet,
} from "lucide-react"

import { useT } from "@/lib/i18n"
import { toJalali } from "@/lib/jalali"
import type { AppNotification, NotificationKind } from "@/lib/types"
import { cn } from "@/lib/utils"

const ICONS: Record<NotificationKind, typeof Bell> = {
  subscription_expiry: CreditCard,
  new_follower: UserPlus,
  new_release: Disc3,
  verification_result: BadgeCheck,
  monthly_finance: Wallet,
  new_ticket: Bell,
  verification_request: BadgeCheck,
}

export function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: AppNotification
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const t = useT()
  const Icon = ICONS[notification.kind] ?? Bell
  const unread = !notification.read

  const body = (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl",
          unread ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {unread && (
            <span
              aria-label="unread"
              className="size-2 shrink-0 rounded-full bg-primary shadow-[0_0_8px] shadow-primary"
            />
          )}
          <p className="truncate text-sm font-semibold">{notification.title}</p>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {notification.body}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          {toJalali(notification.createdAt)}
        </p>
      </div>
    </div>
  )

  return (
    <div
      data-unread={unread}
      className={cn(
        "group flex items-center gap-2 rounded-2xl px-4 py-3 transition",
        unread ? "glass-strong bg-primary/5" : "glass"
      )}
    >
      {notification.href ? (
        <Link
          href={notification.href}
          onClick={() => unread && onMarkRead(notification.id)}
          className="min-w-0 flex-1"
        >
          {body}
        </Link>
      ) : (
        <div className="min-w-0 flex-1">{body}</div>
      )}

      <div className="flex shrink-0 items-center gap-1">
        {unread && (
          <button
            type="button"
            aria-label={t("notif.markRead")}
            title={t("notif.markRead")}
            onClick={() => onMarkRead(notification.id)}
            className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
          >
            <Check className="size-4" />
          </button>
        )}
        <button
          type="button"
          aria-label={t("notif.delete")}
          title={t("notif.delete")}
          onClick={() => onDelete(notification.id)}
          className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  )
}
