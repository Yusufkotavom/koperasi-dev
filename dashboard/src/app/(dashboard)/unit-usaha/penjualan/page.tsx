import { Badge } from "@/components/ui/badge"
import { getUnitUsahaPenjualanFilters, getUnitUsahaPenjualanList } from "@/actions/unit-usaha-penjualan"
import { PenjualanForm } from "./penjualan-form"

function fmtCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function UnitUsahaPenjualanPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; channel?: string; page?: string }>
}) {
  const sp = await searchParams
  const search = sp?.search?.trim() ?? ""
  const channel = sp?.channel?.trim() ?? ""
  const page = Number(sp?.page ?? 1)

  const [filters, list] = await Promise.all([
    getUnitUsahaPenjualanFilters(),
    getUnitUsahaPenjualanList({ search, channel, page }),
  ])

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Unit Usaha - Penjualan</h1>
        <p className="text-sm text-muted-foreground">
          Total {list.total.toLocaleString("id-ID")} transaksi • {fmtCurrency(list.totalNominal)}
        </p>
      </div>

      <PenjualanForm nasabahOptions={filters.nasabah} />

      <div className="rounded-xl border">
        <div className="border-b p-4">
          <form className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cari</label>
              <input
                name="search"
                defaultValue={search}
                placeholder="No invoice / pelanggan / nasabah"
                className="h-9 w-64 rounded-md border bg-background px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Channel</label>
              <select name="channel" defaultValue={channel} className="h-9 rounded-md border bg-background px-3 text-sm">
                <option value="">Semua</option>
                <option value="TOKO">TOKO</option>
                <option value="WARUNG">WARUNG</option>
                <option value="KANTIN">KANTIN</option>
                <option value="LAINNYA">LAINNYA</option>
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
                <th className="p-3 font-semibold">Invoice</th>
                <th className="p-3 font-semibold">Pelanggan</th>
                <th className="p-3 font-semibold">Channel</th>
                <th className="p-3 font-semibold">Pembayaran</th>
                <th className="p-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {list.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">Belum ada transaksi penjualan.</td>
                </tr>
              ) : (
                list.data.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="p-3">{new Date(row.tanggal).toLocaleDateString("id-ID")}</td>
                    <td className="p-3 font-mono text-xs">{row.invoiceNo}</td>
                    <td className="p-3">
                      <div className="font-medium">{row.customerName}</div>
                      <div className="text-xs text-muted-foreground">{row.nasabah?.namaLengkap ?? "Pelanggan umum"}</div>
                    </td>
                    <td className="p-3"><Badge variant="secondary">{row.channel}</Badge></td>
                    <td className="p-3">{row.metodeBayar} / {row.kasJenis}</td>
                    <td className="p-3 text-right font-semibold">{fmtCurrency(Number(row.total))}</td>
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
              href={`?search=${encodeURIComponent(search)}&channel=${encodeURIComponent(channel)}&page=${Math.max(1, list.page - 1)}`}
            >
              Sebelumnya
            </a>
            <a
              className={`rounded-md border px-2 py-1 ${list.page >= list.totalPages ? "pointer-events-none opacity-50" : ""}`}
              href={`?search=${encodeURIComponent(search)}&channel=${encodeURIComponent(channel)}&page=${Math.min(list.totalPages, list.page + 1)}`}
            >
              Berikutnya
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
