import { pushNotification } from "@/lib/api/notifications"
import { ensureSeeded } from "@/lib/db/seed"
import { delay, KEYS, readList, writeList } from "@/lib/db/storage"
import type { Artist, User, Verification } from "@/lib/types"

function db(): Verification[] {
  ensureSeeded()
  return readList<Verification>(KEYS.verifications)
}

export async function listVerifications(): Promise<Verification[]> {
  return delay(
    [...db()].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  )
}

export async function getVerification(id: string): Promise<Verification | null> {
  return delay(db().find((v) => v.id === id) ?? null)
}

function notifyArtistUser(
  artistId: string,
  title: string,
  body: string
): void {
  const user = readList<User>(KEYS.users).find((u) => u.artistId === artistId)
  if (user) {
    pushNotification({
      userId: user.id,
      kind: "verification_result",
      title,
      body,
    })
  }
}

function setArtistStatus(
  artistId: string,
  patch: Partial<Artist>
): void {
  const artists = readList<Artist>(KEYS.artists)
  const idx = artists.findIndex((a) => a.id === artistId)
  if (idx !== -1) {
    artists[idx] = { ...artists[idx], ...patch }
    writeList(KEYS.artists, artists)
  }
}

export async function approveVerification(id: string): Promise<Verification> {
  const list = db()
  const idx = list.findIndex((v) => v.id === id)
  if (idx === -1) throw new Error("درخواست یافت نشد.")
  list[idx] = { ...list[idx], status: "approved", reason: undefined }
  writeList(KEYS.verifications, list)
  setArtistStatus(list[idx].artistId, { verified: true, status: "approved" })
  notifyArtistUser(
    list[idx].artistId,
    "حساب هنرمندی شما تأیید شد",
    "اکنون می‌توانید آثار خود را در استودیو منتشر کنید."
  )
  return delay(list[idx])
}

export async function rejectVerification(
  id: string,
  reason: string
): Promise<Verification> {
  const list = db()
  const idx = list.findIndex((v) => v.id === id)
  if (idx === -1) throw new Error("درخواست یافت نشد.")
  list[idx] = { ...list[idx], status: "rejected", reason }
  writeList(KEYS.verifications, list)
  setArtistStatus(list[idx].artistId, { verified: false, status: "rejected" })
  notifyArtistUser(
    list[idx].artistId,
    "درخواست احراز هویت رد شد",
    `علت: ${reason}`
  )
  return delay(list[idx])
}
