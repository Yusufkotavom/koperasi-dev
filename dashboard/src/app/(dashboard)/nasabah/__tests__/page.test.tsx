import { describe, expect, it, vi } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import NasabahPage from "../page"
import { getKelompokList, getNasabahList } from "@/actions/nasabah"

vi.mock("@/actions/nasabah", () => ({
  getKelompokList: vi.fn(),
  getNasabahList: vi.fn(),
}))

vi.mock("../delete-nasabah-button", () => ({
  DeleteNasabahButton: () => <button type="button">Delete</button>,
}))

vi.mock("../export-data-button", () => ({
  ExportDataButton: () => <button type="button">Export</button>,
}))

describe("nasabah page smoke", () => {
  it("renders list and keeps filter state from search params", async () => {
    vi.mocked(getKelompokList).mockResolvedValue([
      { id: "k1", nama: "Kelompok A" },
      { id: "k2", nama: "Kelompok B" },
    ] as never)

    vi.mocked(getNasabahList).mockResolvedValue({
      data: [
        {
          id: "n1",
          nomorAnggota: "N-26-0001",
          namaLengkap: "Andi Saputra",
          nik: "3201010101010101",
          status: "AKTIF",
          tanggalGabung: new Date("2026-01-01T00:00:00.000Z"),
          kelompok: { nama: "Kelompok A" },
          kolektor: { name: "Rina" },
          indikator: {
            ranking: "A",
            overdueCount: 0,
            overdueOldestDueAt: null,
            overdueOldestDaysLate: 0,
            tunggakanNominal: 0,
            outstanding: 1500000,
            telat: 0,
            nextDueAt: null,
            aktifPinjaman: 1,
          },
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
    } as never)

    const view = await NasabahPage({
      searchParams: Promise.resolve({ search: "andi", status: "AKTIF", kelompokId: "k1", page: "1" }),
    })
    const html = renderToStaticMarkup(view)

    expect(html).toContain("Master Nasabah")
    expect(html).toContain("Andi Saputra")
    expect(html).toContain("value=\"andi\"")
    expect(html).toContain("<option value=\"AKTIF\" selected=\"\">Aktif</option>")
    expect(html).toContain("<option value=\"k1\" selected=\"\">Kelompok A</option>")
  })
})
