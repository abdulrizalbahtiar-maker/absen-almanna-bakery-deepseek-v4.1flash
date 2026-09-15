"use client";

import { useMemo, useState } from "react";
import { useSesi } from "@/components/SesiProvider";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { buatExcelRekap, namaFileRekap, unduhBlob } from "@/lib/excel";
import { formatRupiah } from "@/lib/format";
import { rekapKeterlambatan, rekapLembur } from "@/lib/mockStore";
import { useMockVersi } from "@/lib/useMockStore";
import { useTanggalWita } from "@/lib/useTanggalWita";

type TipeToast = "sukses" | "error" | "info";

export default function ReportsPage() {
  const { profile } = useSesi();
  const [mulaiManual, setMulai] = useState<string | null>(null);
  const [akhirManual, setAkhir] = useState<string | null>(null);
  const versi = useMockVersi();
  const [sibuk, setSibuk] = useState(false);
  const [toast, setToast] = useState<{ pesan: string; tipe: TipeToast } | null>(null);

  const hariIni = useTanggalWita();
  // Periode default diturunkan (bukan setState di effect) agar aman hidrasi.
  const mulai = mulaiManual ?? (hariIni ? `${hariIni.slice(0, 7)}-01` : "");
  const akhir = akhirManual ?? hariIni ?? "";

  const siapPeriode = mulai !== "" && akhir !== "";
  const hanyaMilikSaya = profile?.role !== "admin";

  const late = useMemo(() => {
    if (!profile || !siapPeriode || mulai > akhir) return [];
    const rows = rekapKeterlambatan(mulai, akhir);
    return hanyaMilikSaya ? rows.filter((r) => r.profile_id === profile.id) : rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mulai, akhir, profile, hanyaMilikSaya, versi, siapPeriode]);

  const ot = useMemo(() => {
    if (!profile || !siapPeriode || mulai > akhir) return [];
    const rows = rekapLembur(mulai, akhir);
    return hanyaMilikSaya ? rows.filter((r) => r.profile_id === profile.id) : rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mulai, akhir, profile, hanyaMilikSaya, versi, siapPeriode]);

  const totalTelat = late.reduce((n, r) => n + r.total_menit_telat, 0);
  const totalMenitEfektif = late.reduce((n, r) => n + r.total_menit_efektif, 0);
  const totalDenda = late.reduce((n, r) => n + r.total_denda, 0);
  const totalNominal = ot.reduce((n, r) => n + r.total_nominal, 0);

  async function unduh() {
    setSibuk(true);
    try {
      const blob = await buatExcelRekap(late, ot);
      unduhBlob(blob, namaFileRekap(mulai, akhir));
      setToast({ pesan: "Excel diunduh.", tipe: "sukses" });
    } catch {
      setToast({ pesan: "Gagal membuat Excel.", tipe: "error" });
    } finally {
      setSibuk(false);
    }
  }

  if (profile && profile.role !== "admin") {
    return <p className="text-sm text-ink-soft">Halaman ini hanya untuk admin.</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-base font-extrabold text-ink">Rekap</h1>

      <Card>
        <CardTitle
          extra={
            <Button onClick={unduh} disabled={sibuk || late.length === 0}>
              {sibuk ? "Menyiapkan…" : "Export Excel"}
            </Button>
          }
        >
          Periode
        </CardTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Dari">
            <Input type="date" value={mulai} onChange={(e) => setMulai(e.target.value)} />
          </Field>
          <Field label="Sampai">
            <Input type="date" value={akhir} onChange={(e) => setAkhir(e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card>
        <CardTitle>Keterlambatan</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
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
