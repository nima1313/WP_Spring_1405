import { ensureSeeded } from "@/lib/db/seed"
import { delay, KEYS, read, readList, uid, write, writeList } from "@/lib/db/storage"
import type { Artist, Gender, Role, User, Verification } from "@/lib/types"

function db(): User[] {
  ensureSeeded()
  return readList<User>(KEYS.users)
}

function creds(): Record<string, string> {
  ensureSeeded()
  return read<Record<string, string>>(KEYS.credentials, {})
}

export async function listUsers(): Promise<User[]> {
  return delay(db())
}

export async function getUserById(id: string): Promise<User | null> {
  return delay(db().find((u) => u.id === id) ?? null)
}

export async function getUserByHandle(handle: string): Promise<User | null> {
  const h = decodeURIComponent(handle)
  return delay(db().find((u) => u.handle === h) ?? null)
}

export async function login(email: string, password: string): Promise<User> {
  const users = db()
  const c = creds()
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (!user) throw new Error("ایمیل یافت نشد.")
  const stored = c[user.email]
  if (stored && stored !== password) throw new Error("رمز عبور نادرست است.")
  write(KEYS.sessionUserId, user.id)
  return delay(user)
}

export function logout(): void {
  write(KEYS.sessionUserId, null)
}

export async function getCurrentUser(): Promise<User | null> {
  const id = read<string | null>(KEYS.sessionUserId, null)
  if (!id) return null
  return getUserById(id)
}

interface RegisterListenerInput {
  displayName: string
  email: string
  password: string
  birthday?: string
  gender?: Gender
}

export async function registerListener(
  input: RegisterListenerInput
): Promise<User> {
  const users = db()
  if (users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
    throw new Error("این ایمیل قبلاً ثبت شده است.")
  }
  const suffix = Math.random().toString(36).slice(2, 6)
  const user: User = {
    id: uid("u"),
    handle: `@nava_${suffix}`,
    displayName: input.displayName,
    email: input.email,
    role: "listener",
    tier: "basic",
    subscriptionExpiresAt: new Date(
      Date.now() + 30 * 864e5
    ).toISOString(),
    birthday: input.birthday,
    gender: input.gender,
    followingUserIds: [],
    followingArtistIds: [],
    followerCount: 0,
    createdAt: new Date().toISOString(),
  }
  writeList(KEYS.users, [...users, user])
  const c = creds()
  c[input.email] = input.password
  write(KEYS.credentials, c)
  write(KEYS.sessionUserId, user.id)
  return delay(user)
}

interface RegisterArtistInput {
  artistName: string
  email: string
  password: string
  sampleWorks: string
}

export async function registerArtist(
  input: RegisterArtistInput
): Promise<Artist> {
  const users = db()
  if (users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
    throw new Error("این ایمیل قبلاً ثبت شده است.")
  }
  const artistId = uid("ar")
  const artist: Artist = {
    id: artistId,
    name: input.artistName,
    proId: `ART-${Math.floor(1000 + Math.random() * 9000)}`,
    bio: "",
    verified: false,
    status: "pending",
    sampleWorks: input.sampleWorks,
    email: input.email,
    followerCount: 0,
    monthlyListeners: 0,
    createdAt: new Date().toISOString(),
  }
  const artists = readList<Artist>(KEYS.artists)
  writeList(KEYS.artists, [...artists, artist])

  // queue a verification request for the support team
  const verifications = readList<Verification>(KEYS.verifications)
  writeList(KEYS.verifications, [
    ...verifications,
    {
      id: uid("vf"),
      artistId,
      artistName: input.artistName,
      email: input.email,
      sampleWorks: input.sampleWorks,
      status: "pending",
      createdAt: new Date().toISOString(),
    },
  ])

  // create the (pending) artist user account
  const suffix = Math.random().toString(36).slice(2, 6)
  const user: User = {
    id: uid("u"),
    handle: `@nava_${suffix}`,
    displayName: input.artistName,
    email: input.email,
    role: "artist",
    tier: "gold",
    subscriptionExpiresAt: new Date(Date.now() + 365 * 864e5).toISOString(),
    followingUserIds: [],
    followingArtistIds: [],
    followerCount: 0,
    artistId,
    createdAt: new Date().toISOString(),
  }
  artist.userId = user.id
  writeList(KEYS.artists, [...readList<Artist>(KEYS.artists)])
  writeList(KEYS.users, [...users, user])
  const c = creds()
  c[input.email] = input.password
  write(KEYS.credentials, c)
  return delay(artist)
}

export async function updateUser(
  id: string,
  patch: Partial<User>
): Promise<User> {
  const users = db()
  const idx = users.findIndex((u) => u.id === id)
  if (idx === -1) throw new Error("کاربر یافت نشد.")
  const updated = { ...users[idx], ...patch, id }
  users[idx] = updated
  writeList(KEYS.users, users)
  return delay(updated)
}

export async function deleteAccount(id: string): Promise<void> {
  const users = db().filter((u) => u.id !== id)
  writeList(KEYS.users, users)
  write(KEYS.sessionUserId, null)
  return delay(undefined)
}

export async function toggleFollowArtist(
  userId: string,
  artistId: string
): Promise<User> {
  const users = db()
  const me = users.find((u) => u.id === userId)
  if (!me) throw new Error("کاربر یافت نشد.")
  const following = me.followingArtistIds.includes(artistId)
  me.followingArtistIds = following
    ? me.followingArtistIds.filter((a) => a !== artistId)
    : [...me.followingArtistIds, artistId]
  // reflect on the artist's follower count
  const artists = readList<Artist>(KEYS.artists)
  const artist = artists.find((a) => a.id === artistId)
  if (artist) {
    artist.followerCount = Math.max(
      0,
      artist.followerCount + (following ? -1 : 1)
    )
    writeList(KEYS.artists, artists)
  }
  writeList(KEYS.users, users)
  return delay(me)
}

export async function toggleFollowUser(
  userId: string,
  targetId: string
): Promise<User> {
  const users = db()
  const me = users.find((u) => u.id === userId)
  const target = users.find((u) => u.id === targetId)
  if (!me || !target) throw new Error("کاربر یافت نشد.")
  const following = me.followingUserIds.includes(targetId)
  me.followingUserIds = following
    ? me.followingUserIds.filter((u) => u !== targetId)
    : [...me.followingUserIds, targetId]
  target.followerCount = Math.max(0, target.followerCount + (following ? -1 : 1))
  writeList(KEYS.users, users)
  return delay(me)
}

export function roleHome(role: Role): string {
  switch (role) {
    case "support":
    case "admin":
      return "/dashboard"
    case "artist":
      return "/"
    default:
      return "/"
  }
}
