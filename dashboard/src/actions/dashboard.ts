"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { differenceInDays } from "date-fns"
import { getCompanyInfo } from "@/actions/settings"
import { normalizeTimeZone } from "@/lib/datetime"
import { serializeData } from "@/lib/utils"
import { requireCompanyId } from "@/lib/tenant"

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

export async function getDashboardStats() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(
    session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null,
  )

  const company = await getCompanyInfo()
  const timeZone = normalizeTimeZone(company.timeZone)
  const today = new Date()

  const startToday = startOfDay(today)
  const endToday = new Date(startToday.getTime() + 86400000)

  const [totalNasabah, pinjamanAktif, totalOutstanding, jadwalTelat, penagihanHariIni] = await Promise.all([
    prisma.nasabah.count({ where: { companyId, status: "AKTIF" } }),
    prisma.pinjaman.count({ where: { companyId, status: "AKTIF" } }),
    prisma.pinjaman.aggregate({
      where: { companyId, status: { in: ["AKTIF", "MENUNGGAK"] } },
      _sum: { sisaPinjaman: true },
    }),
    prisma.jadwalAngsuran.findMany({
      where: { companyId, sudahDibayar: false, tanggalJatuhTempo: { lt: today } },
      select: {
        total: true,
        pinjaman: {
          select: {
            pengajuan: {
              select: {
                kelompok: { select: { nama: true, wilayah: true } },
              },
            },
          },
        },
      },
      take: 1000,
    }),
    prisma.jadwalAngsuran.count({
      where: { companyId, sudahDibayar: false, tanggalJatuhTempo: { gte: startToday, lt: endToday } },
    }),
  ])

  const totalTunggakan = jadwalTelat.reduce((sum, j) => sum + Number(j.total ?? 0), 0)

  // Arus kas 6 bulan terakhir (Parallel)
  const bulanQueries = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const endD = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    bulanQueries.push(
      prisma.kasTransaksi.groupBy({
        by: ["jenis"],
        where: { companyId, tanggal: { gte: d, lte: endD }, isApproved: true },
        _sum: { jumlah: true },
      }).then(res => ({ date: d, data: res }))
    )
  }

  const bulanResults = await Promise.all(bulanQueries)
  const arusKas6Bulan = bulanResults.map(res => {
    const masuk = res.data.find((b) => b.jenis === "MASUK")?._sum?.jumlah
    const keluar = res.data.find((b) => b.jenis === "KELUAR")?._sum?.jumlah
    return {
      bulan: new Intl.DateTimeFormat("id-ID", { timeZone, month: "short", year: "2-digit" }).format(res.date),
      masuk: Number(masuk ?? 0),
      keluar: Number(keluar ?? 0),
    }
  })

  const tunggakanPerKelompok: Record<string, { nama: string; wilayah: string; total: number; count: number }> = {}
  for (const j of jadwalTelat) {
    const k = j.pinjaman?.pengajuan?.kelompok
    if (!k) continue
    if (!tunggakanPerKelompok[k.nama]) {
      tunggakanPerKelompok[k.nama] = { nama: k.nama, wilayah: k.wilayah ?? "", total: 0, count: 0 }
    }
    tunggakanPerKelompok[k.nama].total += Number(j.total ?? 0)
    tunggakanPerKelompok[k.nama].count += 1
  }
  const topTunggakan = Object.values(tunggakanPerKelompok)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  return serializeData({
    totalNasabah,
    pinjamanAktif,
    totalOutstanding: Number(totalOutstanding?._sum?.sisaPinjaman ?? 0),
    totalTunggakan,
    penagihanHariIni,
    arusKas6Bulan,
    topTunggakan,
  })
}

type TunggakanFilter = {
  tanggalDari?: string
  tanggalSampai?: string
  kolektorId?: string
  kelompokId?: string
  wilayah?: string
}

