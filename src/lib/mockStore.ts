"use client";

import type {
  Attendance,
  OvertimeRequest,
  Profile,
  RadiusStatus,
  Settings,
} from "@/types";
import {
  MOCK_PROFILES,
  MOCK_SETTINGS,
  buatSeedTransaksi,
} from "./mockData";
import { jarakKeKantor } from "./geo";
import { hitungMenitTerlambat, hitungJamTerlambat } from "./late";
import { hitungDendaHarian, menitEfektifTelat } from "./denda";
import { hitungNominal, hitungTotalJam, validasiPengajuanLembur } from "./overtime";
import { getJamLengkapWITA, getTanggalWITA } from "./time";

const KUNCI_STATE = "almanna_mock_state";

interface MockState {
  profiles: Profile[];
  settings: Settings;
  attendance: Attendance[];
  overtime: OvertimeRequest[];
  seq: number;
}

function stateAwal(): MockState {
  const seed = buatSeedTransaksi();
  return {
    profiles: structuredClone(MOCK_PROFILES),
    settings: structuredClone(MOCK_SETTINGS),
    attendance: seed.attendance,
    overtime: seed.overtime,
    seq: 100,
  };
}

let cache: MockState | null = null;
const listeners = new Set<() => void>();

/** Versi snapshot untuk useSyncExternalStore (berubah tiap simpan). */
let snapshotVersi = 0;

export function subscribeMock(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVersiMock(): number {
  return snapshotVersi;
}

function emit() {
  snapshotVersi += 1;
  for (const l of listeners) l();
}

function baca(): MockState {
  if (cache) return cache;
  if (typeof window === "undefined") {
    cache = stateAwal();
    return cache;
  }
  const raw = window.localStorage.getItem(KUNCI_STATE);
  if (!raw) {
    cache = stateAwal();
    simpan(cache);
    return cache;
  }
  try {
    cache = JSON.parse(raw) as MockState;
  } catch {
    cache = stateAwal();
    simpan(cache);
  }
  return cache;
}

function simpan(state: MockState) {
  cache = state;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KUNCI_STATE, JSON.stringify(state));
  }
  emit();
}

export function resetStateMock() {
  cache = stateAwal();
  simpan(cache);
}

// ---------- Auth mock ----------

export function loginMock(profileId: string): Profile | null {
  const p = baca().profiles.find((x) => x.id === profileId);
  return p ?? null;
}

// ---------- Settings ----------

export function getSettings(): Settings {
  return baca().settings;
}

export function updateSettings(patch: Partial<Settings>) {
  const s = baca();
  s.settings = { ...s.settings, ...patch, id: 1 };
  simpan(s);
}

// ---------- Profiles ----------

export function getProfiles(): Profile[] {
  return baca().profiles;
}

export function getKaryawanAktif(): Profile[] {
  return baca().profiles.filter((p) => p.role === "karyawan" && p.is_active);
}

export function updateProfile(id: string, patch: Partial<Profile>) {
  const s = baca();
  s.profiles = s.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p));
  simpan(s);
}

export function tambahKaryawan(input: {
  nama: string;
  email: string;
  jabatan: string;
  password: string;
}): { sukses: boolean; pesan: string; profile?: Profile } {
  const s = baca();
  const emailBersih = input.email.trim().toLowerCase();

  if (s.profiles.some((p) => p.email.toLowerCase() === emailBersih)) {
    return { sukses: false, pesan: "Email sudah terdaftar." };
  }
  if (input.password.length < 6) {
    return { sukses: false, pesan: "Password minimal 6 karakter." };
  }

  s.seq += 1;
  const baru: Profile = {
    id: `mock-kar-baru-${s.seq}`,
    email: emailBersih,
    nama: input.nama.trim(),
    jabatan: input.jabatan || "Staff",
    role: "karyawan",
    jam_masuk_standar: s.settings.jam_masuk_default,
    jam_pulang_standar: s.settings.jam_pulang_default,
    tarif_lembur_per_jam: s.settings.tarif_default,
    tarif_denda_per_jam: 0,
    is_active: true,
    password: input.password,
  };
  s.profiles = [...s.profiles, baru];
  simpan(s);
  return { sukses: true, pesan: "Karyawan ditambahkan.", profile: baru };
}

