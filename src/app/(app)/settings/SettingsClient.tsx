"use client";

import { useState, useTransition } from "react";
import { useSesi } from "@/components/SesiProvider";
import OfficeMap from "@/components/map/OfficeMapDynamic";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { durasiKerja } from "@/lib/late";
import {
  hapusKaryawanServer,
  resetTransaksiServer,
  simpanSettingsServer,
  tambahKaryawanServer,
  ubahProfilServer,
} from "@/lib/supabase/actions";
import type { Profile, Settings } from "@/types";

type TipeToast = "sukses" | "error" | "info";

const PASSWORD_DEFAULT = "password123";

export function SettingsClient({
  settingsAwal,
  daftarAwal,
}: {
  settingsAwal: Settings;
  daftarAwal: Profile[];
}) {
  const { profile } = useSesi();
  const [state, setState] = useState<Settings>({ ...settingsAwal });
  const [daftar, setDaftar] = useState<Profile[]>(daftarAwal);
  const [toast, setToast] = useState<{ pesan: string; tipe: TipeToast } | null>(null);
  const [pending, startTransition] = useTransition();
  const [formBaru, setFormBaru] = useState({
    nama: "",
    email: "",
    jabatan: "Staff",
    password: PASSWORD_DEFAULT,
  });

  if (!profile || profile.role !== "admin") {
    return <p className="text-sm text-ink-soft">Halaman ini hanya untuk admin.</p>;
  }

  function jalankan(fn: () => Promise<void>, pesanSukses: string) {
    startTransition(async () => {
      try {
        await fn();
        setToast({ pesan: pesanSukses, tipe: "sukses" });
      } catch (e) {
        setToast({ pesan: e instanceof Error ? e.message : "Gagal.", tipe: "error" });
      }
    });
  }

  function simpanSettings() {
    const patch = { ...state };
    jalankan(() => simpanSettingsServer(patch), "Pengaturan disimpan.");
  }

  function tambah() {
    if (!formBaru.nama.trim() || !formBaru.email.trim()) {
      setToast({ pesan: "Nama dan email wajib.", tipe: "error" });
      return;
    }
    startTransition(async () => {
      try {
        await tambahKaryawanServer(formBaru);
        setToast({ pesan: "Karyawan ditambahkan. Login pakai password yang diisi.", tipe: "sukses" });
        setFormBaru({ nama: "", email: "", jabatan: "Staff", password: PASSWORD_DEFAULT });
        window.location.reload();
      } catch (e) {
        setToast({ pesan: e instanceof Error ? e.message : "Gagal.", tipe: "error" });
      }
    });
  }

  function ubahKaryawan(id: string, patch: Partial<Profile>) {
    setDaftar((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    jalankan(() => ubahProfilServer(id, patch as Record<string, unknown>), "Perubahan disimpan.");
  }

  function hapus(k: Profile) {
    const yakin = window.confirm(
      `Hapus karyawan "${k.nama}" beserta seluruh riwayat absen & lemburnya?`,
    );
    if (!yakin) return;
    startTransition(async () => {
      try {
        await hapusKaryawanServer(k.id);
        setDaftar((prev) => prev.filter((p) => p.id !== k.id));
        setToast({ pesan: `${k.nama} dihapus.`, tipe: "sukses" });
      } catch (e) {
        setToast({ pesan: e instanceof Error ? e.message : "Gagal.", tipe: "error" });
      }
    });
  }

  function reset(target: "attendance" | "overtime" | "all") {
    const kata = window.prompt(`Ketik ULANG untuk konfirmasi reset "${target}"`);
    if (kata !== "ULANG") {
      setToast({ pesan: "Konfirmasi salah.", tipe: "error" });
      return;
    }
    jalankan(() => resetTransaksiServer(target), "Reset selesai. Master aman.");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-base font-extrabold text-ink">
        Pengaturan {pending && <span className="text-xs text-ink-soft">(menyimpan…)</span>}
      </h1>

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
          <Field label="Toleransi telat (menit)">
            <Input
              type="number"
              min={0}
              value={state.toleransi_telat_menit}
              onChange={(e) =>
                setState({ ...state, toleransi_telat_menit: Number(e.target.value) })
              }
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
        <Button className="mt-4" onClick={simpanSettings} disabled={pending}>
          Simpan pengaturan
        </Button>
      </Card>

      <Card>
        <CardTitle>Karyawan</CardTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          <Field label="Password">
            <Input
              value={formBaru.password}
              onChange={(e) => setFormBaru({ ...formBaru, password: e.target.value })}
            />
          </Field>
        </div>
        <Button className="mt-3" onClick={tambah} disabled={pending}>
          Tambah karyawan
        </Button>

        <div className="mt-4 -mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-ink-soft">
                {["Nama", "Email", "Jam masuk", "Jam pulang", "Jam kerja", "Upah lembur/jam", "Denda/jam", "Aksi"].map(
                  (h) => (
                    <th key={h} className="py-2 pr-3 font-semibold">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {daftar.map((k) => (
                <tr key={k.id}>
                  <td className="py-2 pr-3">
                    <p className="font-semibold text-ink">{k.nama}</p>
                    <p className="text-xs text-ink-soft">{k.jabatan}</p>
                  </td>
                  <td className="py-2 pr-3">
                    <Input
                      type="email"
                      defaultValue={k.email}
                      onBlur={(e) => ubahKaryawan(k.id, { email: e.target.value })}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <Input
                      type="time"
                      value={k.jam_masuk_standar}
                      onChange={(e) => ubahKaryawan(k.id, { jam_masuk_standar: e.target.value })}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <Input
                      type="time"
                      value={k.jam_pulang_standar}
                      onChange={(e) => ubahKaryawan(k.id, { jam_pulang_standar: e.target.value })}
                    />
                  </td>
                  <td className="py-2 pr-3 text-xs text-ink-soft">
                    {durasiKerja(k.jam_masuk_standar, k.jam_pulang_standar)} jam
                  </td>
                  <td className="py-2 pr-3">
                    <Input
                      type="number"
                      defaultValue={k.tarif_lembur_per_jam}
                      onBlur={(e) =>
                        ubahKaryawan(k.id, { tarif_lembur_per_jam: Number(e.target.value) })
                      }
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <Input
                      type="number"
                      defaultValue={k.tarif_denda_per_jam}
                      onBlur={(e) =>
                        ubahKaryawan(k.id, { tarif_denda_per_jam: Number(e.target.value) })
                      }
                    />
                  </td>
                  <td className="py-2">
                    <Button varian="danger" onClick={() => hapus(k)} disabled={pending}>
                      Hapus
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          Catatan: password login karyawan diatur saat pembuatan akun (di atas) dan dikelola lewat
          Supabase Auth. Untuk mengubah password, buat ulang atau gunakan menu reset password.
        </p>
      </Card>

      <Card>
        <CardTitle>Reset transaksi</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button varian="outline" onClick={() => reset("attendance")} disabled={pending}>
            Reset absensi
          </Button>
          <Button varian="outline" onClick={() => reset("overtime")} disabled={pending}>
            Reset lembur
          </Button>
          <Button varian="danger" onClick={() => reset("all")} disabled={pending}>
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
