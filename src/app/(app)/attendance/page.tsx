"use client";

import { useCallback, useEffect, useState } from "react";
import { useSesi } from "@/components/SesiProvider";
import OfficeMap from "@/components/map/OfficeMapDynamic";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";
import { jarakKeKantor } from "@/lib/geo";
import { getTanggalWITA } from "@/lib/time";
import type { Attendance, GeoPoint, Settings } from "@/types";

type TipeToast = "sukses" | "error" | "info";

export default function AttendancePage() {
  const { profile } = useSesi();
  const [geo, setGeo] = useState<GeoPoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [gagal, setGagal] = useState(false);
  const [toast, setToast] = useState<{ pesan: string; tipe: TipeToast } | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [absenHariIni, setAbsenHariIni] = useState<Attendance | null>(null);
  const [riwayat, setRiwayat] = useState<Attendance[]>([]);
  const [versi, setVersi] = useState(0);

  const hari = getTanggalWITA();

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((j) => setSettings(j.data ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!profile) return;
    fetch("/api/attendance/history")
      .then((r) => r.json())
      .then((j) => {
        const rows: Attendance[] = j.data ?? [];
        setRiwayat(rows.slice(0, 10));
        setAbsenHariIni(rows.find((a) => a.tanggal === hari) ?? null);
      })
      .catch(() => {});
  }, [profile, hari, versi]);

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

  async function lakukan(tipe: "check-in" | "check-out") {
    if (!geo) return;
    setLoading(true);
    const res = await fetch(`/api/attendance/${tipe}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geo),
    });
    const j = await res.json().catch(() => ({}));
    setToast({ pesan: j.pesan ?? "Selesai.", tipe: res.ok ? "sukses" : "error" });
    setLoading(false);
    if (res.ok) setVersi((n) => n + 1);
  }

  if (!profile || !settings) return null;

  const sudahMasuk = Boolean(absenHariIni?.jam_masuk);
  const sudahPulang = Boolean(absenHariIni?.jam_pulang);
  const jarak = geo
    ? Math.round(jarakKeKantor(geo.lat, geo.lng, settings.latitude, settings.longitude))
    : null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-extrabold text-ink">Absen</h1>
        <p className="text-xs text-ink-soft">
          {hari} · WITA · shift {profile.jam_masuk_standar}-{profile.jam_pulang_standar}
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
          <Button onClick={() => lakukan("check-in")} disabled={!geo || loading || sudahMasuk}>
            Check-in
          </Button>
          <Button
            varian="outline"
            onClick={() => lakukan("check-out")}
            disabled={!geo || loading || !sudahMasuk || sudahPulang}
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
