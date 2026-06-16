import { describe, expect, it } from "vitest"

import { listArtists } from "@/lib/api/artists"
import { browse } from "@/lib/api/catalog"

async function artistNames() {
  const artists = await listArtists()
  return Object.fromEntries(artists.map((a) => [a.id, a.name]))
}

describe("catalog browse (§8.2 search + sort)", () => {
  it("returns albums and singles by default", async () => {
    const { albums, singles } = await browse({})
    expect(albums.length).toBeGreaterThan(0)
    expect(singles.length).toBeGreaterThan(0)
    expect(singles.every((t) => t.type === "single")).toBe(true)
  })

  it("filters singles by track title", async () => {
    const { singles } = await browse({ q: "ستاره", artistNames: await artistNames() })
    expect(singles.length).toBe(1)
    expect(singles[0].title).toBe("ستاره")
  })

  it("matches by artist name across albums", async () => {
    const names = await artistNames()
    const { albums } = await browse({ q: "نوید", artistNames: names })
    expect(albums.length).toBeGreaterThan(0)
  })

  it("sorts singles by release date (newest first)", async () => {
    const { singles } = await browse({ sort: "date" })
    for (let i = 1; i < singles.length; i++) {
      expect(+new Date(singles[i - 1].releaseDate)).toBeGreaterThanOrEqual(
        +new Date(singles[i].releaseDate)
      )
    }
  })

  it("sorts singles by listener count when requested", async () => {
    const { singles } = await browse({ sort: "listeners" })
    for (let i = 1; i < singles.length; i++) {
      expect(singles[i - 1].listeners).toBeGreaterThanOrEqual(singles[i].listeners)
    }
  })
})