/** Hapus karyawan permanen beserta transaksinya (absensi + lembur). */
export function hapusKaryawan(id: string): { sukses: boolean; pesan: string } {
  const s = baca();
  const target = s.profiles.find((p) => p.id === id);
  if (!target) return { sukses: false, pesan: "Karyawan tidak ditemukan." };
  if (target.role === "admin") {
    return { sukses: false, pesan: "Akun admin tidak bisa dihapus." };
  }
  s.profiles = s.profiles.filter((p) => p.id !== id);
  s.attendance = s.attendance.filter((a) => a.profile_id !== id);
  s.overtime = s.overtime.filter((o) => o.profile_id !== id);
  simpan(s);
  return { sukses: true, pesan: `${target.nama} dihapus.` };
}

// ---------- Attendance ----------

export function getAttendance(): Attendance[] {
  return baca().attendance;
}

export function getAttendanceHariIni(profileId?: string): Attendance[] {
  const hari = getTanggalWITA();
  return baca().attendance.filter(
    (a) => a.tanggal === hari && (!profileId || a.profile_id === profileId),
  );
}

export function cariAttendance(profileId: string, tanggal: string) {
  return baca().attendance.find(
    (a) => a.profile_id === profileId && a.tanggal === tanggal,
  );
}

export interface HasilAbsen {
  sukses: boolean;
  aksi?: "check-in" | "check-out";
  pesan: string;
  menitTerlambat?: number;
  jarak?: number;
  statusRadius?: RadiusStatus;
}

export function prosesAbsen(
  profile: Profile,
  tipe: "check-in" | "check-out",
  geo: { lat: number; lng: number; akurasi: number },
): HasilAbsen {
  const s = baca();
  const tanggal = getTanggalWITA();
  const jarak = Math.round(
    jarakKeKantor(geo.lat, geo.lng, s.settings.latitude, s.settings.longitude),
  );

  const didalam = jarak <= s.settings.radius_meter;
  if (!didalam && s.settings.tolak_diluar_radius) {
    return {
      sukses: false,
      pesan: `Di luar radius kantor. Jarak ${jarak} m, batas ${s.settings.radius_meter} m.`,
      jarak,
      statusRadius: "DiLuarRadius",
    };
  }
  const statusRadius: RadiusStatus = didalam ? "Valid" : "DiLuarRadius";

  const existing = s.attendance.find(
    (a) => a.profile_id === profile.id && a.tanggal === tanggal,
  );

  if (tipe === "check-in") {
    if (existing) {
      return { sukses: false, pesan: "Sudah check-in hari ini.", jarak };
    }
    const jamMasuk = getJamLengkapWITA();
    const menit = hitungMenitTerlambat(jamMasuk, profile.jam_masuk_standar);
    const baris: Attendance = {
      id: `att-${profile.id}-${tanggal}`,
      profile_id: profile.id,
      tanggal,
      jam_masuk: jamMasuk,
      lat_masuk: geo.lat,
      lng_masuk: geo.lng,
      akurasi_masuk_meter: Math.round(geo.akurasi),
      status_radius_masuk: statusRadius,
      jam_pulang: null,
      lat_pulang: null,
      lng_pulang: null,
      akurasi_pulang_meter: null,
      status_radius_pulang: null,
      menit_terlambat: menit,
    };
    s.attendance = [...s.attendance, baris];
    simpan(s);
    return {
      sukses: true,
      aksi: "check-in",
      pesan:
        menit > 0 ? `Check-in tercatat. Telat ${menit} menit.` : "Check-in tepat waktu.",
      menitTerlambat: menit,
      jarak,
      statusRadius,
    };
  }

  // check-out
  if (!existing) {
    return { sukses: false, pesan: "Belum check-in hari ini.", jarak };
  }
  if (existing.jam_pulang) {
    return { sukses: false, pesan: "Sudah check-out hari ini.", jarak };
  }
  s.attendance = s.attendance.map((a) =>
    a.id === existing.id
      ? {
          ...a,
          jam_pulang: getJamLengkapWITA(),
          lat_pulang: geo.lat,
          lng_pulang: geo.lng,
          akurasi_pulang_meter: Math.round(geo.akurasi),
          status_radius_pulang: statusRadius,
        }
      : a,
  );
  simpan(s);
  return { sukses: true, aksi: "check-out", pesan: "Check-out tercatat.", jarak, statusRadius };
}

