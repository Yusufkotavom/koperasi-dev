"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Download } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function ExportDataButton() {
  const searchParams = useSearchParams()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (isExporting) return
    setIsExporting(true)

    try {
      const params = new URLSearchParams()
      const search = searchParams.get("search")
      const kelompokId = searchParams.get("kelompokId")
      const status = searchParams.get("status")

      if (search) params.set("search", search)
      if (kelompokId) params.set("kelompokId", kelompokId)
      if (status) params.set("status", status)

      const url = `/api/nasabah/export${params.toString() ? `?${params.toString()}` : ""}`
      const res = await fetch(url, { method: "GET" })
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? "Export data gagal.")
      }

      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = `nasabah-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(blobUrl)
      toast.success("Export data nasabah berhasil.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export data gagal."
      toast.error(message)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2 border-slate-200/80 dark:border-slate-800/80"
      onClick={handleExport}
      disabled={isExporting}
    >
      <Download className="size-3.5" />
      <span className="hidden sm:inline">{isExporting ? "Memproses..." : "Export Data"}</span>
    </Button>
  )
}
