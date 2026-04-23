import { z } from "zod"

export const UNIT_USAHA_CHANNELS = ["TOKO", "WARUNG", "KANTIN", "LAINNYA"] as const
export const UNIT_USAHA_KAS_JENIS = ["TUNAI", "BANK"] as const

export const unitUsahaPenjualanSchema = z.object({
  customerName: z.string().trim().min(2, "Nama pelanggan minimal 2 karakter.").max(120, "Nama pelanggan terlalu panjang."),
  nasabahId: z.string().trim().optional(),
  channel: z.enum(UNIT_USAHA_CHANNELS),
  metodeBayar: z.enum(["TUNAI", "TRANSFER"]),
  kasJenis: z.enum(UNIT_USAHA_KAS_JENIS),
  total: z.number().finite("Total tidak valid.").min(1000, "Total minimal Rp1.000."),
  tanggal: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD."),
  catatan: z.string().trim().max(500, "Catatan maksimal 500 karakter.").optional(),
})

export type UnitUsahaPenjualanInput = z.infer<typeof unitUsahaPenjualanSchema>
