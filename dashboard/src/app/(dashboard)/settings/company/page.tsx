import { auth } from "@/lib/auth"
import { getCompanyInfo } from "@/actions/settings"
import { CompanySettingsForm } from "../company-settings-form"

export default async function SettingsCompanyPage() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const companyId = (session?.user as any)?.companyId as string | null | undefined
  if (!companyId) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Company</h1>
          <p className="text-muted-foreground text-sm">Kelola profil koperasi dan identitas dokumen.</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          Pilih company aktif terlebih dahulu untuk mengakses pengaturan ini.
        </div>
      </div>
    )
  }

  const companyInfo = await getCompanyInfo()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Company</h1>
        <p className="text-muted-foreground text-sm">Kelola profil koperasi dan identitas dokumen.</p>
      </div>
      <CompanySettingsForm initial={companyInfo} />
    </div>
  )
}
