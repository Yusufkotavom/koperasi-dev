# Phase 2 Progress

Template progress untuk `Phase 2 - Ekspansi Koperasi Umum (Simpan-Pinjam + SHU + Operasional)`.
Seluruh item default `[ ]` sampai evidence nyata tersedia.

## Ringkasan

- Phase: `Phase 2 - Ekspansi Koperasi Umum`
- Status: `IN PROGRESS`
- Last updated (UTC): `2026-04-23 18:36`

## Checklist & Evidence (Detail)

- [ ] P2.1 Scope freeze Phase 2 disetujui.
  - Owner: `TBD`
  - Updated at (UTC): `TBD`
  - Evidence:
    - Artefak scope final: `TBD`
    - Approval/reviewer: `TBD`

- [ ] P2.2 Desain domain + schema detail disetujui.
  - Owner: `TBD`
  - Updated at (UTC): `TBD`
  - Evidence:
    - ERD/model doc: `TBD`
    - Daftar constraint/index: `TBD`
    - Review multi-tenant guard: `TBD`

- [x] P2.3 Migration/database update dieksekusi dan diverifikasi (scope membership hardening).
  - Owner: `orchestrator`
  - Updated at (UTC): `2026-04-23 18:36`
  - Evidence:
    - Command/Test: `npm run db:generate`
    - Result: `PASS`
    - Migration path: `prisma/migrations/20260423190000_membership_phase2_hardening/migration.sql`

- [x] P2.4 Server actions/API inti implementasi lengkap dengan tenant isolation (scope membership hardening).
  - Owner: `orchestrator`
  - Updated at (UTC): `2026-04-23 18:36`
  - Evidence:
    - Daftar action/API: `src/actions/nasabah.ts`, `src/actions/kelompok.ts`, `src/actions/dashboard.ts`, `src/app/api/upload/nasabah/route.ts`, `src/app/api/nasabah/[id]/survey/route.ts`, `src/app/api/nasabah/export/route.ts`
    - Verifikasi guard `requireCompanyId`/equivalent: `PASS`
    - Integration test/API test: `src/app/api/upload/nasabah/__tests__/route.test.ts` -> `PASS`

- [x] P2.5 UI operasional Phase 2 (admin + anggota) implementasi lengkap (scope membership hardening).
  - Owner: `orchestrator`
  - Updated at (UTC): `2026-04-23 18:36`
  - Evidence:
    - Daftar halaman/fitur: `src/app/(dashboard)/kelompok/_components/kelompok-form.tsx`, `src/app/(dashboard)/kelompok/page.tsx`, `src/app/(dashboard)/nasabah/page.tsx`, `src/app/(dashboard)/nasabah/[id]/page.tsx`, `src/app/(dashboard)/nasabah/[id]/edit/edit-form.tsx`
    - Smoke test loading/error/empty state: `src/app/(dashboard)/nasabah/__tests__/page.test.tsx`, `src/app/(dashboard)/kelompok/__tests__/page.test.tsx` -> `PASS`

- [ ] P2.6 Integrasi akuntansi/jurnal transaksi baru tervalidasi balance.
  - Owner: `TBD`
  - Updated at (UTC): `TBD`
  - Evidence:
    - Command/Test: `TBD`
    - Result neraca/laba-rugi/buku-besar: `TBD`
    - Artefak rekonsiliasi: `TBD`

- [x] P2.7 Paket testing Phase 2 lengkap (unit + integration + smoke) untuk scope membership hardening.
  - Owner: `orchestrator`
  - Updated at (UTC): `2026-04-23 18:36`
  - Evidence:
    - Unit: `npm run test` -> `PASS` (`src/actions/__tests__/*`)
    - Integration: `npm run test` -> `PASS` (`src/app/api/upload/nasabah/__tests__/route.test.ts`)
    - E2E/Smoke: `npm run test` -> `PASS` (`page smoke tests` nasabah & kelompok)

- [ ] P2.8 Validasi lintas role selesai (user biasa, admin/owner, SUPER_ADMIN).
  - Owner: `TBD`
  - Updated at (UTC): `TBD`
  - Evidence:
    - Role test matrix: `TBD`
    - Hasil validasi guard route/aksi sensitif: `TBD`

- [ ] P2.9 Dokumentasi/changelog lengkap + keputusan go/no-go final.
  - Owner: `TBD`
  - Updated at (UTC): `TBD`
  - Evidence:
    - Update `CHANGELOG.md`: `TBD`
    - Reviewer sign-off: `TBD`
    - Decision: `TBD`

## Log Eksekusi Phase 2

- Update (UTC 2026-04-23 18:36):
  - Phase 2 difokuskan pada scope membership hardening (kolektor persisted per kelompok, ranking kesehatan kelompok, race-safe nomor anggota, audit log nasabah, test baseline).
  - Verifikasi: `npm run db:generate`, `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npm run build` -> PASS.
- Gunakan template: `docs/internal/progress/ORCHESTRATOR-RUN-LOG-TEMPLATE.md`
