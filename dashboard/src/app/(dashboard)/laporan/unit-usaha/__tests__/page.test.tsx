import { describe, expect, it, vi } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import UnitUsahaReportPage from "../page"
import { getUnitUsahaPerformanceReport } from "@/actions/unit-usaha-report"

vi.mock("@/actions/unit-usaha-report", () => ({
  getUnitUsahaPerformanceReport: vi.fn(),
}))

describe("laporan unit usaha page smoke", () => {
  it("renders summary and channel table", async () => {
    vi.mocked(getUnitUsahaPerformanceReport).mockResolvedValue({
      period: {
        mode: "MONTH",
        month: 4,
        year: 2026,
        week: 1,
        fromInput: "2026-04-01",
        toInput: "2026-04-30",
        label: "April 2026",
      },
      summary: {
        omzet: 2000000,
        totalTransaksi: 4,
        rataTicket: 500000,
        totalPendapatan: 4000000,
        kontribusiKePendapatan: 50,
        topChannel: "TOKO",
      },
      channelBreakdown: [
        { channel: "TOKO", omzet: 1500000, transaksi: 3, kontribusiPct: 75 },
      ],
      trendHarian: [],
      trendBulanan: [{ bulan: "Apr 26", omzet: 2000000, transaksi: 4 }],
    } as never)

    const view = await UnitUsahaReportPage({
      searchParams: Promise.resolve({ periodMode: "MONTH", month: "4", year: "2026" }),
    })

    const html = renderToStaticMarkup(view)
    expect(html).toContain("Laporan Unit Usaha")
    expect(html).toContain("TOKO")
    expect(html).toContain("Kontribusi ke Pendapatan")
    expect(html).toContain("value=\"MONTH\" selected=\"\"")
  })
})
