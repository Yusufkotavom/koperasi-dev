import { describe, expect, it, vi } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import UnitUsahaPenjualanPage from "../page"
import { getUnitUsahaPenjualanFilters, getUnitUsahaPenjualanList } from "@/actions/unit-usaha-penjualan"

vi.mock("../penjualan-form", () => ({
  PenjualanForm: () => null,
}))

vi.mock("@/actions/unit-usaha-penjualan", () => ({
  getUnitUsahaPenjualanFilters: vi.fn(),
  getUnitUsahaPenjualanList: vi.fn(),
}))

describe("unit usaha penjualan page smoke", () => {
  it("renders summary and rows", async () => {
    vi.mocked(getUnitUsahaPenjualanFilters).mockResolvedValue({ nasabah: [] } as never)
    vi.mocked(getUnitUsahaPenjualanList).mockResolvedValue({
      total: 1,
      totalNominal: 120000,
      page: 1,
      totalPages: 1,
      data: [
        {
          id: "s1",
          invoiceNo: "PJ-20260423-0001",
          tanggal: new Date("2026-04-23"),
          customerName: "Pelanggan Uji",
          channel: "TOKO",
          metodeBayar: "TUNAI",
          kasJenis: "TUNAI",
          total: 120000,
          nasabah: null,
        },
      ],
    } as never)

    const view = await UnitUsahaPenjualanPage({
      searchParams: Promise.resolve({ search: "Pelanggan", channel: "TOKO" }),
    })

    const html = renderToStaticMarkup(view)
    expect(html).toContain("Unit Usaha - Penjualan")
    expect(html).toContain("PJ-20260423-0001")
    expect(html).toContain("Pelanggan Uji")
    expect(html).toContain("value=\"TOKO\" selected=\"\"")
  })
})
