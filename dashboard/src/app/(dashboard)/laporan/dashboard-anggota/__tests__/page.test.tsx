import { describe, expect, it, vi } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import DashboardAnggotaPage from "../page"
import { getAnggotaDashboard } from "@/actions/dashboard"

vi.mock("@/actions/dashboard", () => ({
  getAnggotaDashboard: vi.fn(),
}))

describe("dashboard anggota page smoke", () => {
  it("renders summary cards and rows", async () => {
    vi.mocked(getAnggotaDashboard).mockResolvedValue({
      summary: {
        totalAnggota: 12,
        anggotaAktif: 10,
        totalSimpanan: 18000000,
        totalOutstanding: 40000000,
        totalTunggakan: 1500000,
      },
      data: [
        {
          id: "n1",
          nomorAnggota: "N-26-0001",
          namaLengkap: "Andi Saputra",
          status: "AKTIF",
          kelompok: "Mentari",
          totalSimpanan: 1000000,
          outstandingPinjaman: 5000000,
          totalTunggakan: 200000,
          skorKesehatan: "WASPADA",
        },
      ],
    } as never)

    const view = await DashboardAnggotaPage({
      searchParams: Promise.resolve({ search: "andi", status: "AKTIF" }),
    })
    const html = renderToStaticMarkup(view)

    expect(html).toContain("Dashboard Anggota")
    expect(html).toContain("Andi Saputra")
    expect(html).toContain("value=\"andi\"")
    expect(html).toContain("<option value=\"AKTIF\" selected=\"\">Aktif</option>")
  })
})

