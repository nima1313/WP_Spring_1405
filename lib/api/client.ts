"use client"

import ky from "ky"

// ---------------------------------------------------------------------------
// PHASE 2 ONLY. In phase 1 the repositories under lib/api/* read from
// LocalStorage and this client is unused. When the Django backend lands, each
// repository body swaps its LocalStorage calls for `api.get/post/...` here —
// signatures (and therefore every component + query hook) stay identical.
// Mirrors the nursingProject convention: same-origin /api proxy + CSRF.
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
