<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent Handoff: Koperasi Pinjam Dashboard

Dokumen ini adalah konteks kerja cepat untuk agent berikutnya agar langsung paham arsitektur, batasan data, dan flow kritis.

## 1. Stack & Struktur Utama

- Framework: Next.js `16.2.4` (App Router, Turbopack)
- Runtime UI: React `19.2.4`
- ORM: Prisma `7.7.0` + PostgreSQL (`@prisma/adapter-pg`)
- Auth: NextAuth v5 beta (Credentials provider)
- UI: shadcn + Tailwind

Folder penting:
- `src/app`: routes App Router (auth, dashboard, platform)
- `src/actions`: server actions domain bisnis
- `src/lib`: auth, tenant, accounting, prisma client, utils
- `prisma/schema.prisma`: source of truth model database
- `prisma/seed.ts`: seed default accounts/demo users

## 2. Rule Wajib Sebelum Ngoding

1. Baca panduan Next.js lokal di `node_modules/next/dist/docs/` untuk API yang mau disentuh.
2. Jangan asumsi API lama Next.js masih sama.
3. Untuk perubahan signifikan, validasi minimal dengan:
   - `npm run build`
   - bila schema berubah: `npm run db:generate`

## 3. Multi-Tenant & Auth (Sangat Penting)

### Registrasi
- Route: `/register`
- Action: `src/actions/auth-registration.ts`
- Efek:
  - create user baru
  - create company baru (`slug` unik)
  - assign role `OWNER` + `ADMIN`
  - set `user.companyId = company.id`

### Login
- Auth di `src/lib/auth.ts`.
- User ditolak login jika:
  - `user.isActive = false`
  - company non-active (`isActive=false` atau `status != ACTIVE`)

### Isolasi tenant
- Gunakan `requireCompanyId` (`src/lib/tenant.ts`) di action tenant.
- Semua query bisnis wajib filter `companyId`.
- `SUPER_ADMIN` bisa tanpa `companyId`, tapi diarahkan untuk operasi lintas tenant lewat `/platform`.

### Middleware akses
- `middleware.ts` mengatur route-level role guard.
- `/platform` hanya untuk `SUPER_ADMIN`.

## 4. Prisma/DB: Ringkasan Model Kritis

Sumber resmi: `prisma/schema.prisma`.

### Entitas inti bisnis
- `Company`, `User`, `UserRole`
- `Nasabah`, `Kelompok`, `Pengajuan`, `Pinjaman`, `JadwalAngsuran`, `Pembayaran`
- `KasKategori`, `KasTransaksi`
- `Account`, `JournalEntry`, `JournalLine`, `RekonsiliasiKas`
- `CompanySetting`, `AppSetting`

### Constraint penting
- `Nasabah`: unique `[companyId, nik]`, `[companyId, nomorAnggota]`
- `Kelompok`: unique `[companyId, kode]`
- `Account`: unique `[companyId, code]`
- `KasKategori`: unique `[companyId, key]`
- `JournalEntry`: unique `[sourceType, sourceId]` (idempotensi posting jurnal)
- `CompanySetting`: unique `[companyId, key]`

### Catatan tenant safety
- Mayoritas tabel operasional sudah punya `companyId`.
- `AuditLog` dan `ApprovalLog` tidak punya `companyId`; gunakan metadata/entity untuk pelacakan konteks.

## 5. Akuntansi: Cara Kerja Saat Ini

File utama: `src/lib/accounting.ts`

- Daftar akun default dibuat via `ensureAccountingAccounts(companyId)`.
- Mode akuntansi: `SIMPLE` / `PROPER` (`src/lib/accounting-mode.ts`, setting per company di `CompanySetting` key `ACCOUNTING_MODE`).
- Saldo kas dihitung dari `JournalLine` akun kas (`CASH_TUNAI`/`CASH_BANK`) dengan `JournalEntry.status = POSTED`.
- Posting jurnal idempotent berdasarkan `(sourceType, sourceId)`.

Flow jurnal utama:
- Pencairan pinjaman -> `postPencairanJournal`
- Pembayaran angsuran -> `postPembayaranJournal`
- Kas umum approved -> `postKasTransactionJournal`

## 6. Flow Pencairan (Bagian Paling Sensitif)

File: `src/actions/pengajuan.ts` (`cairkanPinjaman`)

Validasi saldo:
- Cek saldo berdasarkan `kasJenis` (`TUNAI`/`BANK`).
- Gunakan tanggal akhir hari pencairan (`23:59:59.999`) untuk menghindari false negative jika kas masuk terjadi di hari yang sama.

Penyebab umum error `Saldo kas tidak cukup`:
1. Transaksi modal/simpanan masih `isApproved=false`.
2. Kas masuk di `BANK`, tapi pencairan memilih `TUNAI` (atau sebaliknya).
3. Jurnal kas tidak terbentuk (mis. transaksi belum approved).

UI pencairan:
- `src/app/(dashboard)/pencairan/pencairan-form.tsx`
- Sudah ada submit lock untuk mencegah double submit/toast bentrok.

## 7. Kas & Approval

File: `src/actions/kas.ts`

- User role non-privileged input kas -> default pending (`isApproved=false`) + `ApprovalLog`.
- Role privileged (`ADMIN/MANAGER/PIMPINAN`) -> auto approved + langsung post jurnal.
- Pengeluaran (`KELUAR`) divalidasi saldo kas dulu sebelum simpan/approve.

## 8. Super Admin (Platform)

File utama:
- `src/actions/platform-admin.ts`
- pages: `/platform/users`, `/platform/companies`, `/platform/companies/[id]`

