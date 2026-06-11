import { ensureSeeded } from "@/lib/db/seed"
import { delay, KEYS, readList, writeList } from "@/lib/db/storage"
import type { AccountingRow } from "@/lib/types"

function db(): AccountingRow[] {
  ensureSeeded()
  return readList<AccountingRow>(KEYS.accounting)
}

export async function listAccounting(): Promise<AccountingRow[]> {
  return delay(db())
}

export async function settlePayment(id: string): Promise<AccountingRow> {
  const rows = db()
  const idx = rows.findIndex((r) => r.id === id)
  if (idx === -1) throw new Error("ردیف یافت نشد.")
  rows[idx] = { ...rows[idx], status: "settled" }
  writeList(KEYS.accounting, rows)
  return delay(rows[idx])
}
