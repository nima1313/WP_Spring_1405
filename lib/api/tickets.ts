import { HTTPError } from "ky"

import { api, call } from "@/lib/api/client"
import type { Ticket, TicketStatus } from "@/lib/types"

export async function listTickets(): Promise<Ticket[]> {
  return call(() => api.get("tickets").json<Ticket[]>())
}

export async function getTicket(id: string): Promise<Ticket | null> {
  try {
    return await api.get(`tickets/${id}`).json<Ticket>()
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 404) return null
    throw error
  }
}

export async function replyToTicket(id: string, body: string): Promise<Ticket> {
  return call(() =>
    api.post(`tickets/${id}/messages`, { json: { body } }).json<Ticket>()
  )
}

export async function setTicketStatus(
  id: string,
  status: TicketStatus
): Promise<Ticket> {
  return call(() => api.patch(`tickets/${id}`, { json: { status } }).json<Ticket>())
}
