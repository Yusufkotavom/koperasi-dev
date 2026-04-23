import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSimpanan } from "@/actions/simpanan"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { postJournalEntry } from "@/lib/accounting"

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/accounting", () => ({
  postJournalEntry: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    nasabah: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/lib/audit", () => ({
  writeAuditLog: vi.fn(),
}))

describe("simpanan actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns validation error for invalid nasabah", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", companyId: "c1", roles: ["ADMIN"] },
    } as never)
    vi.mocked(prisma.nasabah.findFirst).mockResolvedValue(null)

    const result = await createSimpanan({
      nasabahId: "n-not-found",
      jenis: "WAJIB",
      jumlah: 100000,
      tanggal: "2026-04-23",
    })

    expect("error" in result).toBe(true)
    if ("error" in result) {
      expect(result.error.nasabahId?.[0]).toContain("Nasabah tidak valid")
    }
  })

  it("creates simpanan and posts journal in transaction", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", companyId: "c1", roles: ["ADMIN"] },
    } as never)
    vi.mocked(prisma.nasabah.findFirst).mockResolvedValue({
      id: "n1",
      namaLengkap: "Andi",
      nomorAnggota: "N-26-0001",
    } as never)

    const tx = {
      simpanan: {
        create: vi.fn().mockResolvedValue({ id: "s1" }),
      },
    }
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: unknown) => (callback as (trx: typeof tx) => Promise<unknown>)(tx))

    const result = await createSimpanan({
      nasabahId: "n1",
      jenis: "SUKARELA",
      jumlah: 150000,
      tanggal: "2026-04-23",
    })

    expect(result).toEqual({ success: true })
    expect(tx.simpanan.create).toHaveBeenCalled()
    expect(postJournalEntry).toHaveBeenCalled()
  })
})

