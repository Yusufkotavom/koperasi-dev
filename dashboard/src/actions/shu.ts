"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireRoles } from "@/lib/roles"
import { requireCompanyId } from "@/lib/tenant"
import { resolveReportPeriod, type ReportPeriodInput } from "@/lib/report-period"
import { serializeData } from "@/lib/utils"
import { RoleType } from "@prisma/client"

type SessionLike = {
  user?: {
    id?: string
    roles?: string[]
    companyId?: string | null
  }
} | null

function clampPercent(raw: unknown, fallback: number) {
  const value = Number(raw)
  if (!Number.isFinite(value)) return fallback
  return Math.min(100, Math.max(0, value))
}

function normalizeRatios(values: number[], defaults: number[]) {
  const source = values.every((n) => n === 0) ? defaults : values
  const total = source.reduce((sum, n) => sum + n, 0)
  if (total <= 0) return defaults.map((n) => n / defaults.reduce((a, b) => a + b, 0))
  return source.map((n) => n / total)
}

export async function getShuDistributionReport(
  params?: ReportPeriodInput & {
    porsiAnggota?: string
    porsiCadangan?: string
    porsiSosial?: string
    porsiJasaModal?: string
    porsiJasaUsaha?: string
  },
) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  requireRoles(session as unknown as SessionLike, [
    RoleType.SUPER_ADMIN,
    RoleType.OWNER,
    RoleType.ADMIN,
    RoleType.MANAGER,
    RoleType.PIMPINAN,
    RoleType.AKUNTANSI,
  ])
  const { companyId } = requireCompanyId(session as unknown as SessionLike)
  const period = resolveReportPeriod(params)

  const porsiAnggota = clampPercent(params?.porsiAnggota, 40)
  const porsiCadangan = clampPercent(params?.porsiCadangan, 40)
  const porsiSosial = clampPercent(params?.porsiSosial, 20)
  const [ratioAnggota, ratioCadangan, ratioSosial] = normalizeRatios(
    [porsiAnggota, porsiCadangan, porsiSosial],
    [40, 40, 20],
  )

  const porsiJasaModal = clampPercent(params?.porsiJasaModal, 50)
  const porsiJasaUsaha = clampPercent(params?.porsiJasaUsaha, 50)
  const [ratioJasaModal, ratioJasaUsaha] = normalizeRatios([porsiJasaModal, porsiJasaUsaha], [50, 50])

  const [journalLines, simpananAgg, pembayaranRows] = await Promise.all([
    prisma.journalLine.findMany({
      where: {
        journalEntry: {
          companyId,
          status: "POSTED",
          entryDate: {
            gte: period.startDate,
            lt: period.endDate,
          },
        },
      },
      select: {
        debit: true,
        credit: true,
        account: { select: { type: true } },
      },
    }),
    prisma.simpanan.groupBy({
      by: ["nasabahId"],
      where: {
        companyId,
        tanggal: {
          gte: period.startDate,
          lt: period.endDate,
        },
      },
      _sum: { jumlah: true },
    }),
    prisma.pembayaran.findMany({
      where: {
        companyId,
        isBatalkan: false,
        tanggalBayar: {
          gte: period.startDate,
          lt: period.endDate,
        },
      },
      select: {
        totalBayar: true,
        pinjaman: {
          select: {
            pengajuan: {
              select: {
                nasabahId: true,
              },
            },
          },
        },
      },
    }),
  ])

  const pendapatan = journalLines
    .filter((line) => line.account.type === "REVENUE")
    .reduce((sum, line) => sum + Number(line.credit) - Number(line.debit), 0)
  const beban = journalLines
    .filter((line) => line.account.type === "EXPENSE")
    .reduce((sum, line) => sum + Number(line.debit) - Number(line.credit), 0)
  const shuBersih = pendapatan - beban

  const poolAnggota = shuBersih > 0 ? shuBersih * ratioAnggota : 0
  const poolCadangan = shuBersih > 0 ? shuBersih * ratioCadangan : 0
  const poolSosial = shuBersih > 0 ? shuBersih * ratioSosial : 0
  const poolJasaModal = poolAnggota * ratioJasaModal
  const poolJasaUsaha = poolAnggota * ratioJasaUsaha

  const modalByNasabah = new Map<string, number>()
  for (const row of simpananAgg) {
    modalByNasabah.set(row.nasabahId, Number(row._sum.jumlah ?? 0))
  }

  const usahaByNasabah = new Map<string, number>()
  for (const row of pembayaranRows) {
    const nasabahId = row.pinjaman.pengajuan.nasabahId
    usahaByNasabah.set(nasabahId, (usahaByNasabah.get(nasabahId) ?? 0) + Number(row.totalBayar))
  }

  const nasabahIds = Array.from(new Set([...modalByNasabah.keys(), ...usahaByNasabah.keys()]))
  const nasabah = nasabahIds.length
    ? await prisma.nasabah.findMany({
        where: { companyId, id: { in: nasabahIds } },
        select: { id: true, namaLengkap: true, nomorAnggota: true },
      })
    : []
  const nasabahMap = new Map(nasabah.map((n) => [n.id, n]))

  const totalModalPartisipasi = Array.from(modalByNasabah.values()).reduce((sum, value) => sum + value, 0)
  const totalUsahaPartisipasi = Array.from(usahaByNasabah.values()).reduce((sum, value) => sum + value, 0)

  const anggota = nasabahIds
    .map((id) => {
      const modal = modalByNasabah.get(id) ?? 0
      const usaha = usahaByNasabah.get(id) ?? 0
      const shareModal = totalModalPartisipasi > 0 ? modal / totalModalPartisipasi : 0
      const shareUsaha = totalUsahaPartisipasi > 0 ? usaha / totalUsahaPartisipasi : 0
      const shuModal = poolJasaModal * shareModal
      const shuUsaha = poolJasaUsaha * shareUsaha
      const totalShu = shuModal + shuUsaha
      const info = nasabahMap.get(id)

      return {
        nasabahId: id,
        nomorAnggota: info?.nomorAnggota ?? "-",
        namaLengkap: info?.namaLengkap ?? "Nasabah",
        partisipasiModal: modal,
        partisipasiUsaha: usaha,
        porsiModal: shareModal,
        porsiUsaha: shareUsaha,
        shuModal,
        shuUsaha,
        totalShu,
      }
    })
    .sort((a, b) => b.totalShu - a.totalShu)

  return serializeData({
    period,
    config: {
      porsiAnggota,
      porsiCadangan,
      porsiSosial,
      porsiJasaModal,
      porsiJasaUsaha,
      normalized: {
        anggota: ratioAnggota,
        cadangan: ratioCadangan,
        sosial: ratioSosial,
        jasaModal: ratioJasaModal,
        jasaUsaha: ratioJasaUsaha,
      },
    },
    summary: {
      pendapatan,
      beban,
      shuBersih,
      poolAnggota,
      poolCadangan,
      poolSosial,
      poolJasaModal,
      poolJasaUsaha,
      totalModalPartisipasi,
      totalUsahaPartisipasi,
      totalShuTerdistribusi: anggota.reduce((sum, row) => sum + row.totalShu, 0),
    },
    anggota,
  })
}

