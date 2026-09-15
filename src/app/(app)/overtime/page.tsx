"use client";

import { useMemo, useState } from "react";
import { useSesi } from "@/components/SesiProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import {
  ajukanLembur,
  editLembur,
  getOvertime,
  getProfiles,
  hapusLembur,
  keputusanAdmin,
} from "@/lib/mockStore";
import { hitungTotalJam } from "@/lib/overtime";
import { getTanggalWITA } from "@/lib/time";
import { useMockVersi } from "@/lib/useMockStore";
import type { OvertimeRequest, OvertimeStatus } from "@/types";

type TipeToast = "sukses" | "error" | "info";
const FORM_KOSONG = { id: "", tanggal: "", jam_mulai: "", jam_selesai: "", alasan: "" };

function toneStatus(status: OvertimeStatus) {
  if (status === "Approved") return "sukses" as const;
  if (status === "Rejected") return "bahaya" as const;
  return "peringatan" as const;
}

export default function OvertimePage() {
  const { profile } = useSesi();
  const versi = useMockVersi();
  const [form, setForm] = useState(FORM_KOSONG);
  const [toast, setToast] = useState<{ pesan: string; tipe: TipeToast } | null>(null);

  const namaMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of getProfiles()) m.set(p.id, p.nama);
    return m;
  }, []);

  const daftar = useMemo(() => {
    const semua = getOvertime();
    const milik =
      profile?.role === "admin" ? semua : semua.filter((o) => o.profile_id === profile?.id);
    return [...milik].sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));
    // versi sengaja jadi pemicu: mockStore bukan sumber reaktif.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, versi]);

  if (!profile) return null;
  const admin = profile.role === "admin";
  const totalJamForm =
    form.jam_mulai && form.jam_selesai
      ? hitungTotalJam(form.jam_mulai, form.jam_selesai)
      : 0;

  function kirim() {
    if (!profile) return;
    const payload = {
      tanggal: form.tanggal,
      jam_mulai: form.jam_mulai,
      jam_selesai: form.jam_selesai,
      alasan: form.alasan,
    };
    const hasil = form.id
      ? editLembur(form.id, profile.id, payload)
      : ajukanLembur(profile.id, payload);
    setToast({ pesan: hasil.pesan, tipe: hasil.sukses ? "sukses" : "error" });
    if (hasil.sukses) {
      setForm(FORM_KOSONG);
    }
  }

  function mulaiEdit(o: OvertimeRequest) {
    setForm({
      id: o.id,
      tanggal: o.tanggal,
      jam_mulai: o.jam_mulai.slice(0, 5),
      jam_selesai: o.jam_selesai.slice(0, 5),
      alasan: o.alasan,
    });
  }

  function hapus(o: OvertimeRequest) {
    if (!profile) return;
    const hasil = hapusLembur(o.id, profile.id);
    setToast({ pesan: hasil.pesan, tipe: hasil.sukses ? "sukses" : "error" });
  }

  function putuskan(o: OvertimeRequest, aksi: "Approve" | "Reject") {
    if (!profile) return;
    let catatan = "";
    if (aksi === "Reject") {
      catatan = window.prompt("Catatan penolakan") ?? "";
    }
    const hasil = keputusanAdmin(o.id, aksi, catatan, profile.id);
    setToast({ pesan: hasil.pesan, tipe: hasil.sukses ? "sukses" : "error" });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-base font-extrabold text-ink">Lembur</h1>

      {!admin && (
        <Card>
          <CardTitle>{form.id ? "Ubah pengajuan" : "Ajukan lembur"}</CardTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Tanggal">
              <Input
                type="date"
                value={form.tanggal}
                max={getTanggalWITA()}
                onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
              />
            </Field>
            <Field label="Jam mulai">
              <Input
                type="time"
                value={form.jam_mulai}
                onChange={(e) => setForm({ ...form, jam_mulai: e.target.value })}
              />
            </Field>
            <Field label="Jam selesai">
              <Input
                type="time"
                value={form.jam_selesai}
                onChange={(e) => setForm({ ...form, jam_selesai: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Alasan">
              <Textarea
                rows={3}
                value={form.alasan}
                placeholder="Minimal 10 karakter"
                onChange={(e) => setForm({ ...form, alasan: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Button onClick={kirim}>{form.id ? "Simpan" : "Kirim"}</Button>
            {form.id && (
              <Button varian="ghost" onClick={() => setForm(FORM_KOSONG)}>
                Batal
              </Button>
            )}
            {totalJamForm > 0 && (
              <span className="text-xs text-ink-soft">Total {totalJamForm} jam</span>
            )}
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>{admin ? "Semua pengajuan" : "Pengajuan saya"}</CardTitle>
        {daftar.length === 0 ? (
          <p className="text-sm text-ink-soft">Belum ada pengajuan.</p>
        ) : (
          <div className="divide-y divide-border">
            {daftar.map((o) => (
              <div key={o.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">
                      {o.tanggal} · {o.jam_mulai.slice(0, 5)}-{o.jam_selesai.slice(0, 5)} ·{" "}
                      {o.total_jam} jam
                    </p>
                    <p className="text-xs text-ink-soft">
                      {admin && `${namaMap.get(o.profile_id) ?? "-"} · `}
                      {o.alasan}
                    </p>
                    {o.status === "Approved" && (
                      <p className="mt-1 text-xs font-semibold text-success">
                        Nominal Rp {o.nominal.toLocaleString("id-ID")}
                      </p>
                    )}
                    {o.catatan_admin && (
                      <p className="mt-1 text-xs text-ink-soft">Catatan: {o.catatan_admin}</p>
                    )}
                  </div>
                  <Badge tone={toneStatus(o.status)}>{o.status}</Badge>
                </div>

                {!admin && o.status === "Pending" && (
                  <div className="mt-2 flex gap-2">
                    <Button varian="outline" onClick={() => mulaiEdit(o)}>
                      Ubah
                    </Button>
                    <Button varian="ghost" onClick={() => hapus(o)}>
                      Hapus
                    </Button>
                  </div>
                )}

                {admin && o.status === "Pending" && (
                  <div className="mt-2 flex gap-2">
                    <Button onClick={() => putuskan(o, "Approve")}>Setujui</Button>
                    <Button varian="danger" onClick={() => putuskan(o, "Reject")}>
                      Tolak
                    </Button>
                  </div>
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
