import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getAnggotaDashboardDetail } from "@/actions/dashboard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function fmtCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function DashboardAnggotaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let data: Awaited<ReturnType<typeof getAnggotaDashboardDetail>>
  try {
    data = await getAnggotaDashboardDetail(id)
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{data.anggota.namaLengkap}</h1>
            <Badge variant="outline">{data.anggota.status.replace("_", " ")}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {data.anggota.nomorAnggota} • {data.anggota.kelompok?.nama ?? "Tanpa kelompok"} • {data.anggota.noHp}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/laporan/dashboard-anggota">
            <ArrowLeft className="mr-1 size-4" />
            Kembali
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-0 bg-muted/30"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Simpanan</p><p className="mt-1 text-lg font-bold">{fmtCurrency(data.summary.totalSimpanan)}</p></CardContent></Card>
        <Card className="border-0 bg-muted/30"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pokok Pinjaman</p><p className="mt-1 text-lg font-bold">{fmtCurrency(data.summary.totalPinjamanPokok)}</p></CardContent></Card>
        <Card className="border-0 bg-muted/30"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Outstanding</p><p className="mt-1 text-lg font-bold text-blue-700">{fmtCurrency(data.summary.totalOutstanding)}</p></CardContent></Card>
        <Card className="border-0 bg-muted/30"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Tunggakan</p><p className="mt-1 text-lg font-bold text-rose-700">{fmtCurrency(data.summary.totalTunggakan)}</p></CardContent></Card>
        <Card className="border-0 bg-muted/30"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pinjaman Aktif</p><p className="mt-1 text-lg font-bold">{data.summary.pinjamanAktif}</p></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Riwayat Simpanan Terbaru</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.simpananTerbaru.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada simpanan.</p>
            ) : (
              data.simpananTerbaru.map((row) => (
                <div key={row.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium">{row.jenis}</div>
                    <div className="text-xs text-muted-foreground">{new Date(row.tanggal).toLocaleDateString("id-ID")}</div>
                  </div>
                  <div className="font-semibold">{fmtCurrency(row.jumlah)}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Pembayaran Terbaru</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.pembayaranTerbaru.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada pembayaran.</p>
            ) : (
              data.pembayaranTerbaru.map((row) => (
                <div key={row.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium">{row.nomorKontrak}</div>
                    <div className="text-xs text-muted-foreground">{new Date(row.tanggalBayar).toLocaleDateString("id-ID")}</div>
                  </div>
                  <div className="font-semibold text-emerald-700">{fmtCurrency(row.totalBayar)}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Daftar Pinjaman</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="p-3 font-semibold">Kontrak</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 text-right font-semibold">Pokok</th>
                <th className="p-3 text-right font-semibold">Sisa</th>
                <th className="p-3 text-right font-semibold">Tunggakan</th>
                <th className="p-3 text-right font-semibold">Overdue</th>
              </tr>
            </thead>
            <tbody>
              {data.pinjaman.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Belum ada pinjaman.</td></tr>
              ) : (
                data.pinjaman.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="p-3 font-mono text-xs">{row.nomorKontrak}</td>
                    <td className="p-3">{row.status}</td>
                    <td className="p-3 text-right">{fmtCurrency(row.pokokPinjaman)}</td>
                    <td className="p-3 text-right">{fmtCurrency(row.sisaPinjaman)}</td>
                    <td className="p-3 text-right">{fmtCurrency(row.totalTunggakan)}</td>
                    <td className="p-3 text-right">{row.overdueCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