export async function getTunggakanFilterOptions() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(
    session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null,
  )

  const [kolektor, kelompok, wilayahRows] = await Promise.all([
    prisma.user.findMany({
      where: {
        companyId,
        isActive: true,
        roles: { some: { role: "KOLEKTOR" } },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.kelompok.findMany({
      where: { companyId },
      select: { id: true, nama: true },
      orderBy: { nama: "asc" },
    }),
    prisma.kelompok.findMany({
      where: { companyId, wilayah: { not: null } },
      select: { wilayah: true },
      distinct: ["wilayah"],
      orderBy: { wilayah: "asc" },
    }),
  ])

  return {
    kolektor,
    kelompok,
    wilayah: wilayahRows.map((w) => w.wilayah).filter((w): w is string => Boolean(w)),
  }
}

export async function getTunggakanList(params?: TunggakanFilter) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(
    session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null,
  )

  const today = new Date()
  const tanggalDari = params?.tanggalDari ? startOfDay(new Date(params.tanggalDari)) : undefined
  const tanggalSampai = params?.tanggalSampai ? endOfDay(new Date(params.tanggalSampai)) : undefined

  const tanggalFilter =
    tanggalDari || tanggalSampai
      ? {
          ...(tanggalDari ? { gte: tanggalDari } : {}),
          ...(tanggalSampai ? { lte: tanggalSampai } : {}),
        }
      : { lt: today }

  const jadwals = await prisma.jadwalAngsuran.findMany({
    where: {
      companyId,
      sudahDibayar: false,
      tanggalJatuhTempo: tanggalFilter,
      pinjaman: {
        pengajuan: {
          ...(params?.kelompokId ? { kelompokId: params.kelompokId } : {}),
          ...(params?.wilayah
            ? {
                kelompok: {
                  wilayah: params.wilayah,
                },
              }
            : {}),
          ...(params?.kolektorId
            ? {
                nasabah: {
                  kolektorId: params.kolektorId,
                },
              }
            : {}),
        },
      },
    },
    include: {
      pinjaman: {
        include: {
          pengajuan: {
            include: {
              nasabah: { select: { namaLengkap: true, nomorAnggota: true, noHp: true, kolektorId: true } },
              kelompok: { select: { id: true, nama: true, wilayah: true } },
            },
          },
        },
      },
    },
    orderBy: { tanggalJatuhTempo: "asc" },
  })

  const data = jadwals.map((j) => ({
    ...j,
    hariTelat: Math.max(0, differenceInDays(today, j.tanggalJatuhTempo)),
  }))

  const buckets = {
    "1-7": { count: 0, total: 0 },
    "8-30": { count: 0, total: 0 },
    "31-60": { count: 0, total: 0 },
    ">60": { count: 0, total: 0 },
  }

  for (const row of data) {
    const total = Number(row.total)
    if (row.hariTelat <= 7) {
      buckets["1-7"].count += 1
      buckets["1-7"].total += total
    } else if (row.hariTelat <= 30) {
      buckets["8-30"].count += 1
      buckets["8-30"].total += total
    } else if (row.hariTelat <= 60) {
      buckets["31-60"].count += 1
      buckets["31-60"].total += total
    } else {
      buckets[">60"].count += 1
      buckets[">60"].total += total
    }
  }

  const outstandingTotal = await prisma.pinjaman.aggregate({
    where: { companyId, status: { in: ["AKTIF", "MENUNGGAK", "MACET"] } },
    _sum: { sisaPinjaman: true },
  })

  const nplOutstanding = data
    .filter((row) => row.hariTelat > 60)
    .reduce((sum, row) => sum + Number(row.total), 0)
  const outstanding = Number(outstandingTotal._sum.sisaPinjaman ?? 0)
  const nplRatio = outstanding > 0 ? (nplOutstanding / outstanding) * 100 : 0

  return serializeData({
    data,
    summary: {
      totalKasus: data.length,
      totalTunggakan: data.reduce((sum, row) => sum + Number(row.total), 0),
      nplOutstanding,
      outstanding,
      nplRatio,
      buckets,
    },
  })
}

type KelompokOverview = {
  id: string
  kode: string
  nama: string
  wilayah: string
  kolektor: string
  anggota: number
  pinjamanAktif: number
  outstanding: number
  tunggakan: number
  rasioTunggakan: number
  rankingKesehatan: "SEHAT" | "WASPADA" | "KRITIS"
}

export async function getKelompokOverview(search?: string): Promise<{
  data: KelompokOverview[]
  summary: {
    totalKelompok: number
    totalAnggota: number
    totalPinjamanAktif: number
    avgAnggotaPerKelompok: number
  }
}> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(
    session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null,
  )

  const today = new Date()

  const kelompok = await prisma.kelompok.findMany({
    where: {
      companyId,
      ...(search
        ? {
            OR: [
              { nama: { contains: search, mode: "insensitive" } },
              { kode: { contains: search, mode: "insensitive" } },
              { wilayah: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      kolektor: { select: { name: true } },
      nasabah: {
        select: {
          id: true,
        },
      },
      pengajuan: {
        select: {
          pinjaman: {
            select: {
              id: true,
              status: true,
              sisaPinjaman: true,
              jadwalAngsuran: {
                where: {
                  sudahDibayar: false,
                  tanggalJatuhTempo: { lt: today },
                },
                select: { total: true },
              },
            },
          },
        },
      },
    },
    orderBy: { nama: "asc" },
  })

  const data = kelompok.map((k) => {
    const kolektor = k.kolektor?.name ?? "Belum ditetapkan"

    const pinjaman = k.pengajuan.map((p) => p.pinjaman).filter((p): p is NonNullable<typeof p> => Boolean(p))

    const pinjamanAktif = pinjaman.filter((p) => p.status === "AKTIF" || p.status === "MENUNGGAK").length
    const outstanding = pinjaman.reduce((sum, p) => sum + Number(p.sisaPinjaman), 0)
    const tunggakan = pinjaman.reduce(
      (sum, p) => sum + p.jadwalAngsuran.reduce((inner, j) => inner + Number(j.total), 0),
      0
    )
    const rasioTunggakan = outstanding > 0 ? (tunggakan / outstanding) * 100 : 0
    const rankingKesehatan: KelompokOverview["rankingKesehatan"] =
      rasioTunggakan <= 5 ? "SEHAT" : rasioTunggakan <= 15 ? "WASPADA" : "KRITIS"

    return {
      id: k.id,
      kode: k.kode,
      nama: k.nama,
      wilayah: k.wilayah ?? "-",
      kolektor,
      anggota: k.nasabah.length,
      pinjamanAktif,
      outstanding,
      tunggakan,
      rasioTunggakan,
      rankingKesehatan,
    }
  })

  const totalKelompok = data.length
  const totalAnggota = data.reduce((sum, item) => sum + item.anggota, 0)
  const totalPinjamanAktif = data.reduce((sum, item) => sum + item.pinjamanAktif, 0)
  const avgAnggotaPerKelompok = totalKelompok > 0 ? Math.round(totalAnggota / totalKelompok) : 0

  return serializeData({
    data,
    summary: { totalKelompok, totalAnggota, totalPinjamanAktif, avgAnggotaPerKelompok },
  })
}

type KolektorOverview = {
  id: string
  nama: string
  nasabah: number
  kelompok: number
  target: number
  realisasi: number
  tunggakan: number
  setoran: number
  pencapaian: number
}

type KolektorFilter = {
  month?: string
  year?: string
  kolektorId?: string
  wilayah?: string
}

export async function getKolektorFilterOptions() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  const [kolektor, wilayahRows] = await Promise.all([
    prisma.user.findMany({
      where: {
        companyId,
        isActive: true,
        roles: { some: { role: "KOLEKTOR" } },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.kelompok.findMany({
      where: { companyId, wilayah: { not: null } },
      select: { wilayah: true },
      distinct: ["wilayah"],
      orderBy: { wilayah: "asc" },
    }),
  ])

  return {
    kolektor,
    wilayah: wilayahRows.map((w) => w.wilayah).filter((w): w is string => Boolean(w)),
  }
}

export async function getKolektorOverview(params?: KolektorFilter): Promise<KolektorOverview[]> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null)

  const now = new Date()
  const year = Number(params?.year ?? now.getFullYear())
  const month = Number(params?.month ?? now.getMonth() + 1)
  const startMonth = new Date(year, month - 1, 1)
  const endMonth = new Date(year, month, 1)

  const kolektorList = await prisma.user.findMany({
    where: {
      companyId,
      isActive: true,
      roles: { some: { role: "KOLEKTOR" } },
      ...(params?.kolektorId ? { id: params.kolektorId } : {}),
      ...(params?.wilayah
        ? {
            nasabahSebagaiKolektor: {
              some: {
                kelompok: { wilayah: params.wilayah },
              },
            },
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      kolektorTargets: {
        where: {
          periodMonth: month,
          periodYear: year,
        },
        select: {
          targetTagihan: true,
          realisasiTagihan: true,
        },
      },
      kasDiinput: {
        where: {
          companyId,
          jenis: "MASUK",
          kategoriKey: { in: ["ANGSURAN", "PELUNASAN"] },
          tanggal: { gte: startMonth, lt: endMonth },
        },
        select: { jumlah: true },
      },
      nasabahSebagaiKolektor: {
        select: {
          kelompokId: true,
          pengajuan: {
            select: {
              pinjaman: {
                select: {
                  pembayaran: {
                    where: {
                      isBatalkan: false,
                      tanggalBayar: {
                        gte: startMonth,
                        lt: endMonth,
                      },
                    },
                    select: { totalBayar: true },
                  },
                  jadwalAngsuran: {
                    where: {
                      sudahDibayar: false,
                      tanggalJatuhTempo: { lt: now },
                    },
                    select: { total: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  })

  return serializeData(kolektorList.map((k) => {
    const kelompokSet = new Set(k.nasabahSebagaiKolektor.map((n) => n.kelompokId).filter(Boolean))
    let realisasi = 0
    let tunggakan = 0
    let targetDerived = 0

    for (const nasabah of k.nasabahSebagaiKolektor) {
      for (const pengajuan of nasabah.pengajuan) {
        const pinjaman = pengajuan.pinjaman
        if (!pinjaman) continue
        for (const bayar of pinjaman.pembayaran) {
          realisasi += Number(bayar.totalBayar)
        }
        for (const jadwal of pinjaman.jadwalAngsuran) {
          tunggakan += Number(jadwal.total)
          targetDerived += Number(jadwal.total)
        }
      }
    }

    const targetSet = k.kolektorTargets[0]
    const target = targetSet ? Number(targetSet.targetTagihan) : targetDerived
    const setoran = k.kasDiinput.reduce((sum, item) => sum + Number(item.jumlah), 0)
    const pencapaian = target > 0 ? Math.round((realisasi / target) * 100) : 0

    return {
      id: k.id,
      nama: k.name,
      nasabah: k.nasabahSebagaiKolektor.length,
      kelompok: kelompokSet.size,
      target,
      realisasi,
      tunggakan,
      setoran,
      pencapaian,
    }
  }))
}

type AnggotaDashboardRow = {
  id: string
  nomorAnggota: string
  namaLengkap: string
  status: string
  kelompok: string
  totalSimpanan: number
  outstandingPinjaman: number
  totalTunggakan: number
  skorKesehatan: "SEHAT" | "WASPADA" | "RISIKO"
}

export async function getAnggotaDashboard(params?: { search?: string; status?: string }) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { companyId } = requireCompanyId(
    session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null,
  )

  const today = new Date()
  const where = {
    companyId,
    ...(params?.status ? { status: params.status as "AKTIF" | "NON_AKTIF" | "KELUAR" | "CALON" } : {}),
    ...(params?.search
      ? {
          OR: [
            { namaLengkap: { contains: params.search, mode: "insensitive" as const } },
            { nomorAnggota: { contains: params.search } },
            { nik: { contains: params.search } },
          ],
        }
      : {}),
  }

  const [nasabahRows, simpananAgg] = await Promise.all([
    prisma.nasabah.findMany({
      where,
      orderBy: { namaLengkap: "asc" },
      select: {
        id: true,
        nomorAnggota: true,
        namaLengkap: true,
        status: true,
        kelompok: { select: { nama: true } },
        pengajuan: {
          select: {
            pinjaman: {
              select: {
                status: true,
                sisaPinjaman: true,
                jadwalAngsuran: {
                  where: {
                    sudahDibayar: false,
                    tanggalJatuhTempo: { lt: today },
                  },
                  select: { total: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.simpanan.groupBy({
      by: ["nasabahId"],
      where: { companyId },
      _sum: { jumlah: true },
    }),
  ])

  const simpananMap = new Map(simpananAgg.map((row) => [row.nasabahId, Number(row._sum.jumlah ?? 0)]))

  const data: AnggotaDashboardRow[] = nasabahRows.map((row) => {
    const pinjamanRows = row.pengajuan.map((item) => item.pinjaman).filter((x): x is NonNullable<typeof x> => Boolean(x))
    const outstandingPinjaman = pinjamanRows
      .filter((p) => p.status === "AKTIF" || p.status === "MENUNGGAK")
      .reduce((sum, p) => sum + Number(p.sisaPinjaman), 0)
    const totalTunggakan = pinjamanRows.reduce(
      (sum, p) => sum + p.jadwalAngsuran.reduce((inner, j) => inner + Number(j.total), 0),
      0,
    )
    const ratio = outstandingPinjaman > 0 ? (totalTunggakan / outstandingPinjaman) * 100 : 0
    const skorKesehatan: AnggotaDashboardRow["skorKesehatan"] =
      ratio <= 5 ? "SEHAT" : ratio <= 20 ? "WASPADA" : "RISIKO"

    return {
      id: row.id,
      nomorAnggota: row.nomorAnggota,
      namaLengkap: row.namaLengkap,
      status: row.status,
      kelompok: row.kelompok?.nama ?? "-",
      totalSimpanan: simpananMap.get(row.id) ?? 0,
      outstandingPinjaman,
      totalTunggakan,
      skorKesehatan,
    }
  })

  const summary = {
    totalAnggota: data.length,
    anggotaAktif: data.filter((row) => row.status === "AKTIF").length,
    totalSimpanan: data.reduce((sum, row) => sum + row.totalSimpanan, 0),
    totalOutstanding: data.reduce((sum, row) => sum + row.outstandingPinjaman, 0),
    totalTunggakan: data.reduce((sum, row) => sum + row.totalTunggakan, 0),
  }

  return serializeData({ summary, data })
}
