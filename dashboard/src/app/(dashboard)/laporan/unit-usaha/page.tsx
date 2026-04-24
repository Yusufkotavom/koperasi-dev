import { getUnitUsahaPerformanceReport } from "@/actions/unit-usaha-report"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

function fmtCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

function fmtPct(value: number) {
  return `${value.toFixed(2)}%`
}

export default async function UnitUsahaReportPage({
  searchParams,
}: {
  searchParams?: Promise<{ periodMode?: string; month?: string; year?: string; week?: string; from?: string; to?: string }>
}) {
  const sp = await searchParams
  const report = await getUnitUsahaPerformanceReport({
    periodMode: sp?.periodMode,
    month: sp?.month,
    year: sp?.year,
    week: sp?.week,
    from: sp?.from,
    to: sp?.to,
  })

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Laporan Unit Usaha</h1>
        <p className="text-sm text-muted-foreground">Periode: {report.period.label}</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Filter Periode</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/laporan/unit-usaha" className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <select name="periodMode" defaultValue={report.period.mode} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="MONTH">Bulanan</option>
              <option value="WEEK">Mingguan</option>
              <option value="CUSTOM">Custom</option>
            </select>
            <Input name="month" defaultValue={String(report.period.month)} placeholder="Bulan" />
            <Input name="year" defaultValue={String(report.period.year)} placeholder="Tahun" />
            <Input name="week" defaultValue={String(report.period.week)} placeholder="Minggu" />
            <Input name="from" type="date" defaultValue={report.period.fromInput} />
            <Input name="to" type="date" defaultValue={report.period.toInput} />
            <Button type="submit" className="md:col-span-1">Terapkan</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-0 bg-muted/30"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Omzet Unit Usaha</p><p className="mt-1 text-xl font-bold text-emerald-700">{fmtCurrency(report.summary.omzet)}</p></CardContent></Card>
        <Card className="border-0 bg-muted/30"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Transaksi</p><p className="mt-1 text-xl font-bold">{report.summary.totalTransaksi.toLocaleString("id-ID")}</p></CardContent></Card>
        <Card className="border-0 bg-muted/30"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Rata Ticket</p><p className="mt-1 text-xl font-bold">{fmtCurrency(report.summary.rataTicket)}</p></CardContent></Card>
        <Card className="border-0 bg-muted/30"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Kontribusi ke Pendapatan</p><p className="mt-1 text-xl font-bold text-blue-700">{fmtPct(report.summary.kontribusiKePendapatan)}</p></CardContent></Card>
        <Card className="border-0 bg-muted/30"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Top Channel</p><p className="mt-1 text-xl font-bold">{report.summary.topChannel}</p></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Komposisi Channel</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="p-3 font-semibold">Channel</th>
                  <th className="p-3 text-right font-semibold">Transaksi</th>
                  <th className="p-3 text-right font-semibold">Omzet</th>
                  <th className="p-3 text-right font-semibold">Kontribusi</th>
                </tr>
              </thead>
              <tbody>
                {report.channelBreakdown.length === 0 ? (
                  <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Belum ada transaksi penjualan pada periode ini.</td></tr>
                ) : (
                  report.channelBreakdown.map((row) => (
                    <tr key={row.channel} className="border-t">
                      <td className="p-3 font-medium">{row.channel}</td>
                      <td className="p-3 text-right">{row.transaksi.toLocaleString("id-ID")}</td>
                      <td className="p-3 text-right">{fmtCurrency(row.omzet)}</td>
                      <td className="p-3 text-right">{fmtPct(row.kontribusiPct)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Tren Omzet 6 Bulan</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {report.trendBulanan.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data tren.</p>
            ) : (
              report.trendBulanan.map((row) => (
                <div key={row.bulan} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium">{row.bulan}</div>
                    <div className="text-xs text-muted-foreground">{row.transaksi.toLocaleString("id-ID")} transaksi</div>
                  </div>
                  <div className="font-semibold">{fmtCurrency(row.omzet)}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