// ---------- Overtime ----------

export function getOvertime(): OvertimeRequest[] {
  return baca().overtime;
}

export function ajukanLembur(
  profileId: string,
  input: { tanggal: string; jam_mulai: string; jam_selesai: string; alasan: string },
): { sukses: boolean; pesan: string } {
  const validasi = validasiPengajuanLembur({ ...input, hariIni: getTanggalWITA() });
  if (!validasi.valid) return { sukses: false, pesan: validasi.pesan ?? "Tidak valid." };

  const s = baca();
  s.seq += 1;
  const baru: OvertimeRequest = {
    id: `ot-baru-${s.seq}`,
    profile_id: profileId,
    tanggal: input.tanggal,
    jam_mulai: input.jam_mulai,
    jam_selesai: input.jam_selesai,
    total_jam: hitungTotalJam(input.jam_mulai, input.jam_selesai),
    alasan: input.alasan.trim(),
    status: "Pending",
    approved_by: null,
    tanggal_persetujuan: null,
    catatan_admin: null,
    nominal: 0,
  };
  s.overtime = [...s.overtime, baru];
  simpan(s);
  return { sukses: true, pesan: "Pengajuan lembur dikirim." };
}

export function editLembur(
  id: string,
  profileId: string,
  input: { tanggal: string; jam_mulai: string; jam_selesai: string; alasan: string },
): { sukses: boolean; pesan: string } {
  const s = baca();
  const item = s.overtime.find((o) => o.id === id);
  if (!item) return { sukses: false, pesan: "Pengajuan tidak ditemukan." };
  if (item.profile_id !== profileId) return { sukses: false, pesan: "Bukan milik Anda." };
  if (item.status !== "Pending") return { sukses: false, pesan: "Hanya Pending bisa diubah." };

  const validasi = validasiPengajuanLembur({ ...input, hariIni: getTanggalWITA() });
  if (!validasi.valid) return { sukses: false, pesan: validasi.pesan ?? "Tidak valid." };

  s.overtime = s.overtime.map((o) =>
    o.id === id
      ? {
          ...o,
          tanggal: input.tanggal,
          jam_mulai: input.jam_mulai,
          jam_selesai: input.jam_selesai,
          total_jam: hitungTotalJam(input.jam_mulai, input.jam_selesai),
          alasan: input.alasan.trim(),
        }
      : o,
  );
  simpan(s);
  return { sukses: true, pesan: "Pengajuan diperbarui." };
}

export function hapusLembur(id: string, profileId: string): { sukses: boolean; pesan: string } {
  const s = baca();
  const item = s.overtime.find((o) => o.id === id);
  if (!item) return { sukses: false, pesan: "Pengajuan tidak ditemukan." };
  if (item.profile_id !== profileId) return { sukses: false, pesan: "Bukan milik Anda." };
  if (item.status !== "Pending") return { sukses: false, pesan: "Hanya Pending bisa dihapus." };
  s.overtime = s.overtime.filter((o) => o.id !== id);
  simpan(s);
  return { sukses: true, pesan: "Pengajuan dihapus." };
}

