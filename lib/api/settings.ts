import { api, call } from "@/lib/api/client"

// Cross-device user preferences (§3.5). These live on the backend so a user's
// language/theme follow them to any device, instead of only in localStorage.

export interface UserSettings {
  locale: "fa" | "en"
  theme: "light" | "dark" | "system"
  extra: Record<string, unknown>
}

export async function getMySettings(): Promise<UserSettings> {
  return call(() => api.get("me/settings").json<UserSettings>())
}

export async function updateMySettings(
  patch: Partial<UserSettings>
): Promise<UserSettings> {
  return call(() => api.put("me/settings", { json: patch }).json<UserSettings>())
}
