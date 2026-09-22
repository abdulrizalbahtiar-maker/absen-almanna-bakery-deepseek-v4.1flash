"use server";

import { revalidatePath } from "next/cache";
import { buatKlienServer } from "./server";
import { buatKlienAdmin } from "./admin";
import { getUser } from "./auth";
import { catatLog } from "../activityLog";

async function wajibAdmin() {
  const user = await getUser();
  if (!user) throw new Error("Tidak terautentikasi.");
  const supabase = await buatKlienServer();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") throw new Error("Hanya admin.");
  return { user, supabase };
}

// ---------- Settings ----------

const POLA_JAM = /^([01]\d|2[0-3]):[0-5]\d$/;

function angkaDalam(nilai: unknown, min: number, maks: number): number | null {
  const n = Number(nilai);
  if (!Number.isFinite(n) || n < min || n > maks) return null;
  return n;
}

/** Ambil hanya field settings yang diizinkan, lalu validasi rentangnya. */
function bersihkanSettings(patch: Record<string, unknown>) {
  const hasil: Record<string, unknown> = {};

  if (patch.nama_lokasi !== undefined) {
    const nama = String(patch.nama_lokasi).trim();
    if (!nama) throw new Error("Nama lokasi wajib diisi.");
    hasil.nama_lokasi = nama.slice(0, 100);
  }

  if (patch.latitude !== undefined) {
    const lat = angkaDalam(patch.latitude, -90, 90);
    if (lat === null) throw new Error("Latitude harus antara -90 dan 90.");
    hasil.latitude = lat;
  }
  if (patch.longitude !== undefined) {
    const lng = angkaDalam(patch.longitude, -180, 180);
    if (lng === null) throw new Error("Longitude harus antara -180 dan 180.");
    hasil.longitude = lng;
  }
  if (patch.radius_meter !== undefined) {
    const r = angkaDalam(patch.radius_meter, 5, 5000);
    if (r === null) throw new Error("Radius harus antara 5 dan 5000 meter.");
    hasil.radius_meter = Math.round(r);
  }
  if (patch.tarif_default !== undefined) {
    const t = angkaDalam(patch.tarif_default, 0, 100_000_000);
    if (t === null) throw new Error("Tarif default tidak valid.");
    hasil.tarif_default = Math.round(t);
  }
  if (patch.toleransi_telat_menit !== undefined) {
    const t = angkaDalam(patch.toleransi_telat_menit, 0, 240);
    if (t === null) throw new Error("Toleransi telat harus antara 0 dan 240 menit.");
    hasil.toleransi_telat_menit = Math.round(t);
  }
  if (patch.jam_masuk_default !== undefined) {
    if (!POLA_JAM.test(String(patch.jam_masuk_default)))
      throw new Error("Jam masuk default tidak valid.");
    hasil.jam_masuk_default = String(patch.jam_masuk_default);
  }
  if (patch.jam_pulang_default !== undefined) {
    if (!POLA_JAM.test(String(patch.jam_pulang_default)))
      throw new Error("Jam pulang default tidak valid.");
    hasil.jam_pulang_default = String(patch.jam_pulang_default);
  }
  if (patch.tolak_diluar_radius !== undefined) {
    hasil.tolak_diluar_radius = Boolean(patch.tolak_diluar_radius);
  }

  if (Object.keys(hasil).length === 0) throw new Error("Tidak ada perubahan.");
  return hasil;
}

export async function simpanSettingsServer(patch: Record<string, unknown>) {
  const { user, supabase } = await wajibAdmin();
  const bersih = bersihkanSettings(patch);
  const { error } = await supabase.from("settings").update(bersih).eq("id", 1);
  if (error) {
    console.error("[simpanSettingsServer] gagal:", error.message);
    throw new Error("Gagal menyimpan pengaturan.");
  }
  await catatLog(user.id, "ubah_settings", JSON.stringify(bersih));
  revalidatePath("/settings");
}

// ---------- Profiles ----------

const JENIS_PROFIL: Record<string, "string" | "number"> = {
  nama: "string",
  jabatan: "string",
  jam_masuk_standar: "string",
  jam_pulang_standar: "string",
  tarif_lembur_per_jam: "number",
  tarif_denda_per_jam: "number",
};

