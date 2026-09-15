import "server-only";
import { buatKlienServer } from "./server";
import { hitungJamTerlambat } from "../late";
import { hitungDendaHarian, menitEfektifTelat } from "../denda";
import type {
  Attendance,
  OvertimeRequest,
  Profile,
  Settings,
} from "@/types";

export async function ambilSettings(): Promise<Settings | null> {
  const supabase = await buatKlienServer();
  const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
  return (data as Settings) ?? null;
}

export async function ambilProfiles(): Promise<Profile[]> {
  const supabase = await buatKlienServer();
  const { data } = await supabase.from("profiles").select("*").order("nama");
  return (data as Profile[]) ?? [];
}

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

export async function ambilRekapKeterlambatan(mulai: string, akhir: string) {
  const [profiles, attendanceRows, settings] = await Promise.all([
    ambilProfiles(),
    (async () => {
      const supabase = await buatKlienServer();
      const { data } = await supabase
        .from("attendance")
        .select("*")
        .gte("tanggal", mulai)
        .lte("tanggal", akhir);
      return (data as Attendance[]) ?? [];
    })(),
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

export async function ambilRekapLembur(mulai: string, akhir: string) {
  const [profiles, overtimeRows] = await Promise.all([
    ambilProfiles(),
    (async () => {
      const supabase = await buatKlienServer();
      const { data } = await supabase
        .from("overtime_requests")
        .select("*")
        .eq("status", "Approved")
        .gte("tanggal", mulai)
        .lte("tanggal", akhir);
      return (data as OvertimeRequest[]) ?? [];
    })(),
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

export async function ambilStatistikHariIni(tanggal: string) {
  const [profiles, attendanceRows, overtimeRows] = await Promise.all([
    ambilProfiles(),
    (async () => {
      const supabase = await buatKlienServer();
      const { data } = await supabase
        .from("attendance")
        .select("*")
        .eq("tanggal", tanggal);
      return (data as Attendance[]) ?? [];
    })(),
    (async () => {
      const supabase = await buatKlienServer();
      const { data } = await supabase
        .from("overtime_requests")
        .select("id")
        .eq("status", "Pending");
      return data ?? [];
    })(),
  ]);

  const totalAktif = profiles.filter(
    (p) => p.role === "karyawan" && p.is_active,
  ).length;

  return {
    totalAktif,
    hadir: attendanceRows.length,
    telat: attendanceRows.filter((a) => a.menit_terlambat > 0).length,
    belumAbsen: totalAktif - attendanceRows.length,
    pendingLembur: overtimeRows.length,
  };
}
