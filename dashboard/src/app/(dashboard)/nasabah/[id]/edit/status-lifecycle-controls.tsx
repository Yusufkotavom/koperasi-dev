"use client"

import { useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ubahStatusNasabah } from "@/actions/nasabah"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

type NasabahStatus = "CALON" | "AKTIF" | "NON_AKTIF" | "KELUAR"

const statusLabel: Record<NasabahStatus, string> = {
  CALON: "Calon",
  AKTIF: "Aktif",
  NON_AKTIF: "Non Aktif",
  KELUAR: "Keluar",
}

const statusBadgeClass: Record<NasabahStatus, string> = {
  CALON: "bg-sky-100 text-sky-700",
  AKTIF: "bg-emerald-100 text-emerald-700",
  NON_AKTIF: "bg-amber-100 text-amber-700",
  KELUAR: "bg-gray-100 text-gray-700",
}

const lifecycleOrder: NasabahStatus[] = ["CALON", "AKTIF", "NON_AKTIF", "KELUAR"]

const nextTransitions: Record<NasabahStatus, NasabahStatus[]> = {
  CALON: ["AKTIF"],
  AKTIF: ["NON_AKTIF", "KELUAR"],
  NON_AKTIF: ["AKTIF", "KELUAR"],
  KELUAR: [],
}

export function StatusLifecycleControls({
  nasabahId,
  status,
  onStatusChange,
}: {
  nasabahId: string
  status: NasabahStatus
  onStatusChange?: (next: NasabahStatus) => void
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const available = useMemo(() => nextTransitions[status], [status])

  const handleTransition = (target: NasabahStatus) => {
    if (target === status || isPending) return

    if (target === "KELUAR") {
      const confirmed = window.confirm(
        "Status akan diubah ke Keluar. Data nasabah tetap tersimpan (non-destructive). Lanjutkan?",
      )
      if (!confirmed) return
    }

    startTransition(async () => {
      const result = await ubahStatusNasabah(nasabahId, target)
      if (!result.success) {
        toast.error(result.error ?? "Gagal mengubah status nasabah.")
        return
      }

      onStatusChange?.(target)
      toast.success(`Status nasabah diubah ke ${statusLabel[target]}.`)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Lifecycle Status Nasabah</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">Status saat ini</div>
          <Badge className={statusBadgeClass[status]}>{statusLabel[status]}</Badge>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Tahapan lifecycle</p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {lifecycleOrder.map((stage, idx) => (
              <div key={stage} className="flex items-center gap-2">
                <Badge className={stage === status ? statusBadgeClass[stage] : "bg-muted text-muted-foreground"}>
                  {statusLabel[stage]}
                </Badge>
                {idx < lifecycleOrder.length - 1 ? <span className="text-muted-foreground">{"->"}</span> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Transisi tersedia (non-destructive)</p>
          {available.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {available.map((target) => (
                <Button
                  key={target}
                  type="button"
                  variant={target === "KELUAR" ? "outline" : "default"}
                  className={target === "AKTIF" ? "bg-emerald-600 hover:bg-emerald-700" : undefined}
                  onClick={() => handleTransition(target)}
                  disabled={isPending}
                >
                  {isPending ? "Memproses..." : `Ubah ke ${statusLabel[target]}`}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Status akhir tercapai. Tidak ada transisi lanjutan.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
