export type Role = "karyawan" | "admin";

export type RadiusStatus = "Valid" | "DiLuarRadius";

export type OvertimeStatus = "Pending" | "Approved" | "Rejected";

export interface Profile {
  id: string;
  email: string;
  nama: string;
  jabatan: string;
  role: Role;
  jam_masuk_standar: string;
  jam_pulang_standar: string;
  tarif_lembur_per_jam: number;
  tarif_denda_per_jam: number;
  is_active: boolean;
  /** Hanya untuk mode mock (plaintext). Di produksi dipakai Supabase Auth. */
  password: string;
}

export interface Settings {
  id: 1;
  nama_lokasi: string;
  latitude: number;
  longitude: number;
  radius_meter: number;
  tarif_default: number;
  toleransi_telat_menit: number;
  jam_masuk_default: string;
  jam_pulang_default: string;
  tolak_diluar_radius: boolean;
}

export interface Attendance {
  id: string;
  profile_id: string;
  tanggal: string;
  jam_masuk: string | null;
  lat_masuk: number | null;
  lng_masuk: number | null;
  akurasi_masuk_meter: number | null;
  status_radius_masuk: RadiusStatus | null;
  jam_pulang: string | null;
  lat_pulang: number | null;
  lng_pulang: number | null;
  akurasi_pulang_meter: number | null;
  status_radius_pulang: RadiusStatus | null;
  menit_terlambat: number;
}

export interface OvertimeRequest {
  id: string;
  profile_id: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  total_jam: number;
  alasan: string;
  status: OvertimeStatus;
  approved_by: string | null;
  tanggal_persetujuan: string | null;
  catatan_admin: string | null;
  nominal: number;
}

export interface ActivityLog {
  id: string;
  actor_id: string;
  jenis_aksi: string;
  detail: string;
  created_at: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
  akurasi: number;
}

export interface LateReportRow {
  profile_id: string;
  nama: string;
  jabatan: string;
  total_hari_hadir: number;
  total_hari_telat: number;
  total_menit_telat: number;
  total_jam_telat: number;
  tarif_lembur_per_jam: number;
  tarif_denda_per_jam: number;
  total_menit_efektif: number;
  total_denda: number;
}

export interface OvertimeReportRow {
  profile_id: string;
  nama: string;
  jabatan: string;
  total_pengajuan_approved: number;
  total_jam: number;
  tarif_per_jam: number;
  total_nominal: number;
}
