import { getSimpananFilters, getSimpananList } from "@/actions/simpanan"
import { SimpananForm } from "./simpanan-form"
import { Badge } from "@/components/ui/badge"

function fmtCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function SimpananPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; jenis?: string; page?: string }>
}) {
  const sp = await searchParams
  const search = sp?.search?.trim() ?? ""
  const jenis = sp?.jenis?.trim() ?? ""
  const page = Number(sp?.page ?? 1)

  const [filters, list] = await Promise.all([
    getSimpananFilters(),
    getSimpananList({ search, jenis, page }),
  ])

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Simpanan Anggota</h1>
        <p className="text-sm text-muted-foreground">
          Total {list.total.toLocaleString("id-ID")} transaksi • {fmtCurrency(list.totalNominal)}
        </p>
      </div>

      <SimpananForm nasabahOptions={filters.nasabah} />

      <div className="rounded-xl border">
        <div className="flex flex-wrap items-end gap-3 border-b p-4">
          <form className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cari Nasabah</label>
              <input
                name="search"
                defaultValue={search}
                placeholder="Nama / nomor anggota..."
                className="h-9 w-64 rounded-md border bg-background px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Jenis</label>
              <select name="jenis" defaultValue={jenis} className="h-9 rounded-md border bg-background px-3 text-sm">
                <option value="">Semua</option>
                <option value="POKOK">POKOK</option>
                <option value="WAJIB">WAJIB</option>
                <option value="SUKARELA">SUKARELA</option>
              </select>
            </div>
            <button type="submit" className="h-9 rounded-md border px-3 text-sm font-medium">Filter</button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="p-3 font-semibold">Tanggal</th>
                <th className="p-3 font-semibold">Nasabah</th>
                <th className="p-3 font-semibold">Jenis</th>
                <th className="p-3 text-right font-semibold">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {list.data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground">
                    Belum ada transaksi simpanan.
                  </td>
                </tr>
              ) : (
                list.data.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="p-3">{new Date(row.tanggal).toLocaleDateString("id-ID")}</td>
                    <td className="p-3">
                      <div className="font-medium">{row.nasabah.namaLengkap}</div>
                      <div className="text-xs text-muted-foreground">{row.nasabah.nomorAnggota}</div>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary">{row.jenis}</Badge>
                    </td>
                    <td className="p-3 text-right font-semibold">{fmtCurrency(Number(row.jumlah))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t p-4 text-xs text-muted-foreground">
          <span>Halaman {list.page} / {list.totalPages}</span>
          <div className="flex gap-2">
            <a
              className={`rounded-md border px-2 py-1 ${list.page <= 1 ? "pointer-events-none opacity-50" : ""}`}
              href={`?search=${encodeURIComponent(search)}&jenis=${encodeURIComponent(jenis)}&page=${Math.max(1, list.page - 1)}`}
            >
              Sebelumnya
            </a>
            <a
              className={`rounded-md border px-2 py-1 ${list.page >= list.totalPages ? "pointer-events-none opacity-50" : ""}`}
              href={`?search=${encodeURIComponent(search)}&jenis=${encodeURIComponent(jenis)}&page=${Math.min(list.totalPages, list.page + 1)}`}
            >
              Berikutnya
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

