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

export async function simpanSettingsServer(patch: Record<string, unknown>) {
  const { user, supabase } = await wajibAdmin();
  const { error } = await supabase.from("settings").update(patch).eq("id", 1);
  if (error) throw new Error(error.message);
  await catatLog(user.id, "ubah_settings", JSON.stringify(patch));
  revalidatePath("/settings");
}

// ---------- Profiles ----------

export async function ubahProfilServer(id: string, patch: Record<string, unknown>) {
  await wajibAdmin();
  const supabase = await buatKlienServer();
  const { error } = await supabase.from("profiles").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
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

  if (target === "attendance" || target === "all") {
    await admin.from("attendance").delete().not("id", "is", null);
  }
  if (target === "overtime" || target === "all") {
    await admin.from("overtime_requests").delete().not("id", "is", null);
  }
  await catatLog(user.id, "reset_transaksi", target);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
