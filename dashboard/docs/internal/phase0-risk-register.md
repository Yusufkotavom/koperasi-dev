# Phase 0 Risk Register

Dokumen ini mencatat risiko untuk kesiapan dokumentasi dan guardrail awal sesuai `SUPER-ADMIN-PLAN.md` (bagian **Phase 0 (1-2 hari)**).

## Ruang Lingkup Phase 0 (Acuan)

- Buat halaman docs: kebijakan dan SOP super admin.
- Tambah guard di middleware untuk company `SUSPENDED/DELETED` (jika status ditambahkan).

## Status Implementasi Saat Ini (Repo)

- Item docs kebijakan/SOP: **sudah ada** di `SUPER-ADMIN-PLAN.md`.
- Item guard middleware status company: **belum ada** pengecekan status company di `middleware.ts` (guard status aktif saat login ada di `src/lib/auth.ts`).

## Risk Register

| ID | Risiko | Dampak | Kemungkinan | Mitigasi | Owner | Status |
|---|---|---|---|---|---|---|
| R-001 | Guard status company tidak dieksekusi di middleware | User dengan sesi lama berpotensi tetap mengakses route tertentu walau company sudah `SUSPENDED/DELETED` sampai token/sesi diperbarui | Sedang | Tambahkan validasi status company pada middleware untuk route dashboard non-public | Engineering | Open |
| R-002 | Salah tafsir antara guard login vs guard middleware | Celah kontrol akses karena menganggap proteksi sudah penuh padahal masih parsial | Sedang | Dokumentasikan boundary kontrol (auth vs middleware) dan checklist verifikasi per release | Engineering | Open |
| R-003 | Operasi high-impact super admin tanpa SOP operasional ringkas terpisah | Inkonstistensi eksekusi incident operation (reset/suspend/delete) | Rendah | Pertahankan SOP di master plan dan referensikan pada docs internal tambahan | Product + Engineering | Mitigated |
| R-004 | Drift antara master plan dan dokumen internal phase 0 | Implementasi tidak selaras dengan baseline scope resmi | Sedang | Gunakan checklist phase 0 di master plan sebagai single source of truth status | Engineering | Mitigated |

## Exit Criteria Phase 0 (Dokumentasi)

- Risk register tersedia dan menaut ke scope Phase 0.
- Batas scope dan non-scope terdokumentasi eksplisit.
- Checklist di master plan mencerminkan kondisi implementasi aktual repo.
