import { describe, expect, it } from "vitest"

import { dictionaries, dirFor, LOCALES } from "@/lib/i18n/dictionaries"

describe("i18n dictionaries", () => {
  it("maps direction per locale", () => {
    expect(dirFor("fa")).toBe("rtl")
    expect(dirFor("en")).toBe("ltr")
  })

  it("exposes both locales", () => {
    expect(LOCALES).toEqual(["fa", "en"])
  })

  it("has an English translation for every Persian key", () => {
    const missing = Object.keys(dictionaries.fa).filter(
      (key) => !(key in dictionaries.en)
    )
    expect(missing).toEqual([])
  })

  it("translates a sample key in both languages", () => {
    expect(dictionaries.fa["nav.home"]).toBe("خانه")
    expect(dictionaries.en["nav.home"]).toBe("Home")
  })
})
