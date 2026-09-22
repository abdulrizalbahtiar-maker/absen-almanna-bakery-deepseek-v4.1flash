import "server-only";
import { cache } from "react";
import { buatKlienServer } from "./server";
import { normalisasiJam } from "../late";
import type { Profile } from "@/types";

/**
 * Ambil user auth aktif (atau null).
 * Di-cache per-request agar tidak memanggil Supabase berulang.
 */
export const getUser = cache(async () => {
  const supabase = await buatKlienServer();
  const { data } = await supabase.auth.getUser();
  return data.user;
});

/**
 * Ambil profil (role, jam, tarif) milik user aktif.
 * Di-cache per-request: layout & halaman berbagi hasil yang sama.
 */
export const getProfileSaya = cache(async (): Promise<Profile | null> => {
  const supabase = await buatKlienServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!data) return null;
  const p = data as Profile;
  return {
    ...p,
    jam_masuk_standar: normalisasiJam(p.jam_masuk_standar) ?? p.jam_masuk_standar,
    jam_pulang_standar: normalisasiJam(p.jam_pulang_standar) ?? p.jam_pulang_standar,
  };
});
