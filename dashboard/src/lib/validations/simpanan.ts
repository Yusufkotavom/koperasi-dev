import { z } from "zod"

export const SIMPANAN_JENIS = ["POKOK", "WAJIB", "SUKARELA"] as const

export const simpananSchema = z.object({
  nasabahId: z.string().min(1, "Nasabah wajib dipilih"),
  jenis: z.enum(SIMPANAN_JENIS),
  jumlah: z.number().positive("Jumlah simpanan harus lebih dari 0"),
  tanggal: z.string().optional(),
})

export type SimpananInput = z.infer<typeof simpananSchema>
