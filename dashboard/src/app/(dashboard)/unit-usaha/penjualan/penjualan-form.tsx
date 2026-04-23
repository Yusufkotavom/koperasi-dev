"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createUnitUsahaPenjualan } from "@/actions/unit-usaha-penjualan"
import {
  unitUsahaPenjualanSchema,
  type UnitUsahaPenjualanInput,
} from "@/lib/validations/unit-usaha-penjualan"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type NasabahOption = {
  id: string
  namaLengkap: string
  nomorAnggota: string
}

export function PenjualanForm({ nasabahOptions }: { nasabahOptions: NasabahOption[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UnitUsahaPenjualanInput>({
    resolver: zodResolver(unitUsahaPenjualanSchema),
    defaultValues: {
      channel: "TOKO",
      metodeBayar: "TUNAI",
      kasJenis: "TUNAI",
      tanggal: new Date().toISOString().slice(0, 10),
    },
  })

  const onSubmit = (values: UnitUsahaPenjualanInput) => {
    startTransition(async () => {
      const result = await createUnitUsahaPenjualan(values)
      if ("error" in result) {
        const message = result.error.form?.[0] ?? Object.values(result.error).flat()[0] ?? "Gagal menyimpan penjualan."
        toast.error(message)
        return
      }

      toast.success("Penjualan unit usaha berhasil dicatat.")
      reset({
        customerName: "",
        nasabahId: "",
        channel: "TOKO",
        metodeBayar: "TUNAI",
        kasJenis: "TUNAI",
        total: 0,
        tanggal: new Date().toISOString().slice(0, 10),
        catatan: "",
      })
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-6">
      <div className="md:col-span-2">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nama Pelanggan</label>
        <Input placeholder="Nama pelanggan" {...register("customerName")} />
        {errors.customerName?.message ? <p className="mt-1 text-xs text-red-600">{errors.customerName.message}</p> : null}
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nasabah (Opsional)</label>
        <select {...register("nasabahId")} className="h-9 w-full rounded-md border bg-background px-3 text-sm" defaultValue="">
          <option value="">Tanpa relasi nasabah</option>
          {nasabahOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.namaLengkap} - {item.nomorAnggota}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Channel</label>
        <select {...register("channel")} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
          <option value="TOKO">TOKO</option>
          <option value="WARUNG">WARUNG</option>
          <option value="KANTIN">KANTIN</option>
          <option value="LAINNYA">LAINNYA</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Metode</label>
        <select {...register("metodeBayar")} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
          <option value="TUNAI">TUNAI</option>
          <option value="TRANSFER">TRANSFER</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kas</label>
        <select {...register("kasJenis")} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
          <option value="TUNAI">TUNAI</option>
          <option value="BANK">BANK</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tanggal</label>
        <Input type="date" {...register("tanggal")} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total</label>
        <Input type="number" min={1000} step={1000} {...register("total", { valueAsNumber: true })} />
        {errors.total?.message ? <p className="mt-1 text-xs text-red-600">{errors.total.message}</p> : null}
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Catatan</label>
        <Input placeholder="Catatan transaksi" {...register("catatan")} />
      </div>
      <div className="md:col-span-6">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Menyimpan..." : "Simpan Penjualan"}
        </Button>
      </div>
    </form>
  )
}
