import { auth } from "@/lib/auth"
import { uploadFilesToBlob } from "@/lib/blob-upload"
import { requireCompanyId } from "@/lib/tenant"

const MAX_FILE_COUNT = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
])

export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { companyId } = requireCompanyId(
    session as unknown as { user?: { id?: string; companyId?: string | null; roles?: string[] } } | null,
  )

  const formData = await req.formData()
  const files = formData.getAll("files").filter((v): v is File => v instanceof File)

  if (files.length === 0) {
    return Response.json({ error: "Tidak ada file yang diupload." }, { status: 400 })
  }
  if (files.length > MAX_FILE_COUNT) {
    return Response.json(
      { error: `Maksimal ${MAX_FILE_COUNT} file per upload. Anda mengirim ${files.length} file.` },
      { status: 400 },
    )
  }

  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return Response.json(
        {
          error: `Tipe file tidak didukung untuk ${file.name}. Gunakan JPG, PNG, WEBP, atau PDF.`,
        },
        { status: 400 },
      )
    }
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        {
          error: `Ukuran file melebihi 5 MB: ${file.name}`,
        },
        { status: 400 },
      )
    }
  }

  try {
    const uploadedUrls = await uploadFilesToBlob(files, `uploads/${companyId}/nasabah`, {
      allowedTypes: ALLOWED_TYPES,
      maxFileSize: MAX_FILE_SIZE,
    })
    return Response.json({ urls: uploadedUrls })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload dokumen gagal."
    return Response.json({ error: message }, { status: 400 })
  }
}
