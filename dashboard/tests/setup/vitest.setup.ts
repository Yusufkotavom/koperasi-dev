import { cleanup } from "@testing-library/react"
import React from "react"
import { afterEach, vi } from "vitest"

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement("a", { href, ...props }, children),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
