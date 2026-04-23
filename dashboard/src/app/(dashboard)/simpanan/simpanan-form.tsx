"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { createSimpanan } from "@/actions/simpanan"
import { simpananSchema, type SimpananInput } from "@/lib/validations/simpanan"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type NasabahOption = {
  id: string
  namaLengkap: string
  nomorAnggota: string
}

export function SimpananForm({ nasabahOptions }: { nasabahOptions: NasabahOption[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SimpananInput>({
    resolver: zodResolver(simpananSchema),
    defaultValues: {
      jenis: "WAJIB",
      tanggal: new Date().toISOString().slice(0, 10),
    },
  })

  const onSubmit = (values: SimpananInput) => {
    startTransition(async () => {
      const result = await createSimpanan(values)
      if ("error" in result) {
        const message =
          result.error.form?.[0] ??
          Object.values(result.error).flat()[0] ??
          "Gagal menyimpan simpanan."
        toast.error(message)
        return
      }

      toast.success("Simpanan berhasil dicatat.")
      reset({
        nasabahId: "",
        jenis: "WAJIB",
        jumlah: 0,
        tanggal: new Date().toISOString().slice(0, 10),
      })
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-5">
      <div className="md:col-span-2">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nasabah</label>
        <select
          {...register("nasabahId")}
          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          defaultValue=""
        >
          <option value="" disabled>Pilih nasabah</option>
          {nasabahOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.namaLengkap} - {item.nomorAnggota}
            </option>
          ))}
        </select>
        {errors.nasabahId?.message ? <p className="mt-1 text-xs text-red-600">{errors.nasabahId.message}</p> : null}
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Jenis</label>
        <select {...register("jenis")} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
          <option value="POKOK">POKOK</option>
          <option value="WAJIB">WAJIB</option>
          <option value="SUKARELA">SUKARELA</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Jumlah</label>
        <Input type="number" min={1} step={1000} {...register("jumlah", { valueAsNumber: true })} />
        {errors.jumlah?.message ? <p className="mt-1 text-xs text-red-600">{errors.jumlah.message}</p> : null}
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tanggal</label>
        <Input type="date" {...register("tanggal")} />
      </div>
      <div className="md:col-span-5">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Menyimpan..." : "Simpan Setoran"}
        </Button>
      </div>
    </form>
  )
}
