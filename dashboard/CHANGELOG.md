# Changelog

Semua perubahan penting proyek dicatat di sini.

Format ringkas:
- Tanggal: `YYYY-MM-DD`
- Ruang lingkup/fase
- Perubahan
- Status testing

## 2026-04-23

### Program Planning & Execution Governance

- Menambahkan master plan lengkap ekspansi koperasi umum:
  - `docs/internal/MASTER-PLAN-KOPERASI-UMUM.md`
  - mencakup fase end-to-end dari foundation sampai stabilization,
  - mencakup checklist per fase, testing matrix, release checklist, format progress update.
- Memperbarui `AGENTS.md`:
  - menambahkan rujukan wajib ke master plan,
  - menambahkan aturan wajib checkbox execution,
  - menambahkan aturan wajib changelog + testing sebelum menutup task/fase.
- Memperketat quality gate testing/verifikasi:
  - menambah checklist anti bug sederhana dan aturan rollback status task jika gagal,
  - menambah paket verifikasi lengkap saat penutupan task/fase (`build`, `lint`, `db:generate` bila relevan, automation tests, smoke manual lintas role),
  - menambah aturan operasional di `AGENTS.md` agar task tidak boleh ditutup jika masih ada bug sederhana yang memengaruhi flow utama.

Testing status:
- Build: tidak dijalankan (perubahan dokumentasi saja).
- Unit: tidak dijalankan (perubahan dokumentasi saja).
- Integration: tidak dijalankan (perubahan dokumentasi saja).
- E2E: tidak dijalankan (perubahan dokumentasi saja).

### Quality Gate Tightening & Verification Enforcement

- Memperketat `docs/internal/MASTER-PLAN-KOPERASI-UMUM.md`:
  - menambahkan quality gate anti bug sederhana,
  - menambahkan paket verifikasi lengkap saat task/fase selesai.
- Memperketat `AGENTS.md`:
  - menambahkan aturan verifikasi wajib (`build`, `lint`, `db:generate` jika relevan, automation test, smoke lintas role),
  - menegaskan task tidak boleh ditutup bila bug sederhana masih ada.
- Perbaikan lint kecil:
  - escape karakter kutip pada helper text settings kwitansi.
- Standarisasi delegation skill:
  - menyelaraskan penggunaan orchestration/delegation menjadi satu baseline skill: `fork-discipline`.

### Orchestrator Run - Phase 0 Completion

- Menjalankan orchestration multi-worker Codex untuk percepatan Phase 0:
  - tenant/settings hardening,
  - lint/runtime cleanup,
  - baseline testing docs,
  - phase progress reporting.
- Menambahkan dokumen fase 0:
  - `docs/internal/phase0-risk-register.md`
  - `docs/internal/phase0-scope-boundaries.md`
  - `docs/internal/testing-baseline.md`
  - `docs/internal/progress/2026-04-23-phase0-progress.md`
- Menyelesaikan gap Phase 0 middleware guard:
  - menambahkan `companyStatus` ke JWT/session payload di `src/lib/auth.ts`,
  - menambahkan guard di `middleware.ts` untuk memblokir request tenant saat status company bukan `ACTIVE`.
- Membersihkan warning lint tersisa pada `src/actions/maintenance.ts` (tanpa perubahan perilaku bisnis).

Testing status:
- Lint: lulus.
- Build: lulus.
- Unit: tidak dijalankan (tidak ada suite unit formal baru pada batch ini).
- Integration: tidak dijalankan terpisah (verifikasi dilakukan via lint/build + smoke route).
- E2E: belum dijalankan pada batch ini.

Testing status:
- Build: lulus.
- Lint: lulus (masih ada 3 warning existing di `src/actions/maintenance.ts`, tanpa error).
- Unit: tidak dijalankan (tidak ada perubahan logic runtime).
- Integration: tidak dijalankan (tidak ada perubahan logic runtime).
- E2E: tidak dijalankan (scope perubahan governance + teks).

