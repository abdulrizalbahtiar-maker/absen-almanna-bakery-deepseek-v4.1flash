import { Card } from "@/components/ui/Card";
import { formatRupiah } from "@/lib/format";
import { getProfileSaya } from "@/lib/supabase/auth";
import {
  ambilRekapGabungan,
  ambilStatistikHariIni,
} from "@/lib/supabase/queries";
import { getTanggalWITA } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await getProfileSaya();
  if (!profile) return null;

  const hariIni = getTanggalWITA();
  const mulaiBulan = `${hariIni.slice(0, 7)}-01`;

  if (profile.role === "karyawan") {
    const { keterlambatan, lembur } = await ambilRekapGabungan(mulaiBulan, hariIni);
    const late = keterlambatan.find((r) => r.profile_id === profile.id);
    const ot = lembur.find((r) => r.profile_id === profile.id);

    const kartu = [
      { label: "Hadir", nilai: String(late?.total_hari_hadir ?? 0) },
      { label: "Hari telat", nilai: String(late?.total_hari_telat ?? 0) },
      { label: "Menit telat", nilai: String(late?.total_menit_telat ?? 0) },
      { label: "Denda", nilai: formatRupiah(late?.total_denda ?? 0) },
      { label: "Jam lembur", nilai: String(ot?.total_jam ?? 0) },
      { label: "Nominal lembur", nilai: formatRupiah(ot?.total_nominal ?? 0) },
    ];

    return (
      <div>
        <h1 className="text-base font-extrabold text-ink">Dashboard</h1>
        <p className="mb-4 text-xs text-ink-soft">Bulan berjalan · {hariIni}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {kartu.map((k) => (
            <Card key={k.label}>
              <p className="text-xs font-semibold text-ink-soft">{k.label}</p>
              <p className="mt-1 text-xl font-extrabold text-primary">{k.nilai}</p>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const s = await ambilStatistikHariIni(hariIni);
  const kartu = [
    { label: "Karyawan aktif", nilai: s.totalAktif },
    { label: "Hadir", nilai: s.hadir },
    { label: "Telat", nilai: s.telat },
    { label: "Belum absen", nilai: s.belumAbsen },
    { label: "Lembur pending", nilai: s.pendingLembur },
  ];

  return (
    <div>
      <h1 className="text-base font-extrabold text-ink">Dashboard</h1>
      <p className="mb-4 text-xs text-ink-soft">{hariIni} · WITA</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {kartu.map((k) => (
          <Card key={k.label}>
            <p className="text-xs font-semibold text-ink-soft">{k.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-primary">{k.nilai}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
