"use server"

import { revalidatePath } from "next/cache"
import { AuditAction, RoleType, StatusNasabah } from "@prisma/client"
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

const ALLOWED_ROLE_FOR_STATUS_TRANSITION: RoleType[] = [RoleType.ADMIN, RoleType.MANAGER, RoleType.PIMPINAN]

type TransitionStatusInput = {
  id: string
  toStatus: StatusNasabah
  reason?: string
}

type TransitionStatusResult =
  | { success: true; status: StatusNasabah }
  | { success: false; error: string }

const allowedTransitions: Record<StatusNasabah, ReadonlyArray<StatusNasabah>> = {
  CALON: ["CALON", "AKTIF"],
  AKTIF: ["AKTIF", "NON_AKTIF", "KELUAR"],
  NON_AKTIF: ["AKTIF", "NON_AKTIF", "KELUAR"],
  KELUAR: ["KELUAR"],
}

export async function transitionNasabahStatus(input: TransitionStatusInput): Promise<TransitionStatusResult> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const { userId } = requireRoles(session as unknown as SessionLike, ALLOWED_ROLE_FOR_STATUS_TRANSITION)
  const { companyId } = requireCompanyId(session as unknown as SessionLike)

  const id = input.id.trim()
  if (!id) return { success: false, error: "ID nasabah wajib diisi." }

  const current = await prisma.nasabah.findFirst({
    where: { id, companyId },
    select: { id: true, status: true, namaLengkap: true, nomorAnggota: true },
  })

  if (!current) {
    return { success: false, error: "Nasabah tidak ditemukan." }
  }

  if (!allowedTransitions[current.status].includes(input.toStatus)) {
    return {
      success: false,
      error: `Transisi status dari ${current.status} ke ${input.toStatus} tidak diizinkan.`,
    }
  }

  if (current.status === input.toStatus) {
    return { success: true, status: current.status }
  }

  const updated = await prisma.nasabah.updateMany({
    where: { id, companyId },
    data: { status: input.toStatus },
  })

  if (updated.count !== 1) {
    return { success: false, error: "Gagal mengubah status nasabah." }
  }

  await writeAuditLog({
    actorId: userId,
    entityType: "NASABAH",
    entityId: current.id,
    action: AuditAction.UPDATE,
    beforeData: { status: current.status },
    afterData: { status: input.toStatus },
    metadata: {
      nomorAnggota: current.nomorAnggota,
      namaLengkap: current.namaLengkap,
      transition: `${current.status}->${input.toStatus}`,
      reason: input.reason?.trim() || null,
      companyId,
    },
  })

  revalidatePath("/nasabah")
  revalidatePath(`/nasabah/${current.id}`)
  revalidatePath(`/nasabah/${current.id}/edit`)

  return { success: true, status: input.toStatus }
}