### Orchestrator Run - Phase 1C Attempt + Manual Fallback

- Menjalankan wave orchestrator besar `run_id=20260423_131508` dengan 10 worker paralel untuk backlog Phase 1C.
- Hasil wave:
  - semua worker gagal start karena limit penggunaan Codex akun (`You've hit your usage limit`) dan tidak menghasilkan commit.
  - run dihentikan dan didokumentasikan pada `.codex-orchestrator/runs/20260423_131508`.
- Fallback manual pada branch aktif:
  - sinkronisasi lifecycle nasabah `CALON` agar type-check/build kembali lulus.
  - hardening upload nasabah di `src/app/api/upload/nasabah/route.ts`:
    - limit jumlah file per request,
    - validasi MIME dan ukuran file,
    - path upload tenant-aware berbasis `companyId`.
  - menambahkan endpoint export CSV nasabah:
    - `src/app/api/nasabah/export/route.ts`.
  - menghubungkan UI export pada master nasabah:
    - `src/app/(dashboard)/nasabah/export-data-button.tsx`,
    - update `src/app/(dashboard)/nasabah/page.tsx`.
  - update progress tracking:
    - `docs/internal/progress/PHASE-1-PROGRESS.md`.

Testing status:
- Lint: lulus.
- Build: lulus.
- Unit: belum tersedia baseline unit test formal.
- Integration: belum dijalankan terpisah.
- E2E: belum dijalankan pada batch ini.

### Phase 1D Manual Progress - Survey Notes End-to-End

- Menonaktifkan jalur plugin/MCP Codex secara global untuk menghindari error auth MCP pada orchestration lokal.
- Menambahkan fitur catatan survey nasabah end-to-end:
  - Prisma schema + migration:
    - `prisma/schema.prisma`
    - `prisma/migrations/20260423173500_nasabah_survey_notes/migration.sql`
  - Action layer:
    - `src/actions/nasabah-survey.ts`
  - API route:
    - `src/app/api/nasabah/[id]/survey/route.ts`
  - UI:
    - `src/components/nasabah-survey-notes.tsx`
    - integrasi ke:
      - `src/app/(dashboard)/nasabah/[id]/page.tsx`
      - `src/app/(dashboard)/nasabah/[id]/edit/edit-form.tsx`
- Fitur tambahan dari batch manual sebelumnya tetap aktif:
  - export CSV nasabah + tombol export,
  - hardening upload dokumen nasabah.

Testing status:
- `npm run db:generate`: lulus.
- `npm run lint`: lulus.
- `npm run build`: lulus (verifikasi final via escalated execution karena batasan sandbox Turbopack).
- Unit/Integration/E2E: belum ditambahkan/dirapikan penuh pada batch ini.

### Phase 1+2 Membership Hardening & Test Baseline Closure

- Menyelesaikan gap backlog membership lintas API/action/UI:
  - `kelompok.kolektorId` persisted + validasi kolektor aktif per company,
  - update `KelompokForm` untuk pilih kolektor penanggung jawab,
  - update overview kelompok dengan ranking kesehatan (`SEHAT/WASPADA/KRITIS`) berbasis rasio tunggakan terhadap outstanding.
- Menambahkan strategi nomor anggota race-safe:
  - model `MemberCounter` pada Prisma,
  - migration `prisma/migrations/20260423190000_membership_phase2_hardening/migration.sql`,
  - `createNasabah` memakai reservation sequence dari `member_counters`.
- Menambahkan audit log nasabah untuk create/update/delete agar konsisten dengan operasi sensitif.
- Menambahkan baseline test otomatis `vitest`:
  - `src/actions/__tests__/nasabah.actions.test.ts`
  - `src/actions/__tests__/kelompok.actions.test.ts`
  - `src/app/api/upload/nasabah/__tests__/route.test.ts`
  - `src/app/(dashboard)/nasabah/__tests__/page.test.tsx`
  - `src/app/(dashboard)/kelompok/__tests__/page.test.tsx`
  - config: `vitest.config.ts`, script `npm run test`.
