/**
 * Seed 9 akun (1 admin + 8 karyawan) ke Supabase.
 *
 * PRASYARAT:
 * 1. Migrasi supabase/migrations/0001_init.sql sudah dijalankan di SQL Editor.
 * 2. .env.local berisi NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 *
 * JALANKAN:
 *   node --env-file=.env.local scripts/seed.mjs
 *
 * Aman diulang: user yang emailnya sudah ada akan dilewati.
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib ada di .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD_DEFAULT = process.env.SEED_PASSWORD_KARYAWAN ?? "password123";
const PASSWORD_ADMIN = process.env.SEED_PASSWORD_ADMIN ?? "almannabakery2026";
const EMAIL_ADMIN = process.env.SEED_EMAIL_ADMIN ?? "almannabakery2@gmail.com";

const AKUN = [
  { email: EMAIL_ADMIN, nama: "Admin Bakery", jabatan: "Owner", role: "admin", masuk: "08:00", pulang: "17:00", lembur: 0, denda: 0, password: PASSWORD_ADMIN },
  { email: "kar01@almanna.test", nama: "Karyawan 01", jabatan: "Kasir", role: "karyawan", masuk: "08:00", pulang: "17:00", lembur: 20000, denda: 15000 },
  { email: "kar02@almanna.test", nama: "Karyawan 02", jabatan: "Baker", role: "karyawan", masuk: "07:00", pulang: "16:00", lembur: 25000, denda: 20000 },
  { email: "kar03@almanna.test", nama: "Karyawan 03", jabatan: "Baker", role: "karyawan", masuk: "07:00", pulang: "16:00", lembur: 25000, denda: 20000 },
  { email: "kar04@almanna.test", nama: "Karyawan 04", jabatan: "Packing", role: "karyawan", masuk: "08:00", pulang: "17:00", lembur: 15000, denda: 10000 },
  { email: "kar05@almanna.test", nama: "Karyawan 05", jabatan: "Packing", role: "karyawan", masuk: "08:00", pulang: "17:00", lembur: 15000, denda: 10000 },
  { email: "kar06@almanna.test", nama: "Karyawan 06", jabatan: "Kurir", role: "karyawan", masuk: "09:00", pulang: "18:00", lembur: 18000, denda: 12000 },
  { email: "kar07@almanna.test", nama: "Karyawan 07", jabatan: "Cleaning", role: "karyawan", masuk: "08:00", pulang: "17:00", lembur: 15000, denda: 10000 },
  { email: "kar08@almanna.test", nama: "Karyawan 08", jabatan: "Admin Toko", role: "karyawan", masuk: "08:30", pulang: "17:30", lembur: 20000, denda: 15000 },
];

async function cariUserByEmail(email) {
  // halaman list user (cukup untuk skala kecil)
  let page = 1;
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 200) return null;
    page += 1;
  }
  return null;
}

async function main() {
  for (const a of AKUN) {
    const passwordAkun = a.password ?? PASSWORD_DEFAULT;
    let user = await cariUserByEmail(a.email);

    if (!user) {
      const { data, error } = await admin.auth.admin.createUser({
        email: a.email,
        password: passwordAkun,
        email_confirm: true,
        app_metadata: { role: a.role },
      });
      if (error) {
        console.error(`[GAGAL create] ${a.email}:`, error.message);
        continue;
      }
      user = data.user;
      console.log(`[create] ${a.email}`);
    } else {
      // Pastikan password + role metadata sesuai.
      await admin.auth.admin.updateUserById(user.id, {
        password: passwordAkun,
        app_metadata: { role: a.role },
      });
      console.log(`[skip]   ${a.email} (sudah ada, password & role disinkronkan)`);
    }

    const { error: upErr } = await admin.from("profiles").upsert(
      {
        id: user.id,
        email: a.email,
        nama: a.nama,
        jabatan: a.jabatan,
        role: a.role,
        jam_masuk_standar: a.masuk,
        jam_pulang_standar: a.pulang,
        tarif_lembur_per_jam: a.lembur,
        tarif_denda_per_jam: a.denda,
        is_active: true,
      },
      { onConflict: "id" },
    );
    if (upErr) {
      console.error(`[GAGAL profile] ${a.email}:`, upErr.message);
    } else {
      console.log(`[profile] ${a.email} -> ${a.role}`);
    }
  }
  console.log("\nSelesai. Password seed dapat diatur via SEED_PASSWORD_KARYAWAN / SEED_PASSWORD_ADMIN.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
