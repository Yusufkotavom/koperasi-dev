import { auth } from "@/lib/auth"
import { getRankingConfig } from "@/actions/settings"
import { RankingSettingsForm } from "../ranking-settings-form"

export default async function SettingsRankingPage() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const companyId = (session?.user as any)?.companyId as string | null | undefined
  if (!companyId) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ranking Risiko</h1>
          <p className="text-muted-foreground text-sm">
            Atur indikator kolektibilitas berdasarkan keterlambatan angsuran.
          </p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          Pilih company aktif terlebih dahulu untuk mengakses pengaturan ini.
        </div>
      </div>
    )
  }

  const rankingConfig = await getRankingConfig()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ranking Risiko</h1>
        <p className="text-muted-foreground text-sm">
          Atur indikator kolektibilitas berdasarkan keterlambatan angsuran.
        </p>
      </div>
      <RankingSettingsForm initial={rankingConfig} />
    </div>
  )
}
