import "server-only";
import { cache } from "react";
import { buatKlienServer } from "./server";
import { hitungJamTerlambat, normalisasiJam } from "../late";
import { hitungDendaHarian, menitEfektifTelat } from "../denda";
import type {
  Attendance,
  OvertimeRequest,
  Profile,
  Settings,
} from "@/types";

/** Ubah kolom `time` Supabase ("HH:MM:SS") menjadi "HH:MM". */
function rapikanJamProfile(p: Profile): Profile {
  return {
    ...p,
    jam_masuk_standar: normalisasiJam(p.jam_masuk_standar) ?? p.jam_masuk_standar,
    jam_pulang_standar: normalisasiJam(p.jam_pulang_standar) ?? p.jam_pulang_standar,
  };
}

function rapikanJamSettings(s: Settings): Settings {
  return {
    ...s,
    jam_masuk_default: normalisasiJam(s.jam_masuk_default) ?? s.jam_masuk_default,
    jam_pulang_default: normalisasiJam(s.jam_pulang_default) ?? s.jam_pulang_default,
  };
}

/** Settings id=1. Di-cache per-request. */
export const ambilSettings = cache(async (): Promise<Settings | null> => {
  const supabase = await buatKlienServer();
  const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
  return data ? rapikanJamSettings(data as Settings) : null;
});

/** Semua profil. Di-cache per-request. */
export const ambilProfiles = cache(async (): Promise<Profile[]> => {
  const supabase = await buatKlienServer();
  const { data } = await supabase.from("profiles").select("*").order("nama");
  return ((data as Profile[]) ?? []).map(rapikanJamProfile);
});

/** Attendance dalam rentang tanggal. Di-cache per-request per rentang. */
export const ambilAttendanceRentang = cache(
  async (mulai: string, akhir: string): Promise<Attendance[]> => {
    const supabase = await buatKlienServer();
    const { data } = await supabase
      .from("attendance")
      .select("*")
      .gte("tanggal", mulai)
      .lte("tanggal", akhir);
    return (data as Attendance[]) ?? [];
  },
);

/** Overtime Approved dalam rentang tanggal. Di-cache per-request per rentang. */
export const ambilOvertimeApprovedRentang = cache(
  async (mulai: string, akhir: string): Promise<OvertimeRequest[]> => {
    const supabase = await buatKlienServer();
    const { data } = await supabase
      .from("overtime_requests")
      .select("*")
      .eq("status", "Approved")
      .gte("tanggal", mulai)
      .lte("tanggal", akhir);
    return (data as OvertimeRequest[]) ?? [];
  },
);

/** Attendance satu tanggal (untuk statistik harian admin). */
export const ambilAttendanceTanggal = cache(
  async (tanggal: string): Promise<Attendance[]> => {
    const supabase = await buatKlienServer();
    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("tanggal", tanggal);
    return (data as Attendance[]) ?? [];
  },
);

