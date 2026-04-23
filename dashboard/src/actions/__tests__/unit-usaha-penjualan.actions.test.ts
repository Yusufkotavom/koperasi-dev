import { beforeEach, describe, expect, it, vi } from "vitest"
import { createUnitUsahaPenjualan } from "@/actions/unit-usaha-penjualan"
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

vi.mock("@/lib/audit", () => ({
  writeAuditLog: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    nasabah: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

describe("unit usaha penjualan actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns validation error for invalid nasabah", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", companyId: "c1", roles: ["ADMIN"] },
    } as never)
    vi.mocked(prisma.nasabah.findFirst).mockResolvedValue(null)

    const result = await createUnitUsahaPenjualan({
      customerName: "Pelanggan Uji",
      nasabahId: "n-not-found",
      channel: "TOKO",
      metodeBayar: "TUNAI",
      kasJenis: "TUNAI",
      total: 120000,
      tanggal: "2026-04-23",
      catatan: "",
    })

    expect("error" in result).toBe(true)
    if ("error" in result) {
      expect(result.error.nasabahId?.[0]).toContain("Nasabah tidak valid")
    }
  })

  it("creates sale and posts journal in transaction", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", companyId: "c1", roles: ["ADMIN"] },
    } as never)
    vi.mocked(prisma.nasabah.findFirst).mockResolvedValue({ id: "n1" } as never)

    const tx = {
      unitUsahaSale: {
        count: vi.fn().mockResolvedValue(2),
        create: vi.fn().mockResolvedValue({
          id: "sale-1",
          invoiceNo: "PJ-20260423-0003",
          customerName: "Pelanggan Uji",
          tanggal: new Date("2026-04-23T00:00:00.000Z"),
        }),
      },
    }

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: unknown) =>
      (callback as (trx: typeof tx) => Promise<unknown>)(tx),
    )

    const result = await createUnitUsahaPenjualan({
      customerName: "Pelanggan Uji",
      nasabahId: "n1",
      channel: "TOKO",
      metodeBayar: "TUNAI",
      kasJenis: "TUNAI",
      total: 120000,
      tanggal: "2026-04-23",
      catatan: "",
    })

    expect(result).toEqual({ success: true })
    expect(tx.unitUsahaSale.create).toHaveBeenCalled()
    expect(postJournalEntry).toHaveBeenCalled()
  })
})
