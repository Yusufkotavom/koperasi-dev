import { beforeEach, describe, expect, it, vi } from "vitest"
import { createKelompok, deleteKelompok } from "@/actions/kelompok"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    kelompok: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    nasabah: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

describe("kelompok actions", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset()
    vi.mocked(prisma.kelompok.findUnique).mockReset()
    vi.mocked(prisma.kelompok.findFirst).mockReset()
    vi.mocked(prisma.$transaction).mockReset()
    vi.mocked(revalidatePath).mockReset()
  })

  it("returns forbidden error when delete role is not allowed", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", companyId: "c1", roles: ["KOLEKTOR"] },
    })

    const result = await deleteKelompok("kel-1")

    expect(result.success).toBe(false)
    expect(result).toMatchObject({
      error: "Tidak memiliki hak akses untuk menghapus kelompok.",
    })
  })

  it("creates kelompok with minimal success path", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", companyId: "c1", roles: ["ADMIN"] },
    })
    vi.mocked(prisma.kelompok.findUnique).mockResolvedValue(null)

    const tx = {
      kelompok: {
        create: vi.fn().mockResolvedValue({ id: "kel-1", kode: "KLP001", nama: "Kelompok Mawar" }),
      },
      nasabah: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    }

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: unknown) => (callback as (trx: typeof tx) => unknown)(tx))

    const result = await createKelompok({
      kode: "KLP001",
      nama: "Kelompok Mawar",
    })

    expect(result).toMatchObject({
      success: true,
      data: { id: "kel-1" },
    })
    expect(tx.kelompok.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyId: "c1",
        kode: "KLP001",
        nama: "Kelompok Mawar",
      }),
    })
    expect(revalidatePath).toHaveBeenCalledWith("/kelompok")
    expect(revalidatePath).toHaveBeenCalledWith("/nasabah")
  })
})
