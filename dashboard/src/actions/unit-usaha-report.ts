"use server"

import { RoleType } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveReportPeriod, type ReportPeriodInput } from "@/lib/report-period"
import { requireRoles } from "@/lib/roles"
import { requireCompanyId } from "@/lib/tenant"
import { serializeData } from "@/lib/utils"

type SessionLike = {
  user?: {
    id?: string
    roles?: string[]
    companyId?: string | null
  }
} | null

function pct(value: number, total: number) {
  if (total <= 0) return 0
  return (value / total) * 100
}

export async function getUnitUsahaPerformanceReport(params?: ReportPeriodInput) {
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

  const [salesSummary, channelAgg, journalLines, periodSalesRows, last6Months] = await Promise.all([
    prisma.unitUsahaSale.aggregate({
      where: {
        companyId,
        tanggal: {
          gte: period.startDate,
          lt: period.endDate,
        },
      },
      _sum: { total: true },
      _avg: { total: true },
      _count: { id: true },
    }),
    prisma.unitUsahaSale.groupBy({
      by: ["channel"],
      where: {
        companyId,
        tanggal: {
          gte: period.startDate,
          lt: period.endDate,
        },
      },
      _sum: { total: true },
      _count: { id: true },
      orderBy: {
        _sum: {
          total: "desc",
        },
      },
    }),
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
        account: {
          type: "REVENUE",
        },
      },
      select: { debit: true, credit: true },
    }),
    prisma.unitUsahaSale.findMany({
      where: {
        companyId,
        tanggal: {
          gte: period.startDate,
          lt: period.endDate,
        },
      },
      select: { tanggal: true, total: true },
      orderBy: [{ tanggal: "asc" }, { id: "asc" }],
    }),
    Promise.all(
      Array.from({ length: 6 }).map((_, idx) => {
        const offset = 5 - idx
        const monthStart = new Date(period.startDate.getFullYear(), period.startDate.getMonth() - offset, 1)
        const monthEnd = new Date(period.startDate.getFullYear(), period.startDate.getMonth() - offset + 1, 1)
        return prisma.unitUsahaSale
          .aggregate({
            where: {
              companyId,
              tanggal: {
                gte: monthStart,
                lt: monthEnd,
              },
            },
            _sum: { total: true },
            _count: { id: true },
          })
          .then((res) => ({ monthStart, omzet: Number(res._sum.total ?? 0), transaksi: res._count.id }))
      }),
    ),
  ])

  const omzet = Number(salesSummary._sum.total ?? 0)
  const totalTransaksi = salesSummary._count.id
  const rataTicket = Number(salesSummary._avg.total ?? 0)

  const totalPendapatan = journalLines.reduce((sum, row) => sum + Number(row.credit) - Number(row.debit), 0)
  const kontribusiKePendapatan = pct(omzet, totalPendapatan)

  const channelBreakdown = channelAgg.map((row) => ({
    channel: row.channel,
    omzet: Number(row._sum.total ?? 0),
    transaksi: row._count.id,
    kontribusiPct: pct(Number(row._sum.total ?? 0), omzet),
  }))

  const topChannel = channelBreakdown[0]?.channel ?? "-"

  const dailyMap = new Map<string, { tanggal: string; omzet: number; transaksi: number }>()
  for (const row of periodSalesRows) {
    const tanggal = row.tanggal.toISOString().slice(0, 10)
    const current = dailyMap.get(tanggal) ?? { tanggal, omzet: 0, transaksi: 0 }
    current.omzet += Number(row.total)
    current.transaksi += 1
    dailyMap.set(tanggal, current)
  }

  const trendHarian = Array.from(dailyMap.values())

  const trendBulanan = last6Months.map((row) => ({
    bulan: row.monthStart.toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
    omzet: row.omzet,
    transaksi: row.transaksi,
  }))

  return serializeData({
    period,
    summary: {
      omzet,
      totalTransaksi,
      rataTicket,
      totalPendapatan,
      kontribusiKePendapatan,
      topChannel,
    },
    channelBreakdown,
    trendHarian,
    trendBulanan,
  })
}
