import { getShuDistributionReport } from "@/actions/shu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n)
}

function fmtPct(v: number) {
  return `${(v * 100).toFixed(2)}%`
}

export default async function ShuPage({
  searchParams,
}: {
  searchParams?: Promise<{
    periodMode?: string
    month?: string
    year?: string
    week?: string
    from?: string
    to?: string
    porsiAnggota?: string
    porsiCadangan?: string
    porsiSosial?: string
    porsiJasaModal?: string
    porsiJasaUsaha?: string
  }>
}) {
  const sp = await searchParams
  const report = await getShuDistributionReport({
    periodMode: sp?.periodMode,
    month: sp?.month,
    year: sp?.year,
    week: sp?.week,
    from: sp?.from,
    to: sp?.to,
    porsiAnggota: sp?.porsiAnggota,
    porsiCadangan: sp?.porsiCadangan,
    porsiSosial: sp?.porsiSosial,
    porsiJasaModal: sp?.porsiJasaModal,
    porsiJasaUsaha: sp?.porsiJasaUsaha,
  })

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Distribusi SHU</h1>
        <p className="text-sm text-muted-foreground">Periode: {report.period.label}</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Filter Periode & Porsi</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/laporan/shu" className="grid grid-cols-1 gap-3 md:grid-cols-6">
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

            <Input name="porsiAnggota" defaultValue={String(report.config.porsiAnggota)} placeholder="Porsi Anggota %" />
            <Input name="porsiCadangan" defaultValue={String(report.config.porsiCadangan)} placeholder="Porsi Cadangan %" />
            <Input name="porsiSosial" defaultValue={String(report.config.porsiSosial)} placeholder="Porsi Sosial %" />
            <Input name="porsiJasaModal" defaultValue={String(report.config.porsiJasaModal)} placeholder="Jasa Modal %" />
            <Input name="porsiJasaUsaha" defaultValue={String(report.config.porsiJasaUsaha)} placeholder="Jasa Usaha %" />
            <Button type="submit">Terapkan</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 bg-muted/30"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pendapatan</p><p className="mt-1 text-xl font-bold text-emerald-700">{fmt(report.summary.pendapatan)}</p></CardContent></Card>
        <Card className="border-0 bg-muted/30"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Beban</p><p className="mt-1 text-xl font-bold text-rose-700">{fmt(report.summary.beban)}</p></CardContent></Card>
        <Card className="border-0 bg-muted/30"><CardContent className="p-4"><p className="text-xs text-muted-foreground">SHU Bersih</p><p className="mt-1 text-xl font-bold">{fmt(report.summary.shuBersih)}</p></CardContent></Card>
        <Card className="border-0 bg-muted/30"><CardContent className="p-4"><p className="text-xs text-muted-foreground">SHU Terdistribusi Anggota</p><p className="mt-1 text-xl font-bold text-blue-700">{fmt(report.summary.totalShuTerdistribusi)}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-base">Pool Anggota</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><div className="flex justify-between"><span>Porsi</span><span>{fmtPct(report.config.normalized.anggota)}</span></div><div className="flex justify-between font-semibold"><span>Nominal</span><span>{fmt(report.summary.poolAnggota)}</span></div><div className="border-t pt-2"><div className="flex justify-between"><span>Jasa Modal</span><span>{fmt(report.summary.poolJasaModal)}</span></div><div className="flex justify-between"><span>Jasa Usaha</span><span>{fmt(report.summary.poolJasaUsaha)}</span></div></div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Pool Cadangan</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><div className="flex justify-between"><span>Porsi</span><span>{fmtPct(report.config.normalized.cadangan)}</span></div><div className="flex justify-between font-semibold"><span>Nominal</span><span>{fmt(report.summary.poolCadangan)}</span></div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Pool Sosial</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><div className="flex justify-between"><span>Porsi</span><span>{fmtPct(report.config.normalized.sosial)}</span></div><div className="flex justify-between font-semibold"><span>Nominal</span><span>{fmt(report.summary.poolSosial)}</span></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribusi SHU Per Anggota</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="p-3 font-semibold">No. Anggota</th>
                <th className="p-3 font-semibold">Nama</th>
                <th className="p-3 text-right font-semibold">Partisipasi Modal</th>
                <th className="p-3 text-right font-semibold">Partisipasi Usaha</th>
                <th className="p-3 text-right font-semibold">SHU Modal</th>
                <th className="p-3 text-right font-semibold">SHU Usaha</th>
                <th className="p-3 text-right font-semibold">Total SHU</th>
              </tr>
            </thead>
            <tbody>
              {report.anggota.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">Belum ada partisipasi anggota pada periode ini.</td>
                </tr>
              ) : (
                report.anggota.map((row) => (
                  <tr key={row.nasabahId} className="border-t">
                    <td className="p-3 font-mono text-xs">{row.nomorAnggota}</td>
                    <td className="p-3 font-medium">{row.namaLengkap}</td>
                    <td className="p-3 text-right">{fmt(row.partisipasiModal)}</td>
                    <td className="p-3 text-right">{fmt(row.partisipasiUsaha)}</td>
                    <td className="p-3 text-right">{fmt(row.shuModal)}</td>
                    <td className="p-3 text-right">{fmt(row.shuUsaha)}</td>
                    <td className="p-3 text-right font-semibold">{fmt(row.totalShu)}</td>
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

