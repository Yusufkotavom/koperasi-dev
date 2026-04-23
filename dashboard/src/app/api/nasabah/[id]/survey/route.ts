import { createNasabahSurveyNote, getNasabahSurveyNotes } from "@/actions/nasabah-survey"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params
  try {
    const result = await getNasabahSurveyNotes(id)
    if (!result.success) {
      return Response.json({ error: result.error }, { status: result.status })
    }
    return Response.json({ data: result.data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil catatan survey."
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request, context: RouteContext) {
  const { id } = await context.params
  let note = ""
  try {
    const payload = (await req.json()) as { note?: string } | null
    note = payload?.note ?? ""
  } catch {
    return Response.json({ error: "Payload JSON tidak valid." }, { status: 400 })
  }

  try {
    const result = await createNasabahSurveyNote(id, note)
    if (!result.success) {
      return Response.json({ error: result.error }, { status: result.status })
    }
    return Response.json({ data: result.data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan catatan survey."
    return Response.json({ error: message }, { status: 500 })
  }
}
