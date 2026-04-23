"use server"

import { revalidatePath } from "next/cache"
import { AuditAction, RoleType } from "@prisma/client"
import { auth } from "@/lib/auth"
import { writeAuditLog } from "@/lib/audit"
import { prisma } from "@/lib/prisma"
import { requireRoles } from "@/lib/roles"
import { requireCompanyId } from "@/lib/tenant"

type SessionLike = {
  user?: {
    id?: string
    roles?: string[]
    companyId?: string | null
  }
} | null

const ALLOWED_SURVEY_WRITE_ROLES: RoleType[] = [
  RoleType.ADMIN,
  RoleType.MANAGER,
  RoleType.PIMPINAN,
  RoleType.SURVEYOR,
  RoleType.KOLEKTOR,
]

export type NasabahSurveyNoteItem = {
  id: string
  note: string
  createdAt: string
  actorName: string
}

type SurveyResult<T> = { success: true; data: T } | { success: false; error: string; status: number }

function normalizeSurveyNote(input: string) {
  return input.replace(/\s+/g, " ").trim()
}

export async function getNasabahSurveyNotes(nasabahId: string): Promise<SurveyResult<NasabahSurveyNoteItem[]>> {
  const session = await auth()
  if (!session) return { success: false, error: "Unauthorized", status: 401 }
  const { companyId } = requireCompanyId(session as unknown as SessionLike)

  const id = nasabahId.trim()
  if (!id) return { success: false, error: "ID nasabah wajib diisi.", status: 400 }

  const nasabah = await prisma.nasabah.findFirst({
    where: { id, companyId },
    select: { id: true },
  })
  if (!nasabah) return { success: false, error: "Nasabah tidak ditemukan.", status: 404 }

  const notes = await prisma.nasabahSurveyNote.findMany({
    where: { nasabahId: id, companyId },
    include: { actor: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return {
    success: true,
    data: notes.map((item) => ({
      id: item.id,
      note: item.note,
      createdAt: item.createdAt.toISOString(),
      actorName: item.actor?.name ?? "System",
    })),
  }
}

export async function createNasabahSurveyNote(
  nasabahId: string,
  rawNote: string,
): Promise<SurveyResult<NasabahSurveyNoteItem>> {
  const session = await auth()
  if (!session) return { success: false, error: "Unauthorized", status: 401 }

  const { userId } = requireRoles(session as unknown as SessionLike, ALLOWED_SURVEY_WRITE_ROLES)
  const { companyId } = requireCompanyId(session as unknown as SessionLike)

  const id = nasabahId.trim()
  if (!id) return { success: false, error: "ID nasabah wajib diisi.", status: 400 }

  const note = normalizeSurveyNote(rawNote)
  if (note.length < 5) {
    return { success: false, error: "Catatan survey minimal 5 karakter.", status: 400 }
  }
  if (note.length > 2000) {
    return { success: false, error: "Catatan survey maksimal 2000 karakter.", status: 400 }
  }

  const nasabah = await prisma.nasabah.findFirst({
    where: { id, companyId },
    select: { id: true, namaLengkap: true, nomorAnggota: true },
  })
  if (!nasabah) return { success: false, error: "Nasabah tidak ditemukan.", status: 404 }

  const created = await prisma.nasabahSurveyNote.create({
    data: {
      nasabahId: nasabah.id,
      companyId,
      actorId: userId,
      note,
    },
    include: { actor: { select: { name: true } } },
  })

  await writeAuditLog({
    actorId: userId,
    entityType: "NASABAH_SURVEY_NOTE",
    entityId: created.id,
    action: AuditAction.CREATE,
    metadata: {
      companyId,
      nasabahId: nasabah.id,
      nasabahNama: nasabah.namaLengkap,
      nomorAnggota: nasabah.nomorAnggota,
      notePreview: note.slice(0, 120),
    },
  })

  revalidatePath(`/nasabah/${nasabah.id}`)
  revalidatePath(`/nasabah/${nasabah.id}/edit`)

  return {
    success: true,
    data: {
      id: created.id,
      note: created.note,
      createdAt: created.createdAt.toISOString(),
      actorName: created.actor?.name ?? "System",
    },
  }
}
