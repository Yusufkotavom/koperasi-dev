import { getAnggotaDashboard } from "@/actions/dashboard"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

function fmtCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

const healthClass: Record<string, string> = {
  SEHAT: "bg-emerald-100 text-emerald-700",
  WASPADA: "bg-amber-100 text-amber-700",
  RISIKO: "bg-rose-100 text-rose-700",
}

export default async function DashboardAnggotaPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; status?: string }>
}) {
  const sp = await searchParams
  const search = sp?.search?.trim() ?? ""
  const status = sp?.status?.trim() ?? ""

  const result = await getAnggotaDashboard({ search, status })

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Anggota</h1>
        <p className="text-sm text-muted-foreground">Ringkasan performa anggota berdasarkan simpanan dan pembiayaan.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-0 bg-muted/30"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Anggota</p><p className="mt-1 text-xl font-bold">{result.summary.totalAnggota.toLocaleString("id-ID")}</p></CardContent></Card>
        <Card className="border-0 bg-muted/30"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Anggota Aktif</p><p className="mt-1 text-xl font-bold text-emerald-700">{result.summary.anggotaAktif.toLocaleString("id-ID")}</p></CardContent></Card>
        <Card className="border-0 bg-muted/30"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Simpanan</p><p className="mt-1 text-xl font-bold">{fmtCurrency(result.summary.totalSimpanan)}</p></CardContent></Card>
        <Card className="border-0 bg-muted/30"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Outstanding Pinjaman</p><p className="mt-1 text-xl font-bold text-blue-700">{fmtCurrency(result.summary.totalOutstanding)}</p></CardContent></Card>
        <Card className="border-0 bg-muted/30"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Tunggakan</p><p className="mt-1 text-xl font-bold text-rose-700">{fmtCurrency(result.summary.totalTunggakan)}</p></CardContent></Card>
      </div>

      <div className="rounded-xl border">
        <div className="border-b p-4">
          <form className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cari</label>
              <input
                name="search"
                defaultValue={search}
                placeholder="Nama / no anggota / NIK..."
                className="h-9 w-64 rounded-md border bg-background px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</label>
              <select name="status" defaultValue={status} className="h-9 rounded-md border bg-background px-3 text-sm">
                <option value="">Semua</option>
                <option value="CALON">Calon</option>
                <option value="AKTIF">Aktif</option>
                <option value="NON_AKTIF">Non Aktif</option>
                <option value="KELUAR">Keluar</option>
              </select>
            </div>
            <button type="submit" className="h-9 rounded-md border px-3 text-sm font-medium">Filter</button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="p-3 font-semibold">No. Anggota</th>
                <th className="p-3 font-semibold">Nama</th>
                <th className="p-3 font-semibold">Kelompok</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 text-right font-semibold">Simpanan</th>
                <th className="p-3 text-right font-semibold">Outstanding</th>
                <th className="p-3 text-right font-semibold">Tunggakan</th>
                <th className="p-3 font-semibold">Skor</th>
              </tr>
            </thead>
            <tbody>
              {result.data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground">Belum ada data anggota.</td>
                </tr>
              ) : (
                result.data.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="p-3 font-mono text-xs">{row.nomorAnggota}</td>
                    <td className="p-3 font-medium">{row.namaLengkap}</td>
                    <td className="p-3">{row.kelompok}</td>
                    <td className="p-3">{row.status.replace("_", " ")}</td>
                    <td className="p-3 text-right">{fmtCurrency(row.totalSimpanan)}</td>
                    <td className="p-3 text-right">{fmtCurrency(row.outstandingPinjaman)}</td>
                    <td className="p-3 text-right">{fmtCurrency(row.totalTunggakan)}</td>
                    <td className="p-3">
                      <Badge className={`${healthClass[row.skorKesehatan] ?? healthClass.WASPADA} border-0`}>
                        {row.skorKesehatan}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

