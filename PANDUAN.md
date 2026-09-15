# Panduan Pemula — Absensi Al Manna Bakery

Panduan ini untuk yang belum terbiasa dengan Supabase/terminal. Ikuti berurutan.

---

## 1. Apa yang sudah dan belum dilakukan

| Langkah | Status |
| --- | --- |
| Buat project Supabase | Sudah |
| Isi `.env.local` (kredensial) | Sudah |
| Jalankan migrasi `0001_init.sql` | Sudah (kamu) |
| Jalankan patch `0002_advisor_fixes.sql` | Sedang dilakukan |
| Seed 9 akun | Sudah |
| Menjalankan aplikasi (`npm run dev`) | Setelah 0002 |

---

## 2. Kebingungan umum soal 0001 dan 0002

- **0001 yang sudah di-paste — jangan dihapus.** Biarkan. Itu sudah menjadi
  database.
- **0002 caranya sama** seperti 0001: buka SQL Editor → New query → paste → Run.
- **0002 tidak menghapus data.** Hanya membongkar 2 view usang dan memindahkan
  1 fungsi. Data karyawan/absen/lembur aman.
- **Urutan wajib:** 0001 dulu, baru 0002. Tidak boleh dibalik.

Analogi: 0001 = membangun rumah. 0002 = renovasi kecil setelah rumah berdiri.

---

## 3. Cara menjalankan 0002 (langkah demi langkah)

1. Buka **supabase.com**, login.
2. Pilih project **nuvbhyrxpurxrrclflcj**.
3. Menu kiri → **SQL Editor**.
4. Klik **+ New query**.
5. Buka file `supabase/migrations/0002_advisor_fixes.sql`, **copy seluruh isinya**.
6. Paste ke kotak query.
7. Klik **Run** (atau `Ctrl+Enter`).
8. Berhasil bila muncul **"Success. No rows returned"** (itu normal, bukan error).
9. Menu kiri → **Advisors** → Refresh. Error & warning harus hilang.

### Kalau 0002 gagal dengan `2BP01 cannot drop function is_admin()...`

Jalankan dulu di SQL Editor:

```sql
drop function if exists public.is_admin() cascade;
```

Lalu jalankan ulang `0002_advisor_fixes.sql`. File 0002 terbaru sudah diurutkan
benar, jadi untuk instalasi baru langkah ini tidak diperlukan.

---

## 4. Menjalankan aplikasi

Di terminal (VS Code), di folder project:

```bash
npm run dev
```

Buka `http://localhost:3000`.

---

## 5. Kredensial login

| Peran | Email | Password |
| --- | --- | --- |
| Admin | `almannabakery2@gmail.com` | `almannabakery2026` |
| Karyawan | `kar01@almanna.test` | `password123` |
| Karyawan | `kar02@almanna.test` … `kar08@almanna.test` | `password123` |

---

## 6. Uji cepat

- **Admin**: Dashboard, Rekap (export Excel), Pengaturan (atur radius, tarif,
  denda, tambah/hapus karyawan).
- **Karyawan**: Dashboard (rekap bulan berjalan), Absen (GPS), Lembur.
- **GPS**: browser hanya mengizinkan geolocation di **HTTPS** atau **localhost**.
  Untuk uji dari HP, perlu deploy HTTPS dulu (mis. Netlify).

---

## 7. Istilah

| Istilah | Arti sederhana |
| --- | --- |
| SQL Editor | Tempat menjalankan perintah ke database Supabase. |
| Migrasi (0001, 0002) | File berisi perintah database, dijalankan berurutan. |
| `drop view` | Menghapus tabel bayangan yang tidak dipakai. |
| RLS / policy | Aturan siapa boleh lihat/ubah data apa. |
| `security definer` | Fungsi yang jalan dengan izin pembuatnya (untuk cek admin). |
| Advisors | Fitur Supabase pemberi saran/peringatan keamanan. |
| Seed | Mengisi data awal (9 akun). |
