"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { formatRupiah } from "@/lib/format";
import { tanggalValid } from "@/lib/time";
import type { LateReportRow, OvertimeReportRow } from "@/types";

type TipeToast = "sukses" | "error" | "info";

export function ReportsClient({
  late,
  ot,
  mulai,
  akhir,
  pesanPeriode = null,
}: {
  late: LateReportRow[];
  ot: OvertimeReportRow[];
  mulai: string;
  akhir: string;
  pesanPeriode?: string | null;
}) {
  const router = useRouter();
  const [dari, setDari] = useState(mulai);
  const [sampai, setSampai] = useState(akhir);
  const [sibuk, setSibuk] = useState(false);
  const [toast, setToast] = useState<{ pesan: string; tipe: TipeToast } | null>(null);

  const totalTelat = late.reduce((n, r) => n + r.total_menit_telat, 0);
  const totalMenitEfektif = late.reduce((n, r) => n + r.total_menit_efektif, 0);
  const totalDenda = late.reduce((n, r) => n + r.total_denda, 0);
  const totalNominal = ot.reduce((n, r) => n + r.total_nominal, 0);

  const periodeBerubah = dari !== mulai || sampai !== akhir;

  function terapkan() {
    if (!tanggalValid(dari) || !tanggalValid(sampai)) {
      setToast({ pesan: "Tanggal tidak valid.", tipe: "error" });
      return;
    }
    if (dari > sampai) {
      setToast({ pesan: "Tanggal 'dari' harus sebelum 'sampai'.", tipe: "error" });
      return;
    }
    router.push(`/reports?from=${dari}&to=${sampai}`);
  }

  async function unduh() {
    // Export mengikuti periode yang sedang tampil agar tidak mengekspor data lama.
    setSibuk(true);
    try {
      const res = await fetch(`/api/reports/export?from=${mulai}&to=${akhir}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rekap-${mulai.replaceAll("-", "")}-sampai-${akhir.replaceAll("-", "")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setToast({ pesan: "Excel diunduh.", tipe: "sukses" });
    } catch {
      setToast({ pesan: "Gagal membuat Excel.", tipe: "error" });
    } finally {
      setSibuk(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-ink">Rekap</h1>
        <p className="text-xs text-ink-soft">
          Periode {mulai} s/d {akhir}
        </p>
      </div>

      {pesanPeriode && (
        <p className="rounded-xl border border-danger/30 bg-danger-soft px-3 py-2 text-xs font-semibold text-danger">
          {pesanPeriode} Menampilkan periode default.
        </p>
      )}

      <Card>
        <CardTitle
          extra={
            <Button onClick={unduh} disabled={sibuk || periodeBerubah}>
              {sibuk ? "Menyiapkan…" : "Export Excel"}
            </Button>
          }
        >
          Periode
        </CardTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Dari">
            <Input type="date" value={dari} onChange={(e) => setDari(e.target.value)} />
          </Field>
          <Field label="Sampai">
            <Input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} />
          </Field>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button varian="outline" onClick={terapkan}>
            Terapkan periode
          </Button>
          {periodeBerubah && (
            <span className="text-xs font-semibold text-primary-dark">
              Periode belum diterapkan.
            </span>
          )}
        </div>
      </Card>

      <Card>
        <CardTitle>Keterlambatan</CardTitle>

        {/* Mobile: kartu per karyawan */}
        <div className="space-y-3 sm:hidden">
          {late.map((r) => (
            <div key={r.profile_id} className="rounded-xl border border-border p-3">
              <p className="text-sm font-semibold text-ink">{r.nama}</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Hadir</dt>
                  <dd className="font-semibold">{r.total_hari_hadir}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Telat</dt>
                  <dd className="font-semibold">{r.total_hari_telat}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Menit</dt>
                  <dd className="font-semibold">{r.total_menit_telat}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Efektif</dt>
                  <dd className="font-semibold">{r.total_menit_efektif}</dd>
                </div>
              </dl>
              <p className="mt-2 text-sm font-bold text-danger">
                Denda {formatRupiah(r.total_denda)}
              </p>
            </div>
          ))}
          {late.length === 0 && <p className="text-sm text-ink-soft">Tidak ada data.</p>}
        </div>

        {/* Desktop: tabel */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-soft">
                <th className="py-2 pr-3">Nama</th>
                <th className="py-2 pr-3">Hadir</th>
                <th className="py-2 pr-3">Telat</th>
                <th className="py-2 pr-3">Menit</th>
                <th className="py-2 pr-3">Menit efektif</th>
                <th className="py-2 pr-3">Denda/jam</th>
                <th className="py-2">Total denda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {late.map((r) => (
                <tr key={r.profile_id}>
                  <td className="py-2 pr-3 font-semibold text-ink">{r.nama}</td>
                  <td className="py-2 pr-3">{r.total_hari_hadir}</td>
                  <td className="py-2 pr-3">{r.total_hari_telat}</td>
                  <td className="py-2 pr-3">{r.total_menit_telat}</td>
                  <td className="py-2 pr-3">{r.total_menit_efektif}</td>
                  <td className="py-2 pr-3">{formatRupiah(r.tarif_denda_per_jam)}</td>
                  <td className="py-2 font-semibold text-danger">{formatRupiah(r.total_denda)}</td>
                </tr>
              ))}
              {late.length > 0 && (
                <tr className="font-bold">
                  <td className="py-2 pr-3">TOTAL</td>
                  <td />
                  <td />
                  <td className="py-2 pr-3">{totalTelat}</td>
                  <td className="py-2 pr-3">{totalMenitEfektif}</td>
                  <td />
                  <td className="py-2 text-danger">{formatRupiah(totalDenda)}</td>
                </tr>
              )}
            </tbody>
          </table>
          {late.length === 0 && <p className="text-sm text-ink-soft">Tidak ada data.</p>}
        </div>
      </Card>

      <Card>
        <CardTitle>Lembur (Approved)</CardTitle>

        {/* Mobile: kartu per karyawan */}
        <div className="space-y-3 sm:hidden">
          {ot.map((r) => (
            <div key={r.profile_id} className="rounded-xl border border-border p-3">
              <p className="text-sm font-semibold text-ink">{r.nama}</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Pengajuan</dt>
                  <dd className="font-semibold">{r.total_pengajuan_approved}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Jam</dt>
                  <dd className="font-semibold">{r.total_jam}</dd>
                </div>
              </dl>
              <p className="mt-2 text-sm font-bold text-success">
                {formatRupiah(r.total_nominal)}
              </p>
            </div>
          ))}
          {ot.length === 0 && <p className="text-sm text-ink-soft">Tidak ada data.</p>}
        </div>

        {/* Desktop: tabel */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-soft">
                <th className="py-2 pr-3">Nama</th>
                <th className="py-2 pr-3">Jml</th>
                <th className="py-2 pr-3">Jam</th>
                <th className="py-2 pr-3">Tarif</th>
                <th className="py-2">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ot.map((r) => (
                <tr key={r.profile_id}>
                  <td className="py-2 pr-3 font-semibold text-ink">{r.nama}</td>
                  <td className="py-2 pr-3">{r.total_pengajuan_approved}</td>
                  <td className="py-2 pr-3">{r.total_jam}</td>
                  <td className="py-2 pr-3">{formatRupiah(r.tarif_per_jam)}</td>
                  <td className="py-2">{formatRupiah(r.total_nominal)}</td>
                </tr>
              ))}
              {ot.length > 0 && (
                <tr className="font-bold">
                  <td className="py-2 pr-3">TOTAL</td>
                  <td />
                  <td />
                  <td />
                  <td className="py-2">{formatRupiah(totalNominal)}</td>
                </tr>
              )}
            </tbody>
          </table>
          {ot.length === 0 && <p className="text-sm text-ink-soft">Tidak ada data.</p>}
        </div>
      </Card>

      <Toast pesan={toast?.pesan ?? null} tipe={toast?.tipe} onTutup={() => setToast(null)} />
    </div>
  );
}