export function keputusanAdmin(
  id: string,
  aksi: "Approve" | "Reject",
  catatan: string,
  adminId: string,
): { sukses: boolean; pesan: string } {
  const s = baca();
  const item = s.overtime.find((o) => o.id === id);
  if (!item) return { sukses: false, pesan: "Pengajuan tidak ditemukan." };
  if (item.status !== "Pending") {
    return { sukses: false, pesan: `Status ${item.status} final, tidak bisa diubah.` };
  }
  if (aksi === "Reject" && catatan.trim().length === 0) {
    return { sukses: false, pesan: "Catatan wajib diisi untuk reject." };
  }
  const pengaju = s.profiles.find((p) => p.id === item.profile_id);
  if (!pengaju) return { sukses: false, pesan: "Karyawan tidak ditemukan." };

  s.overtime = s.overtime.map((o) =>
    o.id === id
      ? {
          ...o,
          status: aksi === "Approve" ? "Approved" : "Rejected",
          approved_by: adminId,
          tanggal_persetujuan: getTanggalWITA(),
          catatan_admin: catatan.trim() || null,
          nominal:
            aksi === "Approve"
              ? hitungNominal(o.total_jam, pengaju.tarif_lembur_per_jam)
              : 0,
        }
      : o,
  );
  simpan(s);
  return { sukses: true, pesan: aksi === "Approve" ? "Lembur disetujui." : "Lembur ditolak." };
}

// ---------- Agregasi ----------

/** Karyawan aktif dari store (bukan konstanta mock). */
function karyawanAktif(s: MockState): Profile[] {
  return s.profiles.filter((p) => p.role === "karyawan" && p.is_active);
}

export function rekapKeterlambatan(mulai: string, akhir: string) {
  const s = baca();
  const toleransi = s.settings.toleransi_telat_menit;
  const dalamPeriode = (t: string) => t >= mulai && t <= akhir;
  return karyawanAktif(s).map((p) => {
    const rows = s.attendance.filter(
      (a) => a.profile_id === p.id && dalamPeriode(a.tanggal),
    );
    const total_menit_telat = rows.reduce((n, r) => n + r.menit_terlambat, 0);
    const total_menit_efektif = rows.reduce(
      (n, r) => n + menitEfektifTelat(r.menit_terlambat, toleransi),
      0,
    );
    const total_denda = Math.round(
      rows.reduce(
        (n, r) =>
          n + hitungDendaHarian(r.menit_terlambat, toleransi, p.tarif_denda_per_jam),
        0,
      ),
    );
    return {
      profile_id: p.id,
      nama: p.nama,
      jabatan: p.jabatan,
      total_hari_hadir: rows.length,
      total_hari_telat: rows.filter((r) => r.menit_terlambat > 0).length,
      total_menit_telat,
      total_jam_telat: hitungJamTerlambat(total_menit_telat),
      tarif_lembur_per_jam: p.tarif_lembur_per_jam,
      tarif_denda_per_jam: p.tarif_denda_per_jam,
      total_menit_efektif,
      total_denda,
    };
  });
}

export function rekapLembur(mulai: string, akhir: string) {
  const s = baca();
  const dalamPeriode = (t: string) => t >= mulai && t <= akhir;
  return karyawanAktif(s).map((p) => {
    const rows = s.overtime.filter(
      (o) =>
        o.profile_id === p.id &&
        o.status === "Approved" &&
        dalamPeriode(o.tanggal),
    );
    return {
      profile_id: p.id,
      nama: p.nama,
      jabatan: p.jabatan,
      total_pengajuan_approved: rows.length,
      total_jam: Math.round(rows.reduce((n, r) => n + r.total_jam, 0) * 100) / 100,
      tarif_per_jam: p.tarif_lembur_per_jam,
      total_nominal: rows.reduce((n, r) => n + r.nominal, 0),
    };
  });
}

export function statistikHariIni() {
  const s = baca();
  const hari = getTanggalWITA();
  const hadir = s.attendance.filter((a) => a.tanggal === hari);
  const totalAktif = karyawanAktif(s).length;
  return {
    totalAktif,
    hadir: hadir.length,
    telat: hadir.filter((a) => a.menit_terlambat > 0).length,
    belumAbsen: totalAktif - hadir.length,
    pendingLembur: s.overtime.filter((o) => o.status === "Pending").length,
  };
}

export function resetTransaksi(target: "attendance" | "overtime" | "all") {
  const s = baca();
  if (target === "attendance" || target === "all") s.attendance = [];
  if (target === "overtime" || target === "all") s.overtime = [];
  simpan(s);
}
