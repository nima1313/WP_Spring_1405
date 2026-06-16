import { describe, expect, it, beforeEach } from "vitest"
import { render, waitFor } from "@testing-library/react"

import { Bootstrap } from "@/components/bootstrap"
import { useAuthStore } from "@/store/auth-store"

beforeEach(() => {
  window.localStorage.clear()
  useAuthStore.setState({ user: null, hydrated: false })
})

describe("Bootstrap auth reconciliation", () => {
  it("reconciles a stale persisted user against the session id (source of truth)", async () => {
    // Session says admin, but a *different* stale user is in the store.
    window.localStorage.setItem("nava:session-user-id", JSON.stringify("u_admin"))
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

  it("logs out when there is no session even if a user was persisted", async () => {
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
