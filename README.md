# Absensi Al Manna Bakery

Aplikasi absensi GPS + rekap keterlambatan & lembur. Lihat `PRD.md` sebagai acuan.

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind v4 + Leaflet + Supabase (Auth + Postgres + RLS) + exceljs.

---

## 1. Prasyarat

- Node.js 20.9+
- Akun Supabase (project kosong)

## 2. Setup environment

```bash
cp .env.local.example .env.local
```

Isi `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`SUPABASE_SERVICE_ROLE_KEY` hanya dipakai server. Jangan expose ke browser / commit ke git.

## 3. Jalankan migrasi database

Buka **Supabase Dashboard → SQL Editor**, tempel seluruh isi
`supabase/migrations/0001_init.sql`, lalu **Run**.

Skrip ini membuat tabel `profiles`, `settings`, `attendance`, `overtime_requests`,
`activity_logs`, helper `private.is_admin()`, dan semua RLS policy.

Lalu jalankan patch perbaikan advisor: buka
`supabase/migrations/0002_advisor_fixes.sql`, tempel di SQL Editor, **Run**.
(Menghapus view lama + memindahkan `is_admin()` ke schema `private`.)

### Troubleshooting migrasi

- **Jangan hapus file 0001** setelah dijalankan. Perbaikan dibuat sebagai file
  baru (0002), bukan dengan mengedit file yang sudah dijalankan.
- Jika 0002 gagal dengan `2BP01 cannot drop function is_admin() because other
  objects depend on it`, jalankan dulu di SQL Editor:

  ```sql
  drop function if exists public.is_admin() cascade;
  ```

  lalu jalankan ulang `0002_advisor_fixes.sql`. File 0002 versi terbaru sudah
  diurutkan benar (drop policy → drop function → create policy), jadi untuk
  instalasi baru tidak perlu langkah ini.
- Setelah selesai, cek menu **Advisors** di Supabase — error view & warning
  `is_admin` harus hilang.

## 4. Seed akun awal (9 akun)

```bash
node --env-file=.env.local scripts/seed.mjs
```

Membuat 1 admin + 8 karyawan. Password default karyawan: `password123`.
Akun admin: `almannabakery2@gmail.com` / `almannabakery2026`.

Aman dijalankan berulang (akun yang sudah ada dilewati).

## 5. Jalankan aplikasi

```bash
npm install
npm run dev
```

Buka http://localhost:3000, login dengan email + password.

> Geolocation hanya berfungsi di HTTPS atau `localhost`.

## Perintah

```bash
npm run dev        # dev server
npm run build      # build produksi
npm run lint       # eslint
npm run test       # vitest
```

## Struktur

- `src/lib/` — logika murni (geo, late, overtime, denda, time, format)
- `src/lib/supabase/` — klien browser/server/admin + helper auth
- `src/components/map/OfficeMap.tsx` — Leaflet (dynamic, ssr:false)
- `src/app/(app)/` — dashboard, attendance, overtime, reports, settings
- `src/app/api/` — route handler (absen, lembur, reports, settings, employees)
- `src/proxy.ts` — proteksi route + refresh sesi Supabase
- `supabase/migrations/` — skema SQL
- `scripts/seed.mjs` — seed akun awal
- `tests/` — unit test logika murni

## Catatan versi

Next.js 16: `middleware` → `proxy`, `next lint` dihapus (pakai `eslint`),
Turbopack default, `cookies()`/`headers()` async.
