import { AttendanceClient } from "./AttendanceClient";
import { ambilSettings } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const settings = await ambilSettings();
  if (!settings) {
    return <p className="text-sm text-ink-soft">Settings belum diinisialisasi.</p>;
  }
  return <AttendanceClient settings={settings} />;
}
