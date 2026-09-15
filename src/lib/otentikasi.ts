"use client";

import { buatKlienBrowser } from "@/lib/supabase/client";

export async function loginSupabase(email: string, password: string) {
  const supabase = buatKlienBrowser();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) {
    const pesan =
      error.message.toLowerCase().includes("invalid")
        ? "Email atau password salah."
        : error.message;
    return { sukses: false, pesan };
  }
  return { sukses: true, pesan: null, userId: data.user?.id ?? null };
}

export async function logoutSupabase() {
  const supabase = buatKlienBrowser();
  await supabase.auth.signOut();
}
