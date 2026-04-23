import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireCompanyId } from "@/lib/tenant"
import { StatusNasabah } from "@prisma/client"

const statusSet = new Set<string>(Object.values(StatusNasabah))

function escapeCsv(value: string | null | undefined) {
  const safe = value ?? ""
  if (!/[",\n]/.test(safe)) return safe
  return `"${safe.replaceAll('"', '""')}"`
}

function toIsoDate(value: Date | null | undefined) {
  if (!value) return ""
  return value.toISOString().slice(0, 10)
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { companyId } = requireCompanyId(
    session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null,
  )

  const { searchParams } = new URL(req.url)
  const search = (searchParams.get("search") ?? "").trim()
  const kelompokId = (searchParams.get("kelompokId") ?? "").trim()
  const status = (searchParams.get("status") ?? "").trim().toUpperCase()
  const statusFilter = statusSet.has(status) ? (status as StatusNasabah) : undefined

  const rows = await prisma.nasabah.findMany({
    where: {
      companyId,
      ...(search
        ? {
            OR: [
              { namaLengkap: { contains: search, mode: "insensitive" } },
              { nik: { contains: search } },
              { nomorAnggota: { contains: search } },
            ],
          }
        : {}),
      ...(kelompokId ? { kelompokId } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    include: {
      kelompok: { select: { nama: true } },
      kolektor: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const header = [
    "nomor_anggota",
    "nama_lengkap",
    "nik",
    "status",
    "no_hp",
    "alamat",
    "kelompok",
    "kolektor",
    "tanggal_gabung",
  ]

  const csvRows = rows.map((item) =>
    [
      item.nomorAnggota,
      item.namaLengkap,
      item.nik,
      item.status,
      item.noHp,
      item.alamat,
      item.kelompok?.nama ?? "",
      item.kolektor?.name ?? "",
      toIsoDate(item.tanggalGabung),
    ]
      .map((field) => escapeCsv(field))
      .join(","),
  )

  const csv = `${header.join(",")}\n${csvRows.join("\n")}\n`
  const filename = `nasabah-${new Date().toISOString().slice(0, 10)}.csv`

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${filename}\"`,
      "Cache-Control": "no-store",
    },
  })
}
