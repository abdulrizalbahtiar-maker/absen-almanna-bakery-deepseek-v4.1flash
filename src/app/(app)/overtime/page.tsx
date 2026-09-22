import { OvertimeClient } from "./OvertimeClient";
import { ambilOvertime, ambilProfiles } from "@/lib/supabase/queries";
import { getProfileSaya } from "@/lib/supabase/auth";
import { getTanggalWITA } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function OvertimePage() {
  const profile = await getProfileSaya();
  if (!profile) return null;

  const [daftar, profiles] = await Promise.all([ambilOvertime(), ambilProfiles()]);
  const namaMap = Object.fromEntries(profiles.map((p) => [p.id, p.nama]));

  return (
    <OvertimeClient
      hariIni={getTanggalWITA()}
      daftarAwal={daftar}
      namaMap={namaMap}
    />
  );
}
