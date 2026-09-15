# Absensi Al Manna Bakery

Aplikasi absensi GPS + rekap keterlambatan & lembur. Lihat `PRD.md` sebagai acuan.

## Status

Fase 1-4 selesai (frontend + mode mock). Fase 5-7 (Supabase, settings backend, deploy) belum dikerjakan.

## Menjalankan

```bash
cp .env.local.example .env.local   # sudah di-set NEXT_PUBLIC_MOCK_MODE=true
npm install
npm run dev
```

Buka `/login`, pilih akun mock (9 akun), lalu masuk.

## Perintah

```bash
npm run dev        # dev server
npm run build      # build produksi
npm run lint       # eslint
npm run test       # vitest
```

## Struktur

- `src/lib/` — logika murni (geo, late, overtime, time), mock data/store, excel
- `src/components/map/OfficeMap.tsx` — Leaflet (dynamic, ssr:false)
- `src/app/(app)/` — dashboard, attendance, overtime, reports, settings
- `src/proxy.ts` — proteksi route + role (Next.js 16: pengganti middleware)
- `tests/` — unit test rumus bab 8 + integrasi mockStore

## Catatan versi

Next.js 16.3.5: `middleware` → `proxy`, `next lint` dihapus, Turbopack default,
`cookies()`/`headers()` async. Mode mock diatur `NEXT_PUBLIC_MOCK_MODE`.
