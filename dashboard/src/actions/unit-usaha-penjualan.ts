"use server"

import { revalidatePath } from "next/cache"
import { AuditAction, MetodeBayar, Prisma, RoleType } from "@prisma/client"
import { auth } from "@/lib/auth"
import { postJournalEntry } from "@/lib/accounting"
import { writeAuditLog } from "@/lib/audit"
import { prisma } from "@/lib/prisma"
import { requireRoles } from "@/lib/roles"
import { requireCompanyId } from "@/lib/tenant"
import {
  unitUsahaPenjualanSchema,
  type UnitUsahaPenjualanInput,
} from "@/lib/validations/unit-usaha-penjualan"
import { serializeData } from "@/lib/utils"

type SessionLike = {
  user?: {
    id?: string
    roles?: string[]
    companyId?: string | null
  }
} | null

type UnitUsahaPenjualanActionError = Partial<Record<keyof UnitUsahaPenjualanInput | "form", string[]>>

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

function invoicePrefix(date: Date) {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, "0")
  const d = String(date.getUTCDate()).padStart(2, "0")
  return `PJ-${y}${m}${d}`
}

function sanitizeKasJenis(input: string, metodeBayar: MetodeBayar) {
  if (metodeBayar === MetodeBayar.TRANSFER) return "BANK"
  return input === "BANK" ? "BANK" : "TUNAI"
}

export async function getUnitUsahaPenjualanFilters() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as SessionLike)

  const nasabah = await prisma.nasabah.findMany({
    where: { companyId, status: { in: ["AKTIF", "NON_AKTIF"] } },
    select: { id: true, namaLengkap: true, nomorAnggota: true },
    orderBy: { namaLengkap: "asc" },
    take: 200,
  })

  return serializeData({ nasabah })
}

export async function getUnitUsahaPenjualanList(params?: {
  search?: string
  channel?: string
  page?: number
  limit?: number
}) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as SessionLike)

  const page = params?.page && params.page > 0 ? params.page : 1
  const limit = params?.limit && params.limit > 0 ? params.limit : 20
  const skip = (page - 1) * limit

  const where: Prisma.UnitUsahaSaleWhereInput = {
    companyId,
    ...(params?.channel ? { channel: params.channel } : {}),
    ...(params?.search
      ? {
          OR: [
            { invoiceNo: { contains: params.search, mode: "insensitive" } },
            { customerName: { contains: params.search, mode: "insensitive" } },
            { nasabah: { namaLengkap: { contains: params.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  }

  const [rows, total, sum] = await Promise.all([
    prisma.unitUsahaSale.findMany({
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
    prisma.unitUsahaSale.count({ where }),
    prisma.unitUsahaSale.aggregate({ where, _sum: { total: true } }),
  ])

  return serializeData({
    data: rows,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    totalNominal: Number(sum._sum.total ?? 0),
  })
}

export async function createUnitUsahaPenjualan(
  input: unknown,
): Promise<{ success: true } | { error: UnitUsahaPenjualanActionError }> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { userId } = requireRoles(session as unknown as SessionLike, ALLOWED_WRITE_ROLES)
  const { companyId } = requireCompanyId(session as unknown as SessionLike)

  const parsed = unitUsahaPenjualanSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const tanggal = parseDateOnly(parsed.data.tanggal)
  if (!tanggal) return { error: { tanggal: ["Format tanggal tidak valid."] } }

  if (parsed.data.nasabahId) {
    const nasabahValid = await prisma.nasabah.findFirst({
      where: { id: parsed.data.nasabahId, companyId },
      select: { id: true },
    })
    if (!nasabahValid) {
      return { error: { nasabahId: ["Nasabah tidak valid untuk company ini."] } }
    }
  }

  const metodeBayar = parsed.data.metodeBayar as MetodeBayar
  const kasJenis = sanitizeKasJenis(parsed.data.kasJenis, metodeBayar)

  try {
    const total = Number(parsed.data.total)
    const created = await prisma.$transaction(async (tx) => {
      const prefix = invoicePrefix(tanggal)
      const sameDayCount = await tx.unitUsahaSale.count({
        where: {
          companyId,
          invoiceNo: { startsWith: prefix },
        },
      })
      const invoiceNo = `${prefix}-${String(sameDayCount + 1).padStart(4, "0")}`

      const sale = await tx.unitUsahaSale.create({
        data: {
          companyId,
          invoiceNo,
          tanggal,
          customerName: parsed.data.customerName,
          nasabahId: parsed.data.nasabahId || null,
          channel: parsed.data.channel,
          metodeBayar,
          kasJenis,
          total: new Prisma.Decimal(total),
          catatan: parsed.data.catatan || null,
          createdById: userId,
        },
      })

      await postJournalEntry(
        tx,
        {
          companyId,
          sourceType: "ADJUSTMENT",
          sourceId: `PENJUALAN:${sale.id}`,
          entryDate: tanggal,
          description: `Penjualan unit usaha ${invoiceNo}`,
          postedById: userId,
          lines: [
            { accountCode: kasJenis === "BANK" ? "CASH_BANK" : "CASH_TUNAI", debit: total, memo: "Kas hasil penjualan" },
            { accountCode: "PENDAPATAN_LAINNYA", credit: total, memo: "Pendapatan unit usaha" },
          ],
        },
      )

      return sale
    })

    await writeAuditLog({
      actorId: userId,
      entityType: "PENJUALAN_UNIT_USAHA",
      entityId: created.id,
      action: AuditAction.CREATE,
      afterData: {
        invoiceNo: created.invoiceNo,
        customerName: created.customerName,
        total,
        tanggal: created.tanggal.toISOString(),
      },
      metadata: { companyId, kasJenis, metodeBayar },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan penjualan unit usaha."
    return { error: { form: [message] } }
  }

  revalidatePath("/unit-usaha/penjualan")
  revalidatePath("/dashboard")
  revalidatePath("/laporan/laba-rugi")
  revalidatePath("/laporan/buku-besar")
  revalidatePath("/laporan/arus-kas")
  return { success: true }
}
