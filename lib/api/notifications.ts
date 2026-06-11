import { ensureSeeded } from "@/lib/db/seed"
import { delay, KEYS, readList, uid, writeList } from "@/lib/db/storage"
import type { AppNotification, NotificationKind } from "@/lib/types"

function db(): AppNotification[] {
  ensureSeeded()
  return readList<AppNotification>(KEYS.notifications)
}

export async function listNotifications(
  userId: string
): Promise<AppNotification[]> {
  return delay(
    db()
      .filter((n) => n.userId === userId)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  )
}

export async function unreadCount(userId: string): Promise<number> {
  return delay(db().filter((n) => n.userId === userId && !n.read).length)
}

export async function markRead(id: string): Promise<void> {
  const list = db()
  const idx = list.findIndex((n) => n.id === id)
  if (idx !== -1) {
    list[idx] = { ...list[idx], read: true }
    writeList(KEYS.notifications, list)
  }
  return delay(undefined)
}

export async function markAllRead(userId: string): Promise<void> {
  const list = db().map((n) => (n.userId === userId ? { ...n, read: true } : n))
  writeList(KEYS.notifications, list)
  return delay(undefined)
}

export async function deleteNotification(id: string): Promise<void> {
  writeList(
    KEYS.notifications,
    db().filter((n) => n.id !== id)
  )
  return delay(undefined)
}

/** Used by other repositories (e.g. verification decisions) to notify a user. */
export function pushNotification(input: {
  userId: string
  kind: NotificationKind
  title: string
  body: string
  href?: string
}): void {
  const list = db()
  list.push({
    id: uid("nt"),
    userId: input.userId,
    kind: input.kind,
    title: input.title,
    body: input.body,
    read: false,
    createdAt: new Date().toISOString(),
    href: input.href,
  })
  writeList(KEYS.notifications, list)
}
