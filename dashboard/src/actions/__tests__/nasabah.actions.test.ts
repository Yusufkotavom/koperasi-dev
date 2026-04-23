import { beforeEach, describe, expect, it, vi } from "vitest"
import { createNasabah } from "@/actions/nasabah"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    nasabah: {
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    kelompok: {
      findFirst: vi.fn(),
    },
  },
}))

const validNasabahInput = {
  namaLengkap: "Budi Santoso",
  nik: "3201010101010101",
  alamat: "Jalan Mawar No 1 Jakarta",
  noHp: "081234567890",
  status: "AKTIF" as const,
}

describe("nasabah actions", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset()
    vi.mocked(prisma.nasabah.findFirst).mockReset()
    vi.mocked(prisma.kelompok.findFirst).mockReset()
  })

  it("returns friendly duplicate NIK error", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", companyId: "c1", roles: ["ADMIN"] },
    })
    vi.mocked(prisma.nasabah.findFirst).mockResolvedValueOnce({ namaLengkap: "Nasabah Lama" } as never)

    const result = await createNasabah(validNasabahInput)

    expect("error" in result).toBe(true)
    if ("error" in result) {
      expect(result.error.nik?.[0]).toContain("NIK sudah terdaftar")
    }
  })

  it("throws when tenant context is missing", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", companyId: null, roles: ["ADMIN"] },
    })

    await expect(createNasabah(validNasabahInput)).rejects.toThrow("Akun belum terhubung ke company.")
  })
})
