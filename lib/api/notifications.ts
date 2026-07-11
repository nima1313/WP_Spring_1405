import { api, call } from "@/lib/api/client"
import type { AppNotification } from "@/lib/types"

// The backend scopes every notification query to the session user, so the
// userId argument is kept only for signature compatibility with phase 1.

export async function listNotifications(
  _userId: string
): Promise<AppNotification[]> {
  return call(() => api.get("notifications").json<AppNotification[]>())
}

export async function unreadCount(_userId: string): Promise<number> {
  const { count } = await call(() =>
    api.get("notifications/unread-count").json<{ count: number }>()
  )
  return count
}

export async function markRead(id: string): Promise<void> {
  await call(() => api.patch(`notifications/${id}`, { json: { read: true } }).text())
}

export async function markAllRead(_userId: string): Promise<void> {
  await call(() => api.post("notifications/mark-all-read").text())
}

export async function deleteNotification(id: string): Promise<void> {
  await call(() => api.delete(`notifications/${id}`).text())
}

// Note: notifications are now created only by the backend (verification results,
// settlements, new followers, staff fan-out). The phase-1 `pushNotification`
// client helper is intentionally gone.
