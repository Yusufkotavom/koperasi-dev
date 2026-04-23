"use client"

import { useEffect, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

type SurveyNote = {
  id: string
  note: string
  createdAt: string
  actorName: string
}

type SurveyNotesResponse = {
  data?: SurveyNote[]
  error?: string
}

export function NasabahSurveyNotes({
  nasabahId,
  editable = false,
  className,
}: {
  nasabahId: string
  editable?: boolean
  className?: string
}) {
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  const [notes, setNotes] = useState<SurveyNote[]>([])
  const [noteInput, setNoteInput] = useState("")

  useEffect(() => {
    let active = true
    const load = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/nasabah/${nasabahId}/survey`, { method: "GET" })
        const payload = (await res.json()) as SurveyNotesResponse
        if (!active) return
        if (!res.ok) {
          throw new Error(payload.error ?? "Gagal mengambil catatan survey.")
        }
        setNotes(payload.data ?? [])
      } catch (error) {
        const message = error instanceof Error ? error.message : "Gagal mengambil catatan survey."
        toast.error(message)
      } finally {
        if (active) setIsLoading(false)
      }
    }
    void load()

    return () => {
      active = false
    }
  }, [nasabahId])

  const submitNote = () => {
    if (!editable || isPending) return

    startTransition(async () => {
      const note = noteInput.trim()
      if (note.length < 5) {
        toast.error("Catatan survey minimal 5 karakter.")
        return
      }

      try {
        const res = await fetch(`/api/nasabah/${nasabahId}/survey`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note }),
        })
        const payload = (await res.json()) as { data?: SurveyNote; error?: string }
        if (!res.ok || !payload.data) {
          throw new Error(payload.error ?? "Gagal menyimpan catatan survey.")
        }

        setNotes((prev) => [payload.data as SurveyNote, ...prev])
        setNoteInput("")
        toast.success("Catatan survey tersimpan.")
      } catch (error) {
        const message = error instanceof Error ? error.message : "Gagal menyimpan catatan survey."
        toast.error(message)
      }
    })
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Timeline Survey</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {editable ? (
          <div className="space-y-2">
            <Textarea
              placeholder="Tambah catatan survey terbaru..."
              rows={3}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              disabled={isPending}
            />
            <div className="flex justify-end">
              <Button type="button" onClick={submitNote} disabled={isPending}>
                {isPending ? "Menyimpan..." : "Simpan Catatan Survey"}
              </Button>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Memuat catatan survey...</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada catatan survey.</p>
        ) : (
          <div className="space-y-2">
            {notes.map((item) => (
              <div key={item.id} className="rounded border p-3">
                <p className="text-sm whitespace-pre-wrap">{item.note}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleString("id-ID")} · {item.actorName}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
