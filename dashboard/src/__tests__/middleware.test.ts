import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import middleware from "../../middleware"

vi.mock("next-auth/jwt", () => ({
  getToken: vi.fn(),
}))

import { getToken } from "next-auth/jwt"

function req(path: string) {
  return new NextRequest(`http://localhost:3000${path}`)
}

describe("middleware access guards", () => {
  beforeEach(() => {
    vi.mocked(getToken).mockReset()
  })

  it("allows public route", async () => {
    const res = await middleware(req("/login"))
    expect(res.status).toBe(200)
  })

  it("redirects protected route to login without token", async () => {
    vi.mocked(getToken).mockResolvedValue(null)
    const res = await middleware(req("/dashboard"))
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toBe("http://localhost:3000/login")
  })

  it("blocks suspended company access", async () => {
    vi.mocked(getToken).mockResolvedValue({
      roles: ["ADMIN"],
      companyId: "c-1",
      companyStatus: "SUSPENDED",
    } as never)

    const res = await middleware(req("/dashboard"))
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toBe("http://localhost:3000/login")
  })

  it("keeps super admin without company in platform", async () => {
    vi.mocked(getToken).mockResolvedValue({
      roles: ["SUPER_ADMIN"],
      companyId: null,
      companyStatus: null,
    } as never)

    const blocked = await middleware(req("/nasabah"))
    expect(blocked.status).toBe(307)
    expect(blocked.headers.get("location")).toBe("http://localhost:3000/platform")

    const allowed = await middleware(req("/platform"))
    expect(allowed.status).toBe(200)
  })

  it("checks role-based path permission", async () => {
    vi.mocked(getToken).mockResolvedValue({
      roles: ["KOLEKTOR"],
      companyId: "c-1",
      companyStatus: "ACTIVE",
    } as never)

    const denied = await middleware(req("/settings"))
    expect(denied.status).toBe(307)
    expect(denied.headers.get("location")).toBe("http://localhost:3000/dashboard?unauthorized=true")

    vi.mocked(getToken).mockResolvedValue({
      roles: ["ADMIN"],
      companyId: "c-1",
      companyStatus: "ACTIVE",
    } as never)
    const allowed = await middleware(req("/settings"))
    expect(allowed.status).toBe(200)
  })
})

