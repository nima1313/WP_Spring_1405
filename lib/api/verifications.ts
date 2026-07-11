import { HTTPError } from "ky"

import { api, call } from "@/lib/api/client"
import type { Verification } from "@/lib/types"

export async function listVerifications(): Promise<Verification[]> {
  return call(() => api.get("verifications").json<Verification[]>())
}

export async function getVerification(
  id: string
): Promise<Verification | null> {
  try {
    return await api.get(`verifications/${id}`).json<Verification>()
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 404) return null
    throw error
  }
}

// Both decisions go through one right-sized PATCH; the backend syncs the Artist
// record and notifies its owning user.

export async function approveVerification(id: string): Promise<Verification> {
  return call(() =>
    api
      .patch(`verifications/${id}`, { json: { status: "approved" } })
      .json<Verification>()
  )
}

export async function rejectVerification(
  id: string,
  reason: string
): Promise<Verification> {
  return call(() =>
    api
      .patch(`verifications/${id}`, { json: { status: "rejected", reason } })
      .json<Verification>()
  )
}
