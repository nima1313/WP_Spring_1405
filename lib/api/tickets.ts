import { ensureSeeded } from "@/lib/db/seed"
import { delay, KEYS, readList, uid, writeList } from "@/lib/db/storage"
import type { Ticket, TicketStatus } from "@/lib/types"

function db(): Ticket[] {
  ensureSeeded()
  return readList<Ticket>(KEYS.tickets)
}

export async function listTickets(): Promise<Ticket[]> {
  return delay(
    [...db()].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  )
}

export async function getTicket(id: string): Promise<Ticket | null> {
  return delay(db().find((t) => t.id === id) ?? null)
}

export async function replyToTicket(
  id: string,
  body: string
): Promise<Ticket> {
  const tickets = db()
  const idx = tickets.findIndex((t) => t.id === id)
  if (idx === -1) throw new Error("تیکت یافت نشد.")
  tickets[idx] = {
    ...tickets[idx],
    status: "answered",
    messages: [
      ...tickets[idx].messages,
      {
        id: uid("m"),
        authorRole: "support",
        body,
        createdAt: new Date().toISOString(),
      },
    ],
  }
  writeList(KEYS.tickets, tickets)
  return delay(tickets[idx])
}

export async function setTicketStatus(
  id: string,
  status: TicketStatus
): Promise<Ticket> {
  const tickets = db()
  const idx = tickets.findIndex((t) => t.id === id)
  if (idx === -1) throw new Error("تیکت یافت نشد.")
  tickets[idx] = { ...tickets[idx], status }
  writeList(KEYS.tickets, tickets)
  return delay(tickets[idx])
}
