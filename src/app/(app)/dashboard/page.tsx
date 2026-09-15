"use client";

import { useMemo } from "react";
import { useSesi } from "@/components/SesiProvider";
import { Card } from "@/components/ui/Card";
import { formatRupiah } from "@/lib/format";
import { rekapKeterlambatan, rekapLembur, statistikHariIni } from "@/lib/mockStore";
import { useMockVersi } from "@/lib/useMockStore";
import { useTanggalWita } from "@/lib/useTanggalWita";

export default function DashboardPage() {
  const { profile } = useSesi();
  const hariIni = useTanggalWita();
  const versi = useMockVersi();

  const mulaiBulan = hariIni ? `${hariIni.slice(0, 7)}-01` : "";
  const akhirBulan = hariIni ?? "";

  // versi sengaja jadi pemicu: mockStore bukan sumber reaktif.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const statHari = useMemo(() => statistikHariIni(), [versi]);

  const capaian = useMemo(() => {
    if (!profile || profile.role !== "karyawan" || !mulaiBulan || !akhirBulan) {
      return null;
    }
    const late = rekapKeterlambatan(mulaiBulan, akhirBulan).find(
      (r) => r.profile_id === profile.id,
    );
    const ot = rekapLembur(mulaiBulan, akhirBulan).find(
      (r) => r.profile_id === profile.id,
    );
    return {
      hadir: late?.total_hari_hadir ?? 0,
      hariTelat: late?.total_hari_telat ?? 0,
      menitTelat: late?.total_menit_telat ?? 0,
      denda: late?.total_denda ?? 0,
      jamLembur: ot?.total_jam ?? 0,
      nominalLembur: ot?.total_nominal ?? 0,
    };
    // versi sengaja jadi pemicu: mockStore bukan sumber reaktif.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, mulaiBulan, akhirBulan, versi]);

  if (!profile) return null;

  if (profile.role === "karyawan") {
    const kartu = capaian
      ? [
          { label: "Hadir", nilai: String(capaian.hadir) },
          { label: "Hari telat", nilai: String(capaian.hariTelat) },
          { label: "Menit telat", nilai: String(capaian.menitTelat) },
          { label: "Denda", nilai: formatRupiah(capaian.denda) },
          { label: "Jam lembur", nilai: String(capaian.jamLembur) },
          { label: "Nominal lembur", nilai: formatRupiah(capaian.nominalLembur) },
        ]
      : [];

    return (
      <div>
        <h1 className="text-base font-extrabold text-ink">Dashboard</h1>
        <p className="mb-4 text-xs text-ink-soft">
          {hariIni ? `Bulan berjalan · ${hariIni}` : "\u00A0"}
        </p>

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

  const kartuAdmin = [
    { label: "Karyawan aktif", nilai: statHari.totalAktif },
    { label: "Hadir", nilai: statHari.hadir },
    { label: "Telat", nilai: statHari.telat },
    { label: "Belum absen", nilai: statHari.belumAbsen },
    { label: "Lembur pending", nilai: statHari.pendingLembur },
  ];

  return (
    <div>
      <h1 className="text-base font-extrabold text-ink">Dashboard</h1>
      <p className="mb-4 text-xs text-ink-soft">{hariIni ? `${hariIni} · WITA` : "\u00A0"}</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {kartuAdmin.map((k) => (
          <Card key={k.label}>
            <p className="text-xs font-semibold text-ink-soft">{k.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-primary">{k.nilai}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
