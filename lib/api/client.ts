"use client"

import ky, { HTTPError } from "ky"

// ---------------------------------------------------------------------------
// Phase 2: the repositories under lib/api/* talk to the Django backend through
// this same-origin `/api` proxy (see next.config.mjs). Auth is Django's session
// cookie; writes carry the CSRF token as X-CSRF-Token, matching the backend's
// CSRF_COOKIE_NAME="csrf_token" / CSRF_HEADER_NAME contract. Repository
// signatures are unchanged from phase 1, so every hook and component still works.
// ---------------------------------------------------------------------------

function getCsrfToken(): string {
  if (typeof document === "undefined") return ""
  const match = document.cookie.match(/csrf_token=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ""
}

export const api = ky.create({
  prefix: "/api",
  credentials: "include",
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const token = getCsrfToken()
        if (token) request.headers.set("X-CSRF-Token", token)
      },
    ],
  },
})

/** A backend business-rule error, carrying the machine `code` (e.g. "stream_limit"). */
export class ApiError extends Error {
  code?: string
  status: number
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

/**
 * Turns ky's HTTPError into a localized ApiError: reads the backend's JSON
 * `{detail, code}` body so the user sees the Persian message the server sent,
 * and callers can branch on `code` (429 stream_limit, 403 playlist_limit, …).
 */
export async function unwrapError(error: unknown): Promise<ApiError> {
  if (error instanceof HTTPError) {
    let detail = ""
    let code: string | undefined
    try {
      const body = (await error.response.json()) as {
        detail?: string
        code?: string
        [k: string]: unknown
      }
      code = body.code
      detail =
        body.detail ||
        // DRF field errors come back as {field: [msg]} — surface the first.
        (Object.values(body).find((v) => typeof v === "string") as string) ||
        (Object.values(body)
          .flat()
          .find((v) => typeof v === "string") as string) ||
        ""
    } catch {
      /* non-JSON body */
    }
    return new ApiError(
      detail || "خطایی رخ داد. لطفاً دوباره تلاش کنید.",
      error.response.status,
      code
    )
  }
  if (error instanceof Error) return new ApiError(error.message, 0)
  return new ApiError("خطای ناشناخته", 0)
}

/** Run a request, re-throwing any HTTPError as a localized ApiError. */
export async function call<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    throw await unwrapError(error)
  }
}
