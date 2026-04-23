# Phase 1 Progress

Dokumen tracking operasional untuk `Phase 1 - Stabilization & Delivery Baseline`.
Status checklist wajib evidence-gated: jangan centang tanpa bukti yang bisa diverifikasi.

## Ringkasan

- Phase: `Phase 1 - Stabilization & Delivery Baseline`
- Status: `COMPLETED`
- Last updated (UTC): `2026-04-23 19:02`

## Checklist & Evidence

- [x] P1.1 Baseline dokumen testing/orchestrator tersedia.
  - Owner: `orchestrator`
  - Updated at (UTC): `2026-04-23`
  - Evidence:
    - Artifact: `docs/internal/testing-baseline.md`
    - Artifact: `docs/internal/progress/ORCHESTRATOR-RUN-LOG-TEMPLATE.md`

- [x] P1.2 Baseline quality gate sudah dieksekusi pada batch aktif.
  - Owner: `orchestrator`
  - Updated at (UTC): `2026-04-23 13:24` dan `2026-04-23 17:40`
  - Evidence:
    - Command/Test: `npm run lint`
    - Result: `PASS`
    - Command/Test: `npm run build`
    - Result: `PASS`
    - Artifact: catatan run pada bagian `Catatan Eksekusi` di dokumen ini

- [x] P1.3 Hardening upload nasabah (limit file + MIME/size + tenant-aware path) terdokumentasi dan tervalidasi.
  - Owner: `manual fallback`
  - Updated at (UTC): `2026-04-23 13:24`
  - Evidence:
    - Artifact: `src/app/api/upload/nasabah/route.ts`
    - Command/Test: `npm run lint`, `npm run build`
    - Result: `PASS`

- [x] P1.4 Export CSV nasabah tenant-aware + wiring tombol UI terdokumentasi dan tervalidasi.
  - Owner: `manual fallback`
  - Updated at (UTC): `2026-04-23 13:24`
  - Evidence:
    - Artifact: `src/app/api/nasabah/export/route.ts`
    - Artifact: `src/app/(dashboard)/nasabah/export-data-button.tsx`
    - Command/Test: `npm run lint`, `npm run build`
    - Result: `PASS`

- [x] P1.5 Survey notes nasabah end-to-end (schema/action/api/ui) terdokumentasi dan tervalidasi.
  - Owner: `manual fallback`
  - Updated at (UTC): `2026-04-23 17:40`
  - Evidence:
    - Artifact: `prisma/migrations/20260423173500_nasabah_survey_notes/migration.sql`
    - Artifact: `src/actions/nasabah-survey.ts`
    - Artifact: `src/app/api/nasabah/[id]/survey/route.ts`
    - Artifact: `src/components/nasabah-survey-notes.tsx`
    - Command/Test: `npm run db:generate`, `npm run lint`, `npm run build`
    - Result: `PASS`

- [x] P1.6 Progress log Phase 1 mencatat evidence run-by-run.
  - Owner: `orchestrator`
  - Updated at (UTC): `2026-04-23`
  - Evidence:
    - Artifact: section `Catatan Eksekusi` pada dokumen ini (run ID, command, hasil)

- [x] P1.7 Review akhir Phase 1 + keputusan go/no-go resmi.
  - Owner: `orchestrator + user instruction`
  - Updated at (UTC): `2026-04-23 19:02`
  - Evidence:
    - Reviewer sign-off: `eksekusi langsung oleh orchestrator sesuai instruksi user "langsung kerjakan semua"`
    - Decision: `GO (scope membership hardening)`

## Catatan Eksekusi

Update eksekusi (UTC 2026-04-23 18:33):
- Penyelesaian backlog membership hardening + quality gate:
  - tambahan persistence kolektor per kelompok (`kelompok.kolektorId`) + update form/listing kelompok,
  - metrik ranking kesehatan kelompok berbasis rasio `tunggakan/outstanding`,
  - hardening race-safe nomor anggota via `member_counters`,
  - audit log nasabah untuk create/update/delete (status sudah ditangani `nasabah-status`),
  - baseline unit/smoke tests dengan `vitest` pada area nasabah/kelompok/upload route.
- Verifikasi:
  - `npm run db:generate` -> PASS
  - `npm run lint` -> PASS
  - `npx tsc --noEmit` -> PASS
  - `npm run test` -> PASS (10 tests)
  - `npm run build` -> PASS
    - catatan: sempat terblokir karena proses build lama belum berhenti; sudah dibersihkan lalu build final lulus.

Update eksekusi (UTC 2026-04-23 19:02):
- Final closure Phase 1:
  - perbaikan smoke test Playwright (`Password` exact label, base URL localhost),
  - sinkronisasi DB dev (`npm run db:push`) + seed data demo (`npm run db:seed`) agar flow login smoke konsisten,
  - validasi lintas role ditambah via test middleware dan tenant guard.
- Verifikasi:
  - `npm run test` -> PASS (20 tests)
  - `npm run test:smoke` -> PASS (3/3 tests)
  - `npm run lint` -> PASS
  - `npx tsc --noEmit` -> PASS
  - `npm run build` -> PASS

Update eksekusi (UTC 2026-04-23 13:24):
- Orchestrator wave `20260423_131508` dijalankan dengan 10 worker paralel, tetapi seluruh worker gagal start karena usage limit akun Codex.
- Fallback manual pada branch aktif:
  - perbaikan lifecycle `CALON` agar type-check/build lulus,
  - hardening route upload nasabah (limit jumlah file, validasi MIME/size, tenant-aware path),
  - endpoint export CSV nasabah (`/api/nasabah/export`) tenant-aware,
  - wiring tombol `Export Data` pada page nasabah.
- Verifikasi:
  - `npm run lint` -> PASS
  - `npm run build` -> PASS

Update eksekusi (UTC 2026-04-23 17:40):
- MCP/plugin Codex dinonaktifkan global untuk menstabilkan eksekusi lokal (`features.plugins=false`, `features.apps=false`).
- Penambahan fitur survey nasabah end-to-end:
  - Prisma model + migration: `NasabahSurveyNote`,
  - server action: `src/actions/nasabah-survey.ts`,
  - API route: `src/app/api/nasabah/[id]/survey/route.ts`,
  - UI timeline + quick add: `src/components/nasabah-survey-notes.tsx` (integrasi ke detail/edit nasabah).
- Verifikasi:
  - `npm run db:generate` -> PASS
  - `npm run lint` -> PASS
  - `npm run build` -> PASS

## Gap Tersisa untuk Menutup Phase 1

- Tidak ada blocker kritis terbuka pada scope membership hardening.
