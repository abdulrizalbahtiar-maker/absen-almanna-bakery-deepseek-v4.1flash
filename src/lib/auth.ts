import type { Profile } from "@/types";

export interface HasilLogin {
  sukses: boolean;
  pesan: string | null;
  profile: Profile | null;
}

/** Verifikasi login email + password terhadap daftar profil (mode mock). */
export function verifikasiLogin(
  email: string,
  password: string,
  profiles: Profile[],
): HasilLogin {
  const emailBersih = email.trim().toLowerCase();

  if (!emailBersih || !password) {
    return { sukses: false, pesan: "Email dan password wajib diisi.", profile: null };
  }

  const profil = profiles.find((p) => p.email.toLowerCase() === emailBersih);
  if (!profil) {
    return { sukses: false, pesan: "Email tidak terdaftar.", profile: null };
  }

  if (profil.password !== password) {
    return { sukses: false, pesan: "Password salah.", profile: null };
  }

  return { sukses: true, pesan: null, profile: profil };
}
