import type { ReactElement } from "react"
import { render } from "@testing-library/react"

import { I18nProvider } from "@/lib/i18n"

/**
 * Renders a component inside the i18n provider (Persian default). The returned
 * `rerender` re-wraps in the provider so context survives between renders.
 */
export function renderWithI18n(ui: ReactElement) {
  const result = render(<I18nProvider>{ui}</I18nProvider>)
  return {
    ...result,
    rerender: (next: ReactElement) =>
      result.rerender(<I18nProvider>{next}</I18nProvider>),
  }
}
