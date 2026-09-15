"use client";

import { useCallback, useMemo, useState } from "react";
import { useSesi } from "@/components/SesiProvider";
import OfficeMap from "@/components/map/OfficeMapDynamic";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";
import { jarakKeKantor } from "@/lib/geo";
import {
  cariAttendance,
  getAttendance,
  getProfiles,
  getSettings,
  prosesAbsen,
} from "@/lib/mockStore";
import { useMockVersi } from "@/lib/useMockStore";
import { useTanggalWita } from "@/lib/useTanggalWita";
import type { GeoPoint } from "@/types";

type TipeToast = "sukses" | "error" | "info";

export default function AttendancePage() {
  const { profile } = useSesi();
  const [geo, setGeo] = useState<GeoPoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [gagal, setGagal] = useState(false);
  const [toast, setToast] = useState<{ pesan: string; tipe: TipeToast } | null>(null);
  const versi = useMockVersi();

  // versi sengaja jadi pemicu: mockStore bukan sumber reaktif.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const settings = useMemo(() => getSettings(), [versi]);
  const namaMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of getProfiles()) m.set(p.id, p.nama);
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versi]);

  const hari = useTanggalWita();
  const absenHariIni =
    profile && hari ? cariAttendance(profile.id, hari) : undefined;
  const sudahMasuk = Boolean(absenHariIni?.jam_masuk);
  const sudahPulang = Boolean(absenHariIni?.jam_pulang);

  const riwayat = useMemo(() => {
    if (!profile) return [];
    const semua = getAttendance();
    const milik =
      profile.role === "admin" ? semua : semua.filter((a) => a.profile_id === profile.id);
    return [...milik].sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1)).slice(0, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, versi]);

  const ambilLokasi = useCallback(() => {
    if (!navigator.geolocation) {
      setToast({ pesan: "Browser tidak mendukung GPS.", tipe: "error" });
      return;
    }
    setLoading(true);
    setGagal(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          akurasi: pos.coords.accuracy,
        });
        setLoading(false);
        setGagal(false);
      },
      (err) => {
        setLoading(false);
        setGagal(true);
        if (err.code === err.PERMISSION_DENIED) {
          setToast({
            pesan: "Izin lokasi diblokir. Buka pengaturan izin situs lalu izinkan lokasi.",
            tipe: "error",
          });
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setToast({
            pesan: "Posisi tidak tersedia. Pindah ke area terbuka lalu coba lagi.",
            tipe: "error",
          });
        } else {
          setToast({
            pesan: "Waktu habis mencari lokasi (30 dtk). Coba lagi atau pindah ke area terbuka.",
            tipe: "error",
          });
        }
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 30000 },
    );
  }, []);

  function lakukan(tipe: "check-in" | "check-out") {
    if (!profile || !geo) return;
    const hasil = prosesAbsen(profile, tipe, geo);
    setToast({ pesan: hasil.pesan, tipe: hasil.sukses ? "sukses" : "error" });
  }

  if (!profile) return null;

  const jarak = geo
    ? Math.round(jarakKeKantor(geo.lat, geo.lng, settings.latitude, settings.longitude))
    : null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-extrabold text-ink">Absen</h1>
        <p className="text-xs text-ink-soft">
          {hari ? `${hari} · WITA · ` : ""}shift {profile.jam_masuk_standar}-
          {profile.jam_pulang_standar}
        </p>
      </div>

      <OfficeMap
        kantorLat={settings.latitude}
        kantorLng={settings.longitude}
        radiusMeter={settings.radius_meter}
        userLat={geo?.lat}
        userLng={geo?.lng}
        mode="tampil"
      />

      <Card>
        <CardTitle>Lokasi</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button onClick={ambilLokasi} disabled={loading}>
            {loading ? (
              <>
                <Spinner ukuran="sm" /> Mencari lokasi…
              </>
            ) : (
              "Ambil lokasi"
            )}
          </Button>
          {gagal && !loading && (
            <Button varian="outline" onClick={ambilLokasi}>
              Coba lagi
            </Button>
          )}
        </div>

        {loading && (
          <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-ink-soft">
            <Spinner ukuran="sm" className="text-primary" /> Mencari sinyal GPS…
          </p>
        )}

        {geo && (
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-ink-soft">Jarak ke kantor</dt>
              <dd className="font-bold text-ink">{jarak} m</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">Akurasi</dt>
              <dd className="font-bold text-ink">{Math.round(geo.akurasi)} m</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">Radius</dt>
              <dd className="font-bold text-ink">{settings.radius_meter} m</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">Status</dt>
              <dd>
                {jarak != null && jarak <= settings.radius_meter ? (
                  <Badge tone="sukses">Dalam radius</Badge>
                ) : (
                  <Badge tone="bahaya">Di luar radius</Badge>
                )}
              </dd>
            </div>
          </dl>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => lakukan("check-in")} disabled={!geo || sudahMasuk}>
            Check-in
          </Button>
          <Button
            varian="outline"
            onClick={() => lakukan("check-out")}
            disabled={!geo || !sudahMasuk || sudahPulang}
          >
            Check-out
          </Button>
        </div>

        {absenHariIni && (
          <p className="mt-3 text-xs text-ink-soft">
            Masuk {absenHariIni.jam_masuk ?? "-"} · Pulang {absenHariIni.jam_pulang ?? "-"} ·
            Telat {absenHariIni.menit_terlambat} menit
          </p>
        )}
      </Card>

      <Card>
        <CardTitle>Riwayat</CardTitle>
        {riwayat.length === 0 ? (
          <p className="text-sm text-ink-soft">Belum ada data.</p>
        ) : (
          <div className="divide-y divide-border">
            {riwayat.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-semibold text-ink">{a.tanggal}</p>
                  <p className="text-xs text-ink-soft">
                    {profile.role === "admin" && `${namaMap.get(a.profile_id) ?? "-"} · `}
                    {a.jam_masuk ?? "-"} → {a.jam_pulang ?? "-"}
                  </p>
                </div>
                {a.menit_terlambat > 0 ? (
                  <Badge tone="peringatan">Telat {a.menit_terlambat}m</Badge>
                ) : (
                  <Badge tone="sukses">Tepat</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Toast pesan={toast?.pesan ?? null} tipe={toast?.tipe} onTutup={() => setToast(null)} />
    </div>
  );
}
