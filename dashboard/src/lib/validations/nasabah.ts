import { z } from "zod"

const persistedNasabahStatusValues = ["CALON", "AKTIF", "NON_AKTIF", "KELUAR"] as const
const lifecycleNasabahStatusValues = persistedNasabahStatusValues

export type NasabahStatus = (typeof persistedNasabahStatusValues)[number]
export type NasabahLifecycleStatus = (typeof lifecycleNasabahStatusValues)[number]

const persistedNasabahStatusSet = new Set<string>(persistedNasabahStatusValues)
const lifecycleNasabahStatusSet = new Set<string>(lifecycleNasabahStatusValues)

const tanggalLahirSchema = z
  .string()
  .trim()
  .refine((value) => {
    const parsed = new Date(value)
    return !Number.isNaN(parsed.getTime())
  }, "Tanggal lahir tidak valid. Gunakan format tanggal yang benar.")

const nasabahStatusSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .refine(
    (value): value is NasabahStatus => persistedNasabahStatusSet.has(value),
    "Status nasabah tidak valid. Pilih CALON, AKTIF, NON_AKTIF, atau KELUAR.",
  )

export const nasabahSchema = z.object({
  namaLengkap: z.string().trim().min(3, "Nama minimal 3 karakter"),
  nik: z.string().trim().regex(/^\d{16}$/, "NIK harus 16 digit angka"),
  tempatLahir: z.string().trim().optional(),
  tanggalLahir: tanggalLahirSchema.optional(),
  alamat: z.string().trim().min(10, "Alamat minimal 10 karakter"),
  kelurahan: z.string().trim().optional(),
  kecamatan: z.string().trim().optional(),
  kotaKab: z.string().trim().optional(),
  noHp: z.string().trim().regex(/^08\d{8,11}$/, "Format HP: 08xxxxxxxxxx"),
  pekerjaan: z.string().trim().optional(),
  namaUsaha: z.string().trim().optional(),
  kelompokId: z.string().trim().optional(),
  kolektorId: z.string().trim().optional(),
  dokumenUrls: z.array(z.string().trim().min(3, "URL dokumen tidak valid")).optional(),
  status: nasabahStatusSchema.default("AKTIF"),
})

export type NasabahInput = z.infer<typeof nasabahSchema>

const allowedTransitions: Record<NasabahLifecycleStatus, readonly NasabahLifecycleStatus[]> = {
  CALON: ["AKTIF"],
  AKTIF: ["NON_AKTIF", "KELUAR"],
  NON_AKTIF: ["AKTIF", "KELUAR"],
  KELUAR: [],
}

function buildAllowedTransitionMessage(from: NasabahLifecycleStatus) {
  const targets = allowedTransitions[from]
  if (targets.length === 0) return `Status ${from} adalah status akhir dan tidak bisa diubah lagi.`
  return `Transisi ${from} hanya boleh ke: ${targets.join(", ")}.`
}

export function isAllowedNasabahTransition(from: NasabahLifecycleStatus, to: NasabahLifecycleStatus) {
  if (from === to) return true
  return allowedTransitions[from].includes(to)
}

export const nasabahStatusTransitionSchema = z
  .object({
    from: z
      .string()
      .trim()
      .transform((value) => value.toUpperCase())
      .refine(
        (value): value is NasabahLifecycleStatus => lifecycleNasabahStatusSet.has(value),
        "Status asal tidak valid.",
      ),
    to: z
      .string()
      .trim()
      .transform((value) => value.toUpperCase())
      .refine(
        (value): value is NasabahLifecycleStatus => lifecycleNasabahStatusSet.has(value),
        "Status tujuan tidak valid.",
      ),
  })
  .superRefine((value, ctx) => {
    if (isAllowedNasabahTransition(value.from, value.to)) return
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["to"],
      message: buildAllowedTransitionMessage(value.from),
    })
  })

export type NasabahStatusTransitionInput = z.infer<typeof nasabahStatusTransitionSchema>

type ValidationErrorResult<T extends string> = {
  success: false
  message: string
  fieldErrors: Partial<Record<T, string[]>>
}

type ValidationSuccessResult<T> = { success: true; data: T }

export function safeParseNasabahInput(
  input: unknown,
): ValidationSuccessResult<NasabahInput> | ValidationErrorResult<keyof NasabahInput> {
  const parsed = nasabahSchema.safeParse(input)
  if (parsed.success) return { success: true, data: parsed.data }
  return {
    success: false,
    message: "Data nasabah belum valid. Periksa kembali kolom yang ditandai.",
    fieldErrors: parsed.error.flatten().fieldErrors,
  }
}

export function safeParseNasabahStatusTransition(
  input: unknown,
): ValidationSuccessResult<NasabahStatusTransitionInput> | ValidationErrorResult<keyof NasabahStatusTransitionInput> {
  const parsed = nasabahStatusTransitionSchema.safeParse(input)
  if (parsed.success) return { success: true, data: parsed.data }
  return {
    success: false,
    message: "Perubahan status nasabah tidak valid.",
    fieldErrors: parsed.error.flatten().fieldErrors,
  }
}
