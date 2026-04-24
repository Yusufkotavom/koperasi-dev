import { beforeEach, describe, expect, it, vi } from "vitest"
import { getUnitUsahaPerformanceReport } from "@/actions/unit-usaha-report"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    unitUsahaSale: {
      aggregate: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    journalLine: {
      findMany: vi.fn(),
    },
  },
}))

describe("unit usaha report actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("calculates omzet summary and channel breakdown", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", companyId: "c1", roles: ["ADMIN"] },
    } as never)

    vi.mocked(prisma.unitUsahaSale.aggregate)
      .mockResolvedValueOnce({
        _sum: { total: 2_000_000 },
        _avg: { total: 500_000 },
        _count: { id: 4 },
      } as never)
      .mockResolvedValue({ _sum: { total: 100_000 }, _count: { id: 2 } } as never)

    vi.mocked(prisma.unitUsahaSale.groupBy).mockResolvedValue([
      { channel: "TOKO", _sum: { total: 1_500_000 }, _count: { id: 3 } },
      { channel: "WARUNG", _sum: { total: 500_000 }, _count: { id: 1 } },
    ] as never)

    vi.mocked(prisma.journalLine.findMany).mockResolvedValue([
      { debit: 0, credit: 3_000_000 },
      { debit: 0, credit: 1_000_000 },
    ] as never)

    vi.mocked(prisma.unitUsahaSale.findMany).mockResolvedValue([
      { tanggal: new Date("2026-04-10"), total: 1_000_000 },
      { tanggal: new Date("2026-04-10"), total: 500_000 },
      { tanggal: new Date("2026-04-11"), total: 500_000 },
    ] as never)

    const result = await getUnitUsahaPerformanceReport({ month: "4", year: "2026" })

    expect(result.summary.omzet).toBe(2000000)
    expect(result.summary.totalTransaksi).toBe(4)
    expect(result.summary.kontribusiKePendapatan).toBeGreaterThan(0)
    expect(result.channelBreakdown).toHaveLength(2)
    expect(result.channelBreakdown[0].channel).toBe("TOKO")
    expect(result.trendHarian).toHaveLength(2)
    expect(result.trendBulanan).toHaveLength(6)
  })

  it("returns zero contribution when total revenue is zero", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", companyId: "c1", roles: ["ADMIN"] },
    } as never)

    vi.mocked(prisma.unitUsahaSale.aggregate)
      .mockResolvedValueOnce({
        _sum: { total: 0 },
        _avg: { total: 0 },
        _count: { id: 0 },
      } as never)
      .mockResolvedValue({ _sum: { total: 0 }, _count: { id: 0 } } as never)

    vi.mocked(prisma.unitUsahaSale.groupBy).mockResolvedValue([] as never)
    vi.mocked(prisma.journalLine.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.unitUsahaSale.findMany).mockResolvedValue([] as never)

    const result = await getUnitUsahaPerformanceReport({ month: "4", year: "2026" })

    expect(result.summary.omzet).toBe(0)
    expect(result.summary.totalPendapatan).toBe(0)
    expect(result.summary.kontribusiKePendapatan).toBe(0)
    expect(result.channelBreakdown).toHaveLength(0)
  })
})
