import { AttendanceClient } from "./AttendanceClient";
import { ambilSettings } from "@/lib/supabase/queries";
import { getProfileSaya } from "@/lib/supabase/auth";
import { getTanggalWITA } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const profile = await getProfileSaya();
  if (!profile) return null;

  const settings = await ambilSettings();
  if (!settings) {
    return <p className="text-sm text-ink-soft">Settings belum diinisialisasi.</p>;
  }
  return <AttendanceClient settings={settings} hari={getTanggalWITA()} />;
}
