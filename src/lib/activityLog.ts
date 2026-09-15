import "server-only";
import { buatKlienAdmin } from "./supabase/admin";

/** Tulis log aksi sensitif. Gagal-log tidak boleh menghentikan aksi utama. */
export async function catatLog(
  actorId: string,
  jenisAksi: string,
  detail?: string,
) {
  try {
    const admin = buatKlienAdmin();
    await admin.from("activity_logs").insert({
      actor_id: actorId,
      jenis_aksi: jenisAksi,
      detail: detail ?? null,
    });
  } catch {
    // abaikan
  }
}
