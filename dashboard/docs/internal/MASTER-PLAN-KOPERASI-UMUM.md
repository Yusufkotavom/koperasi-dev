# MASTER PLAN KOPERASI UMUM

Dokumen induk eksekusi ekspansi koperasi umum dengan model checklist berbasis bukti (evidence-gated).

## Aturan Evidence-Gated (Berlaku untuk semua fase)

- Gunakan `[ ]` untuk item yang belum punya bukti lengkap.
- Gunakan `[x]` hanya jika seluruh evidence minimum tersedia.
- Evidence minimum per item:
  - tanggal/waktu eksekusi (UTC),
  - owner/pelaksana,
  - command/test yang dijalankan,
  - hasil ringkas (PASS/FAIL),
  - artefak/path file/log yang bisa diverifikasi.
- Jika salah satu komponen evidence belum ada, status harus tetap `[ ]`.

## Quality Gate Lintas Fase

- Wajib: `npm run lint`
- Wajib: `npm run build`
- Wajib bila schema berubah: `npm run db:generate`
- Wajib jalankan test relevan (unit/integration/E2E/smoke) jika suite sudah tersedia pada area perubahan.

## Phase 1 - Stabilization & Delivery Baseline

Status fase: `IN PROGRESS`
Progress detail: `docs/internal/progress/PHASE-1-PROGRESS.md`

### Checklist Phase 1

- [x] P1.1 Baseline dokumen testing/orchestrator tersedia.
  - Evidence: `docs/internal/testing-baseline.md`, `docs/internal/progress/ORCHESTRATOR-RUN-LOG-TEMPLATE.md`
- [x] P1.2 Baseline quality gate sudah dieksekusi pada batch aktif.
  - Evidence: `npm run lint` PASS, `npm run build` PASS (catatan run di `docs/internal/progress/PHASE-1-PROGRESS.md`)
- [x] P1.3 Hardening upload nasabah (limit file + MIME/size + tenant-aware path) sudah terdokumentasi dan terverifikasi build/lint.
  - Evidence: catatan implementasi + verifikasi pada `docs/internal/progress/PHASE-1-PROGRESS.md`
- [x] P1.4 Export CSV nasabah tenant-aware + wiring tombol UI sudah terdokumentasi dan terverifikasi build/lint.
  - Evidence: catatan implementasi + verifikasi pada `docs/internal/progress/PHASE-1-PROGRESS.md`
- [x] P1.5 Fitur survey notes nasabah end-to-end (schema/action/api/ui) sudah terdokumentasi dan terverifikasi.
  - Evidence: `npm run db:generate` PASS, `npm run lint` PASS, `npm run build` PASS pada `docs/internal/progress/PHASE-1-PROGRESS.md`
- [x] P1.6 Progress log Phase 1 mencatat evidence command/result/artifact secara run-by-run.
  - Evidence: `docs/internal/progress/PHASE-1-PROGRESS.md`
- [ ] P1.7 Review akhir Phase 1 + keputusan go/no-go resmi.
  - Evidence: belum ada sign-off/reviewer gate final.

## Phase 2 - Ekspansi Koperasi Umum (Simpan-Pinjam + SHU + Operasional)

Status fase: `IN PROGRESS`
Progress detail: `docs/internal/progress/PHASE-2-PROGRESS.md`

### Checklist Phase 2

- [ ] P2.1 Scope freeze Phase 2 (modul simpanan, SHU, unit usaha, portal anggota) disetujui.
- [ ] P2.2 Desain domain + schema detail Phase 2 disetujui (model, relasi, constraint, multi-tenant guard).
- [x] P2.3 Migration/database update Phase 2 dieksekusi dan diverifikasi (`db:generate` + validasi schema) untuk scope membership hardening.
- [x] P2.4 Server actions/API inti Phase 2 implementasi lengkap dengan tenant isolation untuk scope membership hardening.
- [x] P2.5 UI dashboard operasional Phase 2 implementasi (admin + anggota) dengan state error/loading/empty yang benar untuk scope membership hardening.
- [ ] P2.6 Integrasi akuntansi/jurnal untuk transaksi baru (simpanan, SHU, unit usaha) tervalidasi balance.
- [x] P2.7 Paket testing Phase 2 lengkap: unit + integration + smoke area membership hardening.
- [ ] P2.8 Validasi lintas role (user biasa, admin/owner, SUPER_ADMIN) untuk flow kritikal.
- [ ] P2.9 Dokumentasi progress/changelog Phase 2 lengkap + review go/no-go final.

## Referensi

- `docs/internal/progress/PHASE-1-PROGRESS.md`
- `docs/internal/progress/PHASE-2-PROGRESS.md`
- `docs/internal/progress/ORCHESTRATOR-RUN-LOG-TEMPLATE.md`
- `docs/internal/testing-baseline.md`
