import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import { EmptyState } from "@/components/common/empty-state"

describe("EmptyState", () => {
  it("renders the title and description", () => {
    render(<EmptyState title="هیچ پلی‌لیستی نیست" description="اولین را بساز" />)
    expect(screen.getByText("هیچ پلی‌لیستی نیست")).toBeInTheDocument()
    expect(screen.getByText("اولین را بساز")).toBeInTheDocument()
  })

  it("renders an optional action node", () => {
    render(
      <EmptyState
        title="خالی"
        action={<button type="button">ایجاد</button>}
      />
    )
    expect(screen.getByRole("button", { name: "ایجاد" })).toBeInTheDocument()
  })
})
