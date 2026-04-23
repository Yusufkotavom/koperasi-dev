import { describe, expect, it } from "vitest"
import { RoleType } from "@prisma/client"
import { requireCompanyId, requireCompanyRoles } from "@/lib/tenant"

describe("tenant guards", () => {
  it("throws unauthorized when session missing", () => {
    expect(() => requireCompanyId(null)).toThrow("Unauthorized")
  })

  it("throws company context required for super admin without company", () => {
    expect(() =>
      requireCompanyId({
        user: {
          id: "u-super",
          roles: [RoleType.SUPER_ADMIN],
          companyId: null,
        },
      }),
    ).toThrow("Company context required")
  })

  it("throws account not linked for regular user without company", () => {
    expect(() =>
      requireCompanyId({
        user: {
          id: "u-admin",
          roles: [RoleType.ADMIN],
          companyId: null,
        },
      }),
    ).toThrow("Akun belum terhubung ke company.")
  })

  it("returns user and company for valid tenant user", () => {
    const result = requireCompanyId({
      user: {
        id: "u-owner",
        roles: [RoleType.OWNER],
        companyId: "c-1",
      },
    })

    expect(result).toEqual({ userId: "u-owner", companyId: "c-1" })
  })

  it("requires allowed role and company context", () => {
    expect(() =>
      requireCompanyRoles(
        {
          user: {
            id: "u-collector",
            roles: [RoleType.KOLEKTOR],
            companyId: "c-2",
          },
        },
        [RoleType.ADMIN],
      ),
    ).toThrow("Forbidden")

    expect(() =>
      requireCompanyRoles(
        {
          user: {
            id: "u-admin",
            roles: [RoleType.ADMIN],
            companyId: null,
          },
        },
        [RoleType.ADMIN],
      ),
    ).toThrow("Akun belum terhubung ke company.")
  })
})

