import { api, call } from "@/lib/api/client"
import type { AccountingRow } from "@/lib/types"

export async function listAccounting(): Promise<AccountingRow[]> {
  // The backend recomputes the current month from stream events on read and
  // scopes the rows to the caller's role (admin: all, artist: own).
  return call(() => api.get("accounting").json<AccountingRow[]>())
}

export async function settlePayment(id: string): Promise<AccountingRow> {
  return call(() =>
    api.post(`accounting/${id}/settle`).json<AccountingRow>()
  )
}
