import { SettingsClient } from "./SettingsClient";
import { getProfileSaya } from "@/lib/supabase/auth";
import { ambilProfiles, ambilSettings } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await getProfileSaya();
  if (!profile || profile.role !== "admin") {
    return <p className="text-sm text-ink-soft">Halaman ini hanya untuk admin.</p>;
  }

  const [settings, profiles] = await Promise.all([ambilSettings(), ambilProfiles()]);
  if (!settings) {
    return <p className="text-sm text-ink-soft">Settings belum diinisialisasi.</p>;
  }

  const daftar = profiles.filter((p) => p.role === "karyawan");

  return <SettingsClient settingsAwal={settings} daftarAwal={daftar} />;
}
