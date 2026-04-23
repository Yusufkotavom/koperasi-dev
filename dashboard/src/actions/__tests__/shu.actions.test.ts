import { beforeEach, describe, expect, it, vi } from "vitest"
import { getShuDistributionReport } from "@/actions/shu"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    journalLine: { findMany: vi.fn() },
    simpanan: { groupBy: vi.fn() },
    pembayaran: { findMany: vi.fn() },
    nasabah: { findMany: vi.fn() },
  },
}))

describe("shu actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("calculates positive shu and member distribution", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", companyId: "c1", roles: ["ADMIN"] },
    } as never)

    vi.mocked(prisma.journalLine.findMany).mockResolvedValue([
      { debit: 0, credit: 1_000_000, account: { type: "REVENUE" } },
      { debit: 300_000, credit: 0, account: { type: "EXPENSE" } },
    ] as never)
    vi.mocked(prisma.simpanan.groupBy).mockResolvedValue([
      { nasabahId: "n1", _sum: { jumlah: 400_000 } },
      { nasabahId: "n2", _sum: { jumlah: 600_000 } },
    ] as never)
    vi.mocked(prisma.pembayaran.findMany).mockResolvedValue([
      { totalBayar: 800_000, pinjaman: { pengajuan: { nasabahId: "n1" } } },
      { totalBayar: 200_000, pinjaman: { pengajuan: { nasabahId: "n2" } } },
    ] as never)
    vi.mocked(prisma.nasabah.findMany).mockResolvedValue([
      { id: "n1", namaLengkap: "Andi", nomorAnggota: "N-26-0001" },
      { id: "n2", namaLengkap: "Budi", nomorAnggota: "N-26-0002" },
    ] as never)

    const result = await getShuDistributionReport({ month: "4", year: "2026" })

    expect(result.summary.shuBersih).toBe(700000)
    expect(result.summary.poolAnggota).toBeGreaterThan(0)
    expect(result.anggota).toHaveLength(2)
    expect(result.anggota[0].totalShu).toBeGreaterThanOrEqual(result.anggota[1].totalShu)
  })

  it("returns zero pools when shu is negative", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", companyId: "c1", roles: ["ADMIN"] },
    } as never)

    vi.mocked(prisma.journalLine.findMany).mockResolvedValue([
      { debit: 0, credit: 100_000, account: { type: "REVENUE" } },
      { debit: 500_000, credit: 0, account: { type: "EXPENSE" } },
    ] as never)
    vi.mocked(prisma.simpanan.groupBy).mockResolvedValue([] as never)
    vi.mocked(prisma.pembayaran.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.nasabah.findMany).mockResolvedValue([] as never)

    const result = await getShuDistributionReport({ month: "4", year: "2026" })
    expect(result.summary.shuBersih).toBe(-400000)
    expect(result.summary.poolAnggota).toBe(0)
    expect(result.summary.poolCadangan).toBe(0)
    expect(result.summary.poolSosial).toBe(0)
  })
})

