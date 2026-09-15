import "server-only";
import { buatKlienServer } from "./server";
import type { Profile } from "@/types";

/** Ambil user auth aktif (atau null). */
export async function getUser() {
  const supabase = await buatKlienServer();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/** Ambil profil (role, jam, tarif) milik user aktif. */
export async function getProfileSaya(): Promise<Profile | null> {
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

  return (data as Profile) ?? null;
}
