import { ReportsClient } from "./ReportsClient";
import { getProfileSaya } from "@/lib/supabase/auth";
import { ambilRekapGabungan } from "@/lib/supabase/queries";
import { getTanggalWITA, validasiPeriode } from "@/lib/time";

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
  const mulaiAwal = (sp.from as string) || `${hariIni.slice(0, 7)}-01`;
  const akhirAwal = (sp.to as string) || hariIni;

  const periode = validasiPeriode(mulaiAwal, akhirAwal);
  const mulai = periode.valid ? mulaiAwal : `${hariIni.slice(0, 7)}-01`;
  const akhir = periode.valid ? akhirAwal : hariIni;

  const { keterlambatan: late, lembur: ot } = await ambilRekapGabungan(mulai, akhir);

  return (
    <ReportsClient
      late={late}
      ot={ot}
      mulai={mulai}
      akhir={akhir}
      pesanPeriode={periode.valid ? null : (periode.pesan ?? null)}
    />
  );
}
