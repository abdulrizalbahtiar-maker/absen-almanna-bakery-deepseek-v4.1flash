"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { statistikHariIni } from "@/lib/mockStore";
import { getTanggalWITA } from "@/lib/time";
import { useMockVersi } from "@/lib/useMockStore";

export default function DashboardPage() {
  const hari = getTanggalWITA();
  const versi = useMockVersi();
  // versi sengaja jadi pemicu: mockStore bukan sumber reaktif.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const s = useMemo(() => statistikHariIni(), [versi]);
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
      <p className="mb-4 text-xs text-ink-soft">{hari} · WITA</p>

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
