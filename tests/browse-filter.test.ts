import { describe, expect, it, vi, beforeEach } from "vitest"

// The §8.2 search + sort logic now lives in the backend (covered by the pytest
// suite). Here we verify the browse repository forwards its query params to the
// right endpoint and returns the backend's {albums, singles} payload unchanged,
// by mocking the HTTP client.
const get = vi.fn()
vi.mock("@/lib/api/client", () => ({
  api: { get: (...args: unknown[]) => get(...args) },
  call: (fn: () => unknown) => fn(),
}))

import { browse } from "@/lib/api/catalog"

function respondWith(payload: unknown) {
  get.mockReturnValue({ json: () => Promise.resolve(payload) })
}

beforeEach(() => get.mockReset())

describe("catalog browse repository (HTTP)", () => {
  it("returns the backend's albums and singles", async () => {
    respondWith({
      albums: [{ id: "al_1", title: "آلبوم", artistId: "ar_1" }],
      singles: [{ id: "tr_1", title: "ستاره", type: "single" }],
    })

    const { albums, singles } = await browse({})
    expect(albums).toHaveLength(1)
    expect(singles[0].title).toBe("ستاره")
    expect(get).toHaveBeenCalledWith("browse", { searchParams: {} })
  })

  it("forwards q and sort as query params", async () => {
    respondWith({ albums: [], singles: [] })
    await browse({ q: "نوید", sort: "listeners" })
    expect(get).toHaveBeenCalledWith("browse", {
      searchParams: { q: "نوید", sort: "listeners" },
    })
  })

  it("omits an empty/whitespace query", async () => {
    respondWith({ albums: [], singles: [] })
    await browse({ q: "   " })
    expect(get).toHaveBeenCalledWith("browse", { searchParams: {} })
  })
})
