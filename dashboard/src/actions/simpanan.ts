"use server"

import { revalidatePath } from "next/cache"
import { AuditAction, Prisma, RoleType } from "@prisma/client"
import { auth } from "@/lib/auth"
import { writeAuditLog } from "@/lib/audit"
import { postJournalEntry } from "@/lib/accounting"
import { prisma } from "@/lib/prisma"
import { requireRoles } from "@/lib/roles"
import { requireCompanyId } from "@/lib/tenant"
import { simpananSchema, type SimpananInput } from "@/lib/validations/simpanan"
import { serializeData } from "@/lib/utils"

type SessionLike = {
  user?: {
    id?: string
    roles?: string[]
    companyId?: string | null
  }
} | null

type SimpananActionError = Partial<Record<keyof SimpananInput | "form", string[]>>

const ALLOWED_WRITE_ROLES: RoleType[] = [
  RoleType.OWNER,
  RoleType.ADMIN,
  RoleType.MANAGER,
  RoleType.PIMPINAN,
  RoleType.TELLER,
]

function parseDateOnly(input?: string) {
  if (!input) return new Date()
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return date
}

export async function getSimpananFilters() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as SessionLike)

  const nasabah = await prisma.nasabah.findMany({
    where: { companyId, status: { in: ["AKTIF", "NON_AKTIF"] } },
    select: { id: true, namaLengkap: true, nomorAnggota: true },
    orderBy: { namaLengkap: "asc" },
  })

  return serializeData({
    nasabah,
    jenisOptions: ["POKOK", "WAJIB", "SUKARELA"] as const,
  })
}

export async function getSimpananList(params?: {
  search?: string
  jenis?: string
  page?: number
  limit?: number
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as SessionLike)

  const page = params?.page && params.page > 0 ? params.page : 1
  const limit = params?.limit && params.limit > 0 ? params.limit : 20
  const skip = (page - 1) * limit

  const where: Prisma.SimpananWhereInput = {
    companyId,
    ...(params?.jenis ? { jenis: params.jenis } : {}),
    ...(params?.search
      ? {
          nasabah: {
            OR: [
              { namaLengkap: { contains: params.search, mode: "insensitive" } },
              { nomorAnggota: { contains: params.search } },
            ],
          },
        }
      : {}),
  }

  const [rows, total, sum] = await Promise.all([
    prisma.simpanan.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ tanggal: "desc" }, { id: "desc" }],
      include: {
        nasabah: {
          select: { id: true, namaLengkap: true, nomorAnggota: true },
        },
      },
    }),
    prisma.simpanan.count({ where }),
    prisma.simpanan.aggregate({ where, _sum: { jumlah: true } }),
  ])

  return serializeData({
    data: rows,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    totalNominal: Number(sum._sum.jumlah ?? 0),
  })
}

export async function createSimpanan(input: unknown): Promise<{ success: true } | { error: SimpananActionError }> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { userId } = requireRoles(session as unknown as SessionLike, ALLOWED_WRITE_ROLES)
  const { companyId } = requireCompanyId(session as unknown as SessionLike)

  const parsed = simpananSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const tanggal = parseDateOnly(parsed.data.tanggal)
  if (!tanggal) return { error: { tanggal: ["Format tanggal tidak valid."] } }

  const nasabah = await prisma.nasabah.findFirst({
    where: { id: parsed.data.nasabahId, companyId },
    select: { id: true, namaLengkap: true, nomorAnggota: true },
  })
  if (!nasabah) return { error: { nasabahId: ["Nasabah tidak valid untuk company ini."] } }

  try {
    const jumlah = Number(parsed.data.jumlah)
    const simpanan = await prisma.$transaction(async (tx) => {
      const created = await tx.simpanan.create({
        data: {
          companyId,
          nasabahId: nasabah.id,
          jenis: parsed.data.jenis,
          jumlah: new Prisma.Decimal(jumlah),
          tanggal,
        },
      })

      await postJournalEntry(tx, {
        companyId,
        sourceType: "SIMPANAN",
        sourceId: created.id,
        entryDate: tanggal,
        description: `Setoran simpanan ${parsed.data.jenis} ${nasabah.namaLengkap}`,
        postedById: userId,
        lines: [
          { accountCode: "CASH_TUNAI", debit: jumlah, memo: "Kas simpanan diterima" },
          { accountCode: "SIMPANAN_ANGGOTA", credit: jumlah, memo: "Kewajiban simpanan anggota" },
        ],
      })

      return created
    })

    await writeAuditLog({
      actorId: userId,
      entityType: "SIMPANAN",
      entityId: simpanan.id,
      action: AuditAction.CREATE,
      afterData: {
        nasabahId: nasabah.id,
        nomorAnggota: nasabah.nomorAnggota,
        jenis: parsed.data.jenis,
        jumlah,
        tanggal: tanggal.toISOString(),
      },
      metadata: { companyId, nasabahNama: nasabah.namaLengkap },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan simpanan."
    return { error: { form: [message] } }
  }

  revalidatePath("/simpanan")
  revalidatePath("/dashboard")
  revalidatePath("/laporan/buku-besar")
  revalidatePath("/laporan/neraca")
  return { success: true }
}