/** Jumlah lembur Pending. */
export const ambilJumlahLemburPending = cache(async (): Promise<number> => {
  const supabase = await buatKlienServer();
  const { count } = await supabase
    .from("overtime_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "Pending");
  return count ?? 0;
});

/** Attendance milik satu profil (untuk halaman absen). */
export async function ambilAttendance(profileId?: string): Promise<Attendance[]> {
  const supabase = await buatKlienServer();
  let q = supabase
    .from("attendance")
    .select("*")
    .order("tanggal", { ascending: false })
    .limit(200);
  if (profileId) q = q.eq("profile_id", profileId);
  const { data } = await q;
  return (data as Attendance[]) ?? [];
}

export async function ambilOvertime(): Promise<OvertimeRequest[]> {
  const supabase = await buatKlienServer();
  const { data } = await supabase
    .from("overtime_requests")
    .select("*")
    .order("tanggal", { ascending: false });
  return (data as OvertimeRequest[]) ?? [];
}

export async function ambilAttendanceByTanggal(
  profileId: string,
  tanggal: string,
): Promise<Attendance | null> {
  const supabase = await buatKlienServer();
  const { data } = await supabase
    .from("attendance")
    .select("*")
    .eq("profile_id", profileId)
    .eq("tanggal", tanggal)
    .maybeSingle();
  return (data as Attendance) ?? null;
}

/** Agregasi rekap keterlambatan + denda untuk periode. */
export async function ambilRekapKeterlambatan(
  mulai: string,
  akhir: string,
  profilesDimuat?: Profile[],
) {
  const [profiles, attendanceRows, settings] = await Promise.all([
    profilesDimuat ?? ambilProfiles(),
    ambilAttendanceRentang(mulai, akhir),
    ambilSettings(),
  ]);

  const toleransi = settings?.toleransi_telat_menit ?? 15;

  return profiles
    .filter((p) => p.role === "karyawan" && p.is_active)
    .map((p) => {
      const rows = attendanceRows.filter((a) => a.profile_id === p.id);
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

/** Agregasi rekap lembur Approved untuk periode. */
export async function ambilRekapLembur(
  mulai: string,
  akhir: string,
  profilesDimuat?: Profile[],
) {
  const [profiles, overtimeRows] = await Promise.all([
    profilesDimuat ?? ambilProfiles(),
    ambilOvertimeApprovedRentang(mulai, akhir),
  ]);

  return profiles
    .filter((p) => p.role === "karyawan" && p.is_active)
    .map((p) => {
      const rows = overtimeRows.filter((o) => o.profile_id === p.id);
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

/** Rekap keterlambatan + lembur sekaligus (profiles dimuat sekali). */
export async function ambilRekapGabungan(mulai: string, akhir: string) {
  const profiles = await ambilProfiles();
  const [keterlambatan, lembur] = await Promise.all([
    ambilRekapKeterlambatan(mulai, akhir, profiles),
    ambilRekapLembur(mulai, akhir, profiles),
  ]);
  return { keterlambatan, lembur };
}

/**
 * Rekap periode untuk SATU karyawan (dipakai dashboard karyawan).
 * Menghindari membangun rekap seluruh karyawan hanya untuk satu orang.
 */
export async function ambilRekapSaya(
  profileId: string,
  mulai: string,
  akhir: string,
) {
  const [attendanceRows, overtimeRows, settings, profile] = await Promise.all([
    ambilAttendanceRentang(mulai, akhir),
    ambilOvertimeApprovedRentang(mulai, akhir),
    ambilSettings(),
    ambilProfiles(),
  ]);

  const toleransi = settings?.toleransi_telat_menit ?? 15;
  const saya = profile.find((p) => p.id === profileId) ?? null;
  const tarifDenda = saya?.tarif_denda_per_jam ?? 0;

  const barisAbsen = attendanceRows.filter((a) => a.profile_id === profileId);
  const barisLembur = overtimeRows.filter((o) => o.profile_id === profileId);

  const total_menit_telat = barisAbsen.reduce(
    (n, r) => n + r.menit_terlambat,
    0,
  );
  const total_menit_efektif = barisAbsen.reduce(
    (n, r) => n + menitEfektifTelat(r.menit_terlambat, toleransi),
    0,
  );
  const total_denda = Math.round(
    barisAbsen.reduce(
      (n, r) => n + hitungDendaHarian(r.menit_terlambat, toleransi, tarifDenda),
      0,
    ),
  );

  return {
    late: {
      total_hari_hadir: barisAbsen.length,
      total_hari_telat: barisAbsen.filter((r) => r.menit_terlambat > 0).length,
      total_menit_telat,
      total_menit_efektif,
      total_denda,
    },
    ot: {
      total_jam: Math.round(
        barisLembur.reduce((n, r) => n + r.total_jam, 0) * 100,
      ) / 100,
      total_nominal: barisLembur.reduce((n, r) => n + r.nominal, 0),
    },
  };
}

/** Statistik hari ini untuk admin. */
export async function ambilStatistikHariIni(tanggal: string) {
  const [profiles, attendanceRows, pendingLembur] = await Promise.all([
    ambilProfiles(),
    ambilAttendanceTanggal(tanggal),
    ambilJumlahLemburPending(),
  ]);

  const totalAktif = profiles.filter(
    (p) => p.role === "karyawan" && p.is_active,
  ).length;

  return {
    totalAktif,
    hadir: attendanceRows.length,
    telat: attendanceRows.filter((a) => a.menit_terlambat > 0).length,
    belumAbsen: totalAktif - attendanceRows.length,
    pendingLembur,
  };
}