/** Ambil hanya field profil yang diizinkan, lalu validasi formatnya. */
function bersihkanProfil(patch: Record<string, unknown>) {
  const hasil: Record<string, unknown> = {};
  for (const [kunci, tipe] of Object.entries(JENIS_PROFIL)) {
    if (patch[kunci] === undefined) continue;
    const nilai = patch[kunci];
    if (tipe === "number") {
      const n = angkaDalam(nilai, 0, 100_000_000);
      if (n === null) throw new Error(`${kunci} tidak valid.`);
      hasil[kunci] = Math.round(n);
    } else if (kunci === "jam_masuk_standar" || kunci === "jam_pulang_standar") {
      if (!POLA_JAM.test(String(nilai))) throw new Error(`${kunci} tidak valid.`);
      hasil[kunci] = String(nilai);
    } else {
      const teks = String(nilai).trim();
      if (!teks) throw new Error(`${kunci} wajib diisi.`);
      hasil[kunci] = teks.slice(0, 100);
    }
  }
  if (Object.keys(hasil).length === 0) throw new Error("Tidak ada perubahan.");
  return hasil;
}

export async function ubahProfilServer(id: string, patch: Record<string, unknown>) {
  await wajibAdmin();
  const supabase = await buatKlienServer();
  const bersih = bersihkanProfil(patch);
  const { error } = await supabase.from("profiles").update(bersih).eq("id", id);
  if (error) {
    console.error("[ubahProfilServer] gagal:", error.message);
    throw new Error("Gagal menyimpan perubahan karyawan.");
  }
  revalidatePath("/settings");
}

export async function tambahKaryawanServer(input: {
  nama: string;
  email: string;
  jabatan: string;
  password: string;
}) {
  const { user } = await wajibAdmin();
  const admin = buatKlienAdmin();
  const email = input.email.trim().toLowerCase();

  if (input.password.length < 6) throw new Error("Password minimal 6 karakter.");

  const { data: ada } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (ada) throw new Error("Email sudah terdaftar.");

  const { data: dibuat, error: errUser } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
  });
  if (errUser || !dibuat.user) throw new Error(errUser?.message ?? "Gagal membuat user.");

  const { data: settings } = await admin.from("settings").select("*").eq("id", 1).single();

  const { error: errProfile } = await admin.from("profiles").insert({
    id: dibuat.user.id,
    email,
    nama: input.nama.trim(),
    jabatan: input.jabatan || "Staff",
    role: "karyawan",
    jam_masuk_standar: settings?.jam_masuk_default ?? "08:00",
    jam_pulang_standar: settings?.jam_pulang_default ?? "17:00",
    tarif_lembur_per_jam: settings?.tarif_default ?? 20000,
    tarif_denda_per_jam: 0,
    is_active: true,
  });
  if (errProfile) {
    await admin.auth.admin.deleteUser(dibuat.user.id);
    throw new Error(errProfile.message);
  }

  await catatLog(user.id, "tambah_karyawan", email);
  revalidatePath("/settings");
}

export async function hapusKaryawanServer(id: string) {
  const { user } = await wajibAdmin();
  const admin = buatKlienAdmin();

  const { data: target } = await admin
    .from("profiles")
    .select("role,email")
    .eq("id", id)
    .single();
  if (!target) throw new Error("Karyawan tidak ditemukan.");
  if (target.role === "admin") throw new Error("Akun admin tidak bisa dihapus.");

  // Hapus auth user; baris profiles + transaksi ikut terhapus via ON DELETE CASCADE.
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);

  await catatLog(user.id, "hapus_karyawan", target.email ?? id);
  revalidatePath("/settings");
}

// ---------- Reset transaksi ----------

export async function resetTransaksiServer(target: "attendance" | "overtime" | "all") {
  const { user } = await wajibAdmin();
  const admin = buatKlienAdmin();

  const jumlah: Record<string, number> = {};

  if (target === "attendance" || target === "all") {
    const { count } = await admin
      .from("attendance")
      .select("id", { count: "exact", head: true });
    const { error } = await admin.from("attendance").delete().not("id", "is", null);
    if (error) {
      console.error("[resetTransaksi] gagal hapus attendance:", error.message);
      throw new Error("Gagal reset data absensi.");
    }
    jumlah.attendance = count ?? 0;
  }

  if (target === "overtime" || target === "all") {
    const { count } = await admin
      .from("overtime_requests")
      .select("id", { count: "exact", head: true });
    const { error } = await admin.from("overtime_requests").delete().not("id", "is", null);
    if (error) {
      console.error("[resetTransaksi] gagal hapus overtime:", error.message);
      throw new Error("Gagal reset data lembur.");
    }
    jumlah.overtime = count ?? 0;
  }

  await catatLog(
    user.id,
    "reset_transaksi",
    JSON.stringify({ target, dihapus: jumlah }),
  );
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}
