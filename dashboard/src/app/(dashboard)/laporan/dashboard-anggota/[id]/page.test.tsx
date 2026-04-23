import { describe, expect, it, vi } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import DashboardAnggotaDetailPage from "./page"
import { getAnggotaDashboardDetail } from "@/actions/dashboard"

vi.mock("@/actions/dashboard", () => ({
  getAnggotaDashboardDetail: vi.fn(),
}))

describe("dashboard anggota detail page smoke", () => {
  it("renders detail cards and history sections", async () => {
    vi.mocked(getAnggotaDashboardDetail).mockResolvedValue({
      anggota: {
        id: "n1",
        nomorAnggota: "N-26-0001",
        namaLengkap: "Andi Saputra",
        status: "AKTIF",
        noHp: "08123456789",
        alamat: "Jl. Melati 1",
        kelompok: { nama: "Mentari", wilayah: "Kota" },
      },
      summary: {
        totalSimpanan: 2000000,
        totalPinjamanPokok: 5000000,
        totalOutstanding: 3000000,
        totalTunggakan: 250000,
        pinjamanAktif: 1,
      },
      simpananTerbaru: [
        { id: "s1", jenis: "WAJIB", jumlah: 150000, tanggal: new Date("2026-04-10") },
      ],
      pinjaman: [
        {
          id: "p1",
          nomorKontrak: "PK-001",
          status: "AKTIF",
          pokokPinjaman: 5000000,
          sisaPinjaman: 3000000,
          tanggalCair: new Date("2026-03-01"),
          totalTunggakan: 250000,
          overdueCount: 1,
        },
      ],
      pembayaranTerbaru: [
        {
          id: "b1",
          tanggalBayar: new Date("2026-04-15"),
          totalBayar: 500000,
          nomorKontrak: "PK-001",
        },
      ],
    } as never)

    const view = await DashboardAnggotaDetailPage({
      params: Promise.resolve({ id: "n1" }),
    })
    const html = renderToStaticMarkup(view)

    expect(html).toContain("Andi Saputra")
    expect(html).toContain("Riwayat Simpanan Terbaru")
    expect(html).toContain("Pembayaran Terbaru")
    expect(html).toContain("Daftar Pinjaman")
    expect(html).toContain("href=\"/laporan/dashboard-anggota\"")
  })
})
