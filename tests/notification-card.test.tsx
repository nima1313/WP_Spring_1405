import { describe, expect, it, vi } from "vitest"
import { fireEvent, screen } from "@testing-library/react"

import { NotificationCard } from "@/components/notifications/notification-card"
import type { AppNotification } from "@/lib/types"
import { renderWithI18n } from "./utils"

function makeNotification(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: "nt_1",
    userId: "u_1",
    kind: "new_follower",
    title: "دنبال‌کننده جدید",
    body: "کسی شما را دنبال کرد.",
    read: false,
    createdAt: "2024-05-04T10:00:00.000Z",
    ...overrides,
  }
}

describe("NotificationCard", () => {
  it("renders the title and body", () => {
    renderWithI18n(
      <NotificationCard
        notification={makeNotification()}
        onMarkRead={() => {}}
        onDelete={() => {}}
      />
    )
    expect(screen.getByText("دنبال‌کننده جدید")).toBeInTheDocument()
  })

  it("shows an unread indicator only when unread", () => {
    const { rerender } = renderWithI18n(
      <NotificationCard
        notification={makeNotification({ read: false })}
        onMarkRead={() => {}}
        onDelete={() => {}}
      />
    )
    expect(screen.getByLabelText("unread")).toBeInTheDocument()

    rerender(
      <NotificationCard
        notification={makeNotification({ read: true })}
        onMarkRead={() => {}}
        onDelete={() => {}}
      />
    )
    expect(screen.queryByLabelText("unread")).not.toBeInTheDocument()
  })

  it("calls onMarkRead and onDelete from the action buttons", () => {
    const onMarkRead = vi.fn()
    const onDelete = vi.fn()
    renderWithI18n(
      <NotificationCard
        notification={makeNotification()}
        onMarkRead={onMarkRead}
        onDelete={onDelete}
      />
    )
    fireEvent.click(screen.getByTitle("علامت‌گذاری به عنوان خوانده‌شده"))
    expect(onMarkRead).toHaveBeenCalledWith("nt_1")
    fireEvent.click(screen.getByTitle("حذف اعلان"))
    expect(onDelete).toHaveBeenCalledWith("nt_1")
  })
})
