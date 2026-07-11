import { describe, expect, it, beforeEach, vi } from "vitest"
import { render, waitFor } from "@testing-library/react"

// /api/me is the session source of truth; mock the repository so the test
// exercises Bootstrap's reconciliation logic without a live backend.
const getCurrentUser = vi.fn()
vi.mock("@/lib/api/users", () => ({ getCurrentUser: () => getCurrentUser() }))

import { Bootstrap } from "@/components/bootstrap"
import { useAuthStore } from "@/store/auth-store"

beforeEach(() => {
  window.localStorage.clear()
  useAuthStore.setState({ user: null, hydrated: false })
  getCurrentUser.mockReset()
})

describe("Bootstrap auth reconciliation", () => {
  it("reconciles a stale persisted user against /api/me (the source of truth)", async () => {
    // The backend session belongs to u_admin, but a stale user sits in the store.
    getCurrentUser.mockResolvedValue({ id: "u_admin", displayName: "admin" })
    useAuthStore.setState({
      user: { id: "u_stale", displayName: "stale" } as never,
      hydrated: false,
    })

    render(<Bootstrap />)

    await waitFor(() => {
      expect(useAuthStore.getState().user?.id).toBe("u_admin")
    })
    expect(useAuthStore.getState().hydrated).toBe(true)
  })

  it("logs out when /api/me has no session even if a user was persisted", async () => {
    // getCurrentUser returns null on a 401 (no session).
    getCurrentUser.mockResolvedValue(null)
    useAuthStore.setState({
      user: { id: "u_ghost", displayName: "ghost" } as never,
      hydrated: false,
    })

    render(<Bootstrap />)

    await waitFor(() => {
      expect(useAuthStore.getState().hydrated).toBe(true)
    })
    expect(useAuthStore.getState().user).toBeNull()
  })
})
