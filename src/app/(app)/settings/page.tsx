"use client";

import { useMemo, useState } from "react";
import { useSesi } from "@/components/SesiProvider";
import OfficeMap from "@/components/map/OfficeMapDynamic";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import {
  getProfiles,
  getSettings,
  resetTransaksi,
  tambahKaryawan,
  updateProfile,
  updateSettings,
} from "@/lib/mockStore";
import { useMockVersi } from "@/lib/useMockStore";
import type { Profile, Settings } from "@/types";

type TipeToast = "sukses" | "error" | "info";

export default function SettingsPage() {
  const { profile } = useSesi();
  const [state, setState] = useState<Settings>(() => ({ ...getSettings() }));
  const versi = useMockVersi();
  const [toast, setToast] = useState<{ pesan: string; tipe: TipeToast } | null>(null);
  const [formBaru, setFormBaru] = useState({ nama: "", email: "", jabatan: "Staff" });

  const daftar = useMemo(
    () => getProfiles().filter((p) => p.role === "karyawan"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [versi],
  );

  if (!profile || profile.role !== "admin") {
    return <p className="text-sm text-ink-soft">Halaman ini hanya untuk admin.</p>;
  }

  function simpanSettings() {
    updateSettings(state);
    setToast({ pesan: "Pengaturan disimpan.", tipe: "sukses" });
  }

  function tambah() {
    if (!formBaru.nama.trim() || !formBaru.email.trim()) {
      setToast({ pesan: "Nama dan email wajib.", tipe: "error" });
      return;
    }
    tambahKaryawan(formBaru);
    setFormBaru({ nama: "", email: "", jabatan: "Staff" });
    setToast({ pesan: "Karyawan ditambahkan.", tipe: "sukses" });
  }

  function ubahKaryawan(id: string, patch: Partial<Profile>) {
    updateProfile(id, patch);
  }

  function reset(target: "attendance" | "overtime" | "all") {
    const kata = window.prompt(`Ketik ULANG untuk konfirmasi reset "${target}"`);
    if (kata !== "ULANG") {
      setToast({ pesan: "Konfirmasi salah.", tipe: "error" });
      return;
    }
    resetTransaksi(target);
    setToast({ pesan: "Reset selesai. Master aman.", tipe: "sukses" });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-base font-extrabold text-ink">Pengaturan</h1>

      <OfficeMap
        kantorLat={state.latitude}
        kantorLng={state.longitude}
        radiusMeter={state.radius_meter}
        mode="picker"
        onPilih={(lat, lng) => setState({ ...state, latitude: lat, longitude: lng })}
      />

      <Card>
        <CardTitle>Lokasi & default</CardTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nama lokasi">
            <Input
              value={state.nama_lokasi}
              onChange={(e) => setState({ ...state, nama_lokasi: e.target.value })}
            />
          </Field>
          <Field label={`Radius (${state.radius_meter} m)`}>
            <input
              type="range"
              min={25}
              max={500}
              step={5}
              value={state.radius_meter}
              onChange={(e) => setState({ ...state, radius_meter: Number(e.target.value) })}
              className="w-full accent-[#d97706]"
            />
          </Field>
          <Field label="Latitude">
            <Input
              type="number"
              step="0.000001"
              value={state.latitude}
              onChange={(e) => setState({ ...state, latitude: Number(e.target.value) })}
            />
          </Field>
          <Field label="Longitude">
            <Input
              type="number"
              step="0.000001"
              value={state.longitude}
              onChange={(e) => setState({ ...state, longitude: Number(e.target.value) })}
            />
          </Field>
          <Field label="Jam masuk default">
            <Input
              type="time"
              value={state.jam_masuk_default}
              onChange={(e) => setState({ ...state, jam_masuk_default: e.target.value })}
            />
          </Field>
          <Field label="Jam pulang default">
            <Input
              type="time"
              value={state.jam_pulang_default}
              onChange={(e) => setState({ ...state, jam_pulang_default: e.target.value })}
            />
          </Field>
          <Field label="Tarif default (Rp/jam)">
            <Input
              type="number"
              value={state.tarif_default}
              onChange={(e) => setState({ ...state, tarif_default: Number(e.target.value) })}
            />
          </Field>
          <Field label="Tolak di luar radius">
            <Select
              value={state.tolak_diluar_radius ? "true" : "false"}
              onChange={(e) =>
                setState({ ...state, tolak_diluar_radius: e.target.value === "true" })
              }
            >
              <option value="true">Ya (tolak)</option>
              <option value="false">Tidak (simpan berflag)</option>
            </Select>
          </Field>
        </div>
        <Button className="mt-4" onClick={simpanSettings}>
          Simpan pengaturan
        </Button>
      </Card>

      <Card>
        <CardTitle>Karyawan</CardTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Nama">
            <Input
              value={formBaru.nama}
              onChange={(e) => setFormBaru({ ...formBaru, nama: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <Input
              value={formBaru.email}
              onChange={(e) => setFormBaru({ ...formBaru, email: e.target.value })}
            />
          </Field>
          <Field label="Jabatan">
            <Input
              value={formBaru.jabatan}
              onChange={(e) => setFormBaru({ ...formBaru, jabatan: e.target.value })}
            />
          </Field>
        </div>
        <Button className="mt-3" onClick={tambah}>
          Tambah karyawan
        </Button>

        <div className="mt-4 divide-y divide-border">
          {daftar.map((k) => (
            <div key={k.id} className="grid gap-2 py-3 sm:grid-cols-4 sm:items-center">
              <div>
                <p className="text-sm font-semibold text-ink">{k.nama}</p>
                <p className="text-xs text-ink-soft">{k.jabatan}</p>
              </div>
              <Input
                type="time"
                value={k.jam_masuk_standar}
                onChange={(e) => ubahKaryawan(k.id, { jam_masuk_standar: e.target.value })}
              />
              <Input
                type="time"
                value={k.jam_pulang_standar}
                onChange={(e) => ubahKaryawan(k.id, { jam_pulang_standar: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={k.tarif_lembur_per_jam}
                  onChange={(e) =>
                    ubahKaryawan(k.id, { tarif_lembur_per_jam: Number(e.target.value) })
                  }
                />
                <button
                  onClick={() => ubahKaryawan(k.id, { is_active: !k.is_active })}
                  title={k.is_active ? "Nonaktifkan" : "Aktifkan"}
                >
                  <Badge tone={k.is_active ? "sukses" : "bahaya"}>
                    {k.is_active ? "Aktif" : "Nonaktif"}
                  </Badge>
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>Reset transaksi</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button varian="outline" onClick={() => reset("attendance")}>
            Reset absensi
          </Button>
          <Button varian="outline" onClick={() => reset("overtime")}>
            Reset lembur
          </Button>
          <Button varian="danger" onClick={() => reset("all")}>
            Reset semua transaksi
          </Button>
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          Master (karyawan & pengaturan) tidak dihapus.
        </p>
      </Card>

      <Toast pesan={toast?.pesan ?? null} tipe={toast?.tipe} onTutup={() => setToast(null)} />
    </div>
  );
}
