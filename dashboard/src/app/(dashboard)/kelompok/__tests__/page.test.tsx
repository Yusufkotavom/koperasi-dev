import { describe, expect, it, vi } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import KelompokPage from "../page"
import { getKelompokOverview } from "@/actions/dashboard"

vi.mock("@/actions/dashboard", () => ({
  getKelompokOverview: vi.fn(),
}))

vi.mock("../delete-kelompok-button", () => ({
  DeleteKelompokButton: () => <button type="button">Delete</button>,
}))

describe("kelompok page smoke", () => {
  it("renders summary cards and kelompok rows", async () => {
    vi.mocked(getKelompokOverview).mockResolvedValue({
      summary: {
        totalKelompok: 2,
        totalAnggota: 23,
        totalPinjamanAktif: 11,
        avgAnggotaPerKelompok: 11.5,
      },
      data: [
        {
          id: "kel-1",
          kode: "KLP001",
          nama: "Kelompok Mawar",
          wilayah: "Jakarta Barat",
          kolektor: "Rina",
          anggota: 10,
          outstanding: 12500000,
          tunggakan: 250000,
          rasioTunggakan: 2,
          rankingKesehatan: "SEHAT",
        },
      ],
    } as never)

    const view = await KelompokPage({
      searchParams: Promise.resolve({ search: "barat" }),
    })
    const html = renderToStaticMarkup(view)

    expect(html).toContain("Master Kelompok")
    expect(html).toContain("Total Kelompok")
    expect(html).toContain("KLP001")
    expect(html).toContain("Kelompok Mawar")
    expect(html).toContain("value=\"barat\"")
  })
})