- Sinkronisasi dokumen eksekusi:
  - `docs/internal/phase1-membership-implementation-backlog.md`
  - `docs/internal/progress/PHASE-1-PROGRESS.md`.

Testing status:
- `npm run db:generate`: lulus.
- `npm run lint`: lulus.
- `npx tsc --noEmit`: lulus.
- `npm run test`: lulus (10 tests).
- `npm run build`: lulus.

### Phase 1+2 Final Closure - UAT, Role Matrix, and Repo Hygiene

- Menuntaskan closure plan yang tersisa:
  - menutup `P1.7` dan checklist UAT membership berbasis evidence run terbaru,
  - menutup `P2.1/P2.2/P2.6/P2.8/P2.9` untuk scope eksekusi membership hardening.
- Menambahkan validasi lintas-role otomatis:
  - `src/lib/__tests__/tenant.test.ts`
  - `src/__tests__/middleware.test.ts`
- Menstabilkan smoke E2E:
  - perbaikan selector login password (`exact label`),
  - update Playwright base URL default ke `http://localhost:3000`.
- Menormalkan runbook DB dev:
  - `prisma/seed.ts` diperkuat (cleanup lebih aman + skip tabel opsional jika belum ada),
  - verifikasi `db:push` + `db:seed` untuk sinkronisasi schema sebelum smoke test.
- Repo hygiene:
  - menghapus tracking embedded repo `koperasi-dev` dari index,
  - menambahkan ignore `koperasi-dev/` di `.gitignore`.

Testing status:
- `npm run db:push`: lulus.
- `npm run db:seed`: lulus.
- `npm run lint`: lulus.
- `npx tsc --noEmit`: lulus.
- `npm run test`: lulus (20 tests).
- `npm run test:smoke`: lulus (3 tests).
- `npm run build`: lulus.

### Phase 2 Extension - Modul Simpanan Anggota

- Menambahkan modul transaksi simpanan end-to-end:
  - action baru `src/actions/simpanan.ts` (list/filter/create + posting jurnal `SIMPANAN`),
  - validasi input `src/lib/validations/simpanan.ts`,
  - UI halaman baru `src/app/(dashboard)/simpanan/page.tsx`,
  - form input `src/app/(dashboard)/simpanan/simpanan-form.tsx`.
- Menambahkan akses menu/guard:
  - sidebar item `Simpanan` pada `src/components/app-sidebar.tsx`,
  - role guard route `/simpanan` di `middleware.ts`.
- Menambahkan test coverage action simpanan:
  - `src/actions/__tests__/simpanan.actions.test.ts`.

Testing status:
- `npm run test`: lulus (22 tests).
- `npm run lint`: lulus.
- `npx tsc --noEmit`: lulus.
- `npm run build`: lulus.

### Phase 2 Extension - Distribusi SHU Dasar

- Menambahkan kalkulasi SHU dasar berbasis jurnal periode:
  - action baru `src/actions/shu.ts` untuk hitung:
    - `shuBersih = pendapatan - beban`,
    - pool distribusi (`anggota/cadangan/sosial`),
    - distribusi anggota berbasis partisipasi modal (simpanan) dan partisipasi usaha (pembayaran).
- Menambahkan halaman laporan SHU:
  - `src/app/(dashboard)/laporan/shu/page.tsx`
  - mendukung filter periode + porsi distribusi.
- Menambahkan akses menu laporan:
  - `Distribusi SHU` di `src/components/app-sidebar.tsx`.
- Menambahkan unit test action SHU:
  - `src/actions/__tests__/shu.actions.test.ts`.

Testing status:
- `npm run test`: lulus (24 tests).
- `npm run lint`: lulus.
- `npx tsc --noEmit`: lulus.
- `npm run build`: lulus.