Kemampuan inti:
- Suspend/activate/delete company (soft delete via status)
- Disable/enable user
- Reset password user (temporary password)
- Semua aksi high-impact masuk audit log

Referensi perencanaan: `SUPER-ADMIN-PLAN.md`.

## 9. Runbook DB Prisma

### Lokal development
1. Set `.env` (minimal `DATABASE_URL`, `NEXTAUTH_SECRET`)
2. Install deps:
   - `npm install`
3. Generate prisma client:
   - `npm run db:generate`
4. Sinkron schema ke DB (non-migration):
   - `npm run db:push`
5. (Opsional) seed:
   - `npm run db:seed`

### Tarik struktur dari DB existing (mis. prod snapshot)
- `npx prisma db pull`
- review perubahan `prisma/schema.prisma`
- `npm run db:generate`

### Catatan migration
- `prisma.config.ts` memakai `DIRECT_URL` untuk migration jika tersedia.
- Untuk perubahan production, hindari asumsi; cek skema aktual dulu (`db pull`) sebelum buat migration.

## 10. Known Pitfalls Cepat

- Error `Can't resolve 'tailwindcss'` biasanya karena menjalankan command dari folder salah (harus di `dashboard/` yang punya `package.json` dan `node_modules`).
- Hydration mismatch sering dari text non-deterministic antara server/client (hindari data berubah saat render awal).
- Untuk unique `nik` nasabah: error sudah expected, tampilkan pesan user-friendly; cek scoping `companyId`.

## 11. Checklist Wajib Sebelum Selesai Task

1. Pastikan query/action tenant-aware (`companyId` tidak hilang).
2. Jalankan `npm run build`.
3. Jika menyentuh akuntansi:
   - cek jurnal balance
   - cek dampak ke `Neraca`, `Laba Rugi`, `Buku Besar`
4. Jika menyentuh auth/role:
   - cek login user biasa
   - cek login `SUPER_ADMIN`
   - cek guard middleware untuk route sensitif

## 12. Master Plan Ekspansi Koperasi Umum (Wajib Acuan)

- Dokumen induk: `docs/internal/MASTER-PLAN-KOPERASI-UMUM.md`
- Scope target: evolusi dari koperasi pinjam menjadi koperasi umum penuh (keanggotaan, simpanan, unit usaha, SHU, portal anggota, RAT/compliance).
- Agent yang mengerjakan fitur lintas modul wajib:
  - membaca fase aktif pada master plan,
  - mengerjakan berdasarkan urutan fase dan dependency,
  - memperbarui checklist fase terkait setelah implementasi.

## 13. Aturan Checklist Eksekusi (Mandatory)

1. Setiap task signifikan harus dirujuk ke fase/subtask checkbox di master plan.
2. Checkbox hanya boleh ditandai selesai jika:
   - implementasi selesai,
   - testing yang diwajibkan untuk item itu selesai,
   - tidak ada blocker kritis terbuka.
3. Jika ada scope baru di luar plan:
   - tambahkan subtask checkbox baru di fase terkait,
   - jelaskan dependency dan risiko singkat.
4. Untuk task yang memengaruhi multi-tenant atau akuntansi:
   - wajib tambahkan catatan validasi di section progress fase.

## 14. Aturan Changelog & Testing (Mandatory)

1. Setiap penyelesaian subtask/fase harus menambah entry di `CHANGELOG.md`.
2. Format entry minimal:
   - tanggal (`YYYY-MM-DD`),
   - fase,
   - perubahan utama,
   - status testing (unit/integration/E2E/build).
3. Testing adalah bagian definisi selesai:
   - perubahan kecil minimal `npm run build`,
   - perubahan logic bisnis minimal unit/integration yang relevan,
   - perubahan flow kritikal minimal E2E/smoke sesuai modul.
4. Dilarang menutup fase bila testing checklist pada fase tersebut belum terpenuhi.

## 15. Verifikasi Lengkap Saat Task Selesai (Mandatory)

Setiap task yang selesai wajib melewati quality gate berikut:

1. Wajib pass command dasar:
   - `npm run build`
   - `npm run lint`
2. Jika menyentuh schema/database:
   - `npm run db:generate`
3. Jika ada test automation untuk area tersebut:
   - jalankan unit/integration/E2E yang relevan dan catat hasilnya.
4. Wajib smoke test manual untuk flow yang disentuh:
   - klik alur utama end-to-end,
   - cek loading/error/empty state,
   - cek console/runtime error.
5. Wajib validasi lintas role jika relevan:
   - user biasa,
   - admin/owner,
   - `SUPER_ADMIN`.
6. Task tidak boleh ditutup jika masih ada bug sederhana yang memengaruhi flow utama:
   - tombol tidak jalan,
   - validasi form bocor,
   - hydration mismatch/runtime error,
   - dead link/route rusak,
   - print dokumen gagal.

## 16. Standar Skill Delegation (Diselaraskan Jadi 1)

Untuk orkestrasi/delegation agent, gunakan satu standar skill:

- `fork-discipline` (`~/.agents/skills/fork-discipline/SKILL.md`)

Aturan pakai:

1. Jika task menyangkut pemecahan kerja antar-agent, boundary core-vs-client, atau clean separation lintas modul, gunakan `fork-discipline` sebagai acuan utama.
2. Hindari mencampur pola delegation dari banyak skill sekaligus dalam satu task kecuali diminta eksplisit.
3. Jika ada skill orchestration lain yang terpasang, tetap treat `fork-discipline` sebagai default baseline untuk keputusan struktur kerja.
