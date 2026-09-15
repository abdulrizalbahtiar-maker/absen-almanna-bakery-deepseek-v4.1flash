import { ReportsClient } from "./ReportsClient";
import { getProfileSaya } from "@/lib/supabase/auth";
import {
  ambilRekapKeterlambatan,
  ambilRekapLembur,
} from "@/lib/supabase/queries";
import { getTanggalWITA } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: PageProps<"/reports">) {
  const profile = await getProfileSaya();
  if (!profile || profile.role !== "admin") {
    return <p className="text-sm text-ink-soft">Halaman ini hanya untuk admin.</p>;
  }

  const sp = await searchParams;
  const hariIni = getTanggalWITA();
  const mulai = (sp.from as string) || `${hariIni.slice(0, 7)}-01`;
  const akhir = (sp.to as string) || hariIni;

  const [late, ot] = await Promise.all([
    ambilRekapKeterlambatan(mulai, akhir),
    ambilRekapLembur(mulai, akhir),
  ]);

  return <ReportsClient late={late} ot={ot} mulai={mulai} akhir={akhir} />;
}
