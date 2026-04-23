# Phase 0 Scope Boundaries

Dokumen ini mendefinisikan batas implementasi Phase 0 agar konsisten dengan `SUPER-ADMIN-PLAN.md`.

## In Scope (Phase 0)

- Dokumentasi kebijakan dan SOP super admin sebagai baseline operasional.
- Penegasan kebutuhan guard middleware untuk status company `SUSPENDED/DELETED` bila model status sudah ada.
- Dokumentasi risiko dan boundary agar fase lanjutan tidak melenceng.

## Out of Scope (Phase 0)

- Implementasi penuh platform pages lintas tenant (`/platform/users`, `/platform/companies`) sebagai deliverable utama (ini berada di phase lanjutan).
- Server actions lengkap untuk reset password/suspend user/set company status.
- Migrasi multi-tenant penuh di seluruh tabel bisnis.
- Context switch/impersonation lanjutan.

## Boundary Teknis

- **Auth guard (sudah ada):** validasi `user.isActive` dan `company.status === ACTIVE` saat login (`src/lib/auth.ts`).
- **Middleware status guard (target):** belum melakukan lookup status company; middleware saat ini fokus pada role-route dan pembatasan `SUPER_ADMIN` tanpa context company (`middleware.ts`).
- **Implikasi boundary:** kontrol status company saat ini kuat di titik login, namun belum menjadi enforcement middleware berbasis status pada setiap request route.

## Definition of Done Phase 0 (Dokumentasi Readiness)

- Tersedia dokumen risk register phase 0.
- Tersedia dokumen scope boundaries phase 0.
- Checklist phase 0 di master plan diperbarui sesuai kondisi implementasi nyata.
- Changelog mencatat perubahan dokumentasi dan status pengujian.
