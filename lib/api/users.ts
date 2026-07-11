import { HTTPError } from "ky"

import { api, call } from "@/lib/api/client"
import { useAuthStore } from "@/store/auth-store"
import type { Artist, Gender, Role, User } from "@/lib/types"

export async function listUsers(): Promise<User[]> {
  return call(() => api.get("users").json<User[]>())
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    return await api.get(`users/${id}`).json<User>()
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 404) return null
    throw error
  }
}

export async function getUserByHandle(handle: string): Promise<User | null> {
  try {
    return await api
      .get(`users/by-handle/${encodeURIComponent(handle)}`)
      .json<User>()
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 404) return null
    throw error
  }
}

export async function login(email: string, password: string): Promise<User> {
  return call(() =>
    api.post("auth/login", { json: { email, password } }).json<User>()
  )
}

export async function logout(): Promise<void> {
  try {
    await api.post("auth/logout")
  } catch {
    /* logging out is best-effort; the client clears its own state regardless */
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    return await api.get("me").json<User>()
  } catch (error) {
    // 401 = no session; the repository contract returns null, not an error.
    if (error instanceof HTTPError && error.response.status === 401) return null
    throw error
  }
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
  return call(() =>
    api.post("auth/register/listener", { json: input }).json<User>()
  )
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
  return call(() =>
    api.post("auth/register/artist", { json: input }).json<Artist>()
  )
}

export async function updateUser(
  id: string,
  patch: Partial<User>
): Promise<User> {
  return call(() => api.patch(`users/${id}`, { json: patch }).json<User>())
}

/**
 * Uploads a new profile picture (§3.4, tier-gated). The backend rejects basic
 * listeners with 403, which `call` surfaces as a localized ApiError.
 */
export async function uploadAvatar(file: File): Promise<User> {
  const form = new FormData()
  form.append("avatar", file)
  return call(() => api.post("me/avatar", { body: form }).json<User>())
}

export async function deleteAccount(_id: string): Promise<void> {
  // The backend deletes whoever the session belongs to (DELETE /me).
  await call(() => api.delete("me").text())
}

export async function toggleFollowArtist(
  _userId: string,
  artistId: string
): Promise<User> {
  // The backend reads the follower from the session; we pick the verb from the
  // signed-in user's current following list (same source the UI reads).
  const me = useAuthStore.getState().user
  const alreadyFollowing = me?.followingArtistIds.includes(artistId) ?? false
  return call(() =>
    (alreadyFollowing
      ? api.delete(`artists/${artistId}/followers`)
      : api.post(`artists/${artistId}/followers`)
    ).json<User>()
  )
}

export async function toggleFollowUser(
  _userId: string,
  targetId: string
): Promise<User> {
  const me = useAuthStore.getState().user
  const alreadyFollowing = me?.followingUserIds.includes(targetId) ?? false
  return call(() =>
    (alreadyFollowing
      ? api.delete(`users/${targetId}/followers`)
      : api.post(`users/${targetId}/followers`)
    ).json<User>()
  )
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
