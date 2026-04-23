import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "../route"
import { auth } from "@/lib/auth"
import { requireCompanyId } from "@/lib/tenant"
import { uploadFilesToBlob } from "@/lib/blob-upload"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/tenant", () => ({
  requireCompanyId: vi.fn(),
}))

vi.mock("@/lib/blob-upload", () => ({
  uploadFilesToBlob: vi.fn(),
}))

function buildRequest(files: File[] = []) {
  const form = new FormData()
  for (const file of files) {
    form.append("files", file)
  }
  return {
    formData: async () => form,
  } as Request
}

describe("POST /api/upload/nasabah", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset()
    vi.mocked(requireCompanyId).mockReset()
    vi.mocked(uploadFilesToBlob).mockReset()
  })

  it("returns 401 when unauthorized", async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const response = await POST(buildRequest())
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe("Unauthorized")
  })

  it("returns 400 when no file uploaded", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" } } as never)
    vi.mocked(requireCompanyId).mockReturnValue({ userId: "u1", companyId: "c1" })

    const response = await POST(buildRequest())
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain("Tidak ada file")
  })

  it("returns 400 for invalid mime type", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" } } as never)
    vi.mocked(requireCompanyId).mockReturnValue({ userId: "u1", companyId: "c1" })

    const badFile = new File(["bad"], "bad.txt", { type: "text/plain" })
    const response = await POST(buildRequest([badFile]))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain("Tipe file tidak didukung")
    expect(uploadFilesToBlob).not.toHaveBeenCalled()
  })

  it("returns urls on success", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" } } as never)
    vi.mocked(requireCompanyId).mockReturnValue({ userId: "u1", companyId: "company-123" })
    vi.mocked(uploadFilesToBlob).mockResolvedValue(["https://blob.test/file-1.png"])

    const file = new File(["image-bytes"], "img.png", { type: "image/png" })
    const response = await POST(buildRequest([file]))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.urls).toEqual(["https://blob.test/file-1.png"])
    expect(uploadFilesToBlob).toHaveBeenCalledWith(
      [expect.any(File)],
      "uploads/company-123/nasabah",
      expect.objectContaining({
        maxFileSize: 5 * 1024 * 1024,
      }),
    )
  })
})
