# Phase 1 Membership Implementation Backlog

## Tujuan
Menyelesaikan modul keanggotaan Tahap 1 (Master Nasabah + Master Kelompok) dengan checklist eksekusi yang bisa langsung dikerjakan lintas `API`, `actions`, `pages`, dan `tests`.

## Mapping ke MASTER-PLAN-KOPERASI-UMUM.md
Referensi yang dipakai di repo: `docs/superpowers/plans/plan.md` (konten master plan).

| Master Plan | Scope Phase 1 Membership | Status Saat Ini | Gap Implementasi |
|---|---|---|---|
| 1. Master Nasabah | CRUD, status anggota, filter, histori, dokumen | Sebagian besar sudah ada (`src/actions/nasabah.ts`, halaman nasabah) | Belum ada test otomatis; catatan survey belum dedicated; export belum ada |
| 2. Master Kelompok | CRUD kelompok, anggota, ketua, metrik kelompok | Sudah ada CRUD + anggota + ketua (`src/actions/kelompok.ts`) | Penugasan kolektor eksplisit per kelompok belum persisted; ranking kelompok belum formal |
| Prioritas MVP Tahap 1 | Master Nasabah + Master Kelompok siap operasional | Operasional dasar sudah jalan | Hardening API, regression tests, dan acceptance checklist belum ada |

## Backlog Eksekusi

### A. API
- [x] `src/app/api/upload/nasabah/route.ts`: tambah validasi MIME/ukuran file + limit jumlah file per request.
- [x] `src/app/api/upload/nasabah/route.ts`: enforce tenant-aware path (sertakan `companyId` pada prefix upload).
- [x] `src/app/api/nasabah/export/route.ts` (baru): endpoint export CSV data nasabah sesuai filter list page.
- [x] `src/app/api/nasabah/[id]/survey/route.ts` (baru): endpoint catatan survey membership (minimal create/list).

### B. Server Actions
- [x] `src/actions/nasabah-survey.ts`: tambah action create/list catatan survey membership (dipisah dari `nasabah.ts`).
- [x] `src/actions/nasabah.ts`: hardening `createNasabah` nomor anggota agar race-safe (counter table / sequence strategy).
- [x] `src/actions/nasabah.ts` + `src/actions/nasabah-status.ts`: audit log untuk create/update/status/delete.
- [x] `src/actions/kelompok.ts`: tambah field penugasan kolektor eksplisit per kelompok (persisted).
- [x] `src/actions/dashboard.ts`: tambah metrik ranking kesehatan kelompok (berbasis tunggakan/outstanding).

### C. Pages / UI
- [x] `src/app/(dashboard)/nasabah/page.tsx`: sambungkan tombol `Export Data` ke endpoint export.
- [x] `src/app/(dashboard)/nasabah/[id]/page.tsx`: tampilkan timeline catatan survey.
- [x] `src/app/(dashboard)/nasabah/[id]/edit/edit-form.tsx`: input/edit catatan survey ringkas.
- [x] `src/app/(dashboard)/kelompok/page.tsx`: tampilkan kolektor penanggung jawab yang persisted di kelompok + ranking kesehatan.
- [x] `src/app/(dashboard)/kelompok/_components/kelompok-form.tsx`: tambah field pilih kolektor penanggung jawab kelompok.

### D. Tests (Belum Ada Baseline, Harus Dibuat)
- [x] Setup test runner (`vitest`) dan script `npm run test`.
- [x] `src/actions/__tests__/nasabah.actions.test.ts`: test duplicate NIK + tenant guard.
- [x] `src/actions/__tests__/kelompok.actions.test.ts`: test create minimal + forbidden delete.
- [x] `src/app/api/upload/nasabah/__tests__/route.test.ts`: test unauthorized, no file, invalid mime, success upload.
- [x] `src/app/(dashboard)/nasabah/__tests__/page.test.tsx`: smoke test render list + filter state.
- [x] `src/app/(dashboard)/kelompok/__tests__/page.test.tsx`: smoke test render summary + table rows.

## Definition of Done (Per Item)
- [x] Lulus `npm run lint`.
- [x] Lulus `npx tsc --noEmit`.
- [x] Lulus `npm run build`.
- [x] Lulus `npm run test` (setelah baseline test ditambahkan).
- [x] Checklist UAT membership: create anggota, assign ke kelompok, ubah status, hapus aman, verifikasi histori tetap konsisten.

## Sprint Breakdown (Disarankan)

### Sprint 1 (Hardening Core)
- [x] A1, A2, B2, B3
- [x] D1

### Sprint 2 (Feature Completion)
- [x] A3, A4, B1, B4, B5
- [x] C1, C2, C3, C4, C5

### Sprint 3 (Quality Gate)
- [x] D2, D3, D4, D5, D6
- [x] Semua Definition of Done + UAT membership.
