import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach, beforeEach } from "vitest"

// Each test starts from a clean LocalStorage and DOM.
beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
})

// jsdom doesn't implement matchMedia (used by next-themes) — stub it.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}
