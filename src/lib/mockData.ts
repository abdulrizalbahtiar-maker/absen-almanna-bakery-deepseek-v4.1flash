import type {
  Attendance,
  OvertimeRequest,
  Profile,
  Settings,
} from "@/types";
import { getTanggalWITA } from "./time";

export const MOCK_PASSWORD = "password123";

export const MOCK_PROFILES: Profile[] = [
  {
    id: "mock-admin-1",
    email: "admin@almanna.test",
    nama: "Admin Bakery",
    jabatan: "Owner",
    role: "admin",
    jam_masuk_standar: "08:00",
    jam_pulang_standar: "17:00",
    tarif_lembur_per_jam: 0,
    tarif_denda_per_jam: 0,
    is_active: true,
  },
  {
    id: "mock-kar-01",
    email: "kar01@almanna.test",
    nama: "Karyawan 01",
    jabatan: "Kasir",
    role: "karyawan",
    jam_masuk_standar: "08:00",
    jam_pulang_standar: "17:00",
    tarif_lembur_per_jam: 20000,
    tarif_denda_per_jam: 15000,
    is_active: true,
  },
  {
    id: "mock-kar-02",
    email: "kar02@almanna.test",
    nama: "Karyawan 02",
    jabatan: "Baker",
    role: "karyawan",
    jam_masuk_standar: "07:00",
    jam_pulang_standar: "16:00",
    tarif_lembur_per_jam: 25000,
    tarif_denda_per_jam: 20000,
    is_active: true,
  },
  {
    id: "mock-kar-03",
    email: "kar03@almanna.test",
    nama: "Karyawan 03",
    jabatan: "Baker",
    role: "karyawan",
    jam_masuk_standar: "07:00",
    jam_pulang_standar: "16:00",
    tarif_lembur_per_jam: 25000,
    tarif_denda_per_jam: 20000,
    is_active: true,
  },
  {
    id: "mock-kar-04",
    email: "kar04@almanna.test",
    nama: "Karyawan 04",
    jabatan: "Packing",
    role: "karyawan",
    jam_masuk_standar: "08:00",
    jam_pulang_standar: "17:00",
    tarif_lembur_per_jam: 15000,
    tarif_denda_per_jam: 10000,
    is_active: true,
  },
  {
    id: "mock-kar-05",
    email: "kar05@almanna.test",
    nama: "Karyawan 05",
    jabatan: "Packing",
    role: "karyawan",
    jam_masuk_standar: "08:00",
    jam_pulang_standar: "17:00",
    tarif_lembur_per_jam: 15000,
    tarif_denda_per_jam: 10000,
    is_active: true,
  },
  {
    id: "mock-kar-06",
    email: "kar06@almanna.test",
    nama: "Karyawan 06",
    jabatan: "Kurir",
    role: "karyawan",
    jam_masuk_standar: "09:00",
    jam_pulang_standar: "18:00",
    tarif_lembur_per_jam: 18000,
    tarif_denda_per_jam: 12000,
    is_active: true,
  },
  {
    id: "mock-kar-07",
    email: "kar07@almanna.test",
    nama: "Karyawan 07",
    jabatan: "Cleaning",
    role: "karyawan",
    jam_masuk_standar: "08:00",
    jam_pulang_standar: "17:00",
    tarif_lembur_per_jam: 15000,
    tarif_denda_per_jam: 10000,
    is_active: true,
  },
  {
    id: "mock-kar-08",
    email: "kar08@almanna.test",
    nama: "Karyawan 08",
    jabatan: "Admin Toko",
    role: "karyawan",
    jam_masuk_standar: "08:30",
    jam_pulang_standar: "17:30",
    tarif_lembur_per_jam: 20000,
    tarif_denda_per_jam: 15000,
    is_active: true,
  },
];

export const MOCK_SETTINGS: Settings = {
  id: 1,
  nama_lokasi: "Al Manna Bakery - Kantor Pusat",
  latitude: -4.030128,
  longitude: 122.473738,
  radius_meter: 100,
  tarif_default: 20000,
  toleransi_telat_menit: 15,
  jam_masuk_default: "08:00",
  jam_pulang_default: "17:00",
  tolak_diluar_radius: true,
};

export const SIMULASI_GPS = {
  diKantor: { lat: -4.030128, lng: 122.473738, akurasi: 15 },
  diLuar: { lat: -4.035, lng: 122.48, akurasi: 15 },
  // akurasi besar tidak memblokir absen; hanya dicatat sebagai log.
  akurasiBuruk: { lat: -4.030128, lng: 122.473738, akurasi: 150 },
} as const;

function hariLalu(jumlahHari: number): string {
  const d = new Date(`${getTanggalWITA()}T12:00:00+08:00`);
  d.setUTCDate(d.getUTCDate() - jumlahHari);
  return getTanggalWITA(d);
}

/** Seed transaksi: absen beberapa hari + lembur beragam status. */
export function buatSeedTransaksi(): {
  attendance: Attendance[];
  overtime: OvertimeRequest[];
} {
  const attendance: Attendance[] = [];
  const overtime: OvertimeRequest[] = [];

  const pola: Array<{
    id: string;
    hariLalu: number;
    jamMasuk: string;
    telat: number;
    jamPulang: string;
  }> = [
    { id: "mock-kar-01", hariLalu: 1, jamMasuk: "08:12", telat: 12, jamPulang: "17:03" },
    { id: "mock-kar-01", hariLalu: 2, jamMasuk: "07:58", telat: 0, jamPulang: "17:00" },
    { id: "mock-kar-02", hariLalu: 1, jamMasuk: "07:20", telat: 20, jamPulang: "16:10" },
    { id: "mock-kar-02", hariLalu: 3, jamMasuk: "07:00", telat: 0, jamPulang: "16:00" },
    { id: "mock-kar-03", hariLalu: 1, jamMasuk: "07:35", telat: 35, jamPulang: "16:05" },
    { id: "mock-kar-04", hariLalu: 2, jamMasuk: "08:00", telat: 0, jamPulang: "17:00" },
    { id: "mock-kar-05", hariLalu: 1, jamMasuk: "08:45", telat: 45, jamPulang: "17:20" },
    { id: "mock-kar-06", hariLalu: 4, jamMasuk: "09:30", telat: 30, jamPulang: "18:15" },
    { id: "mock-kar-07", hariLalu: 1, jamMasuk: "08:05", telat: 5, jamPulang: "17:00" },
    { id: "mock-kar-08", hariLalu: 2, jamMasuk: "08:40", telat: 10, jamPulang: "17:40" },
  ];

  for (const p of pola) {
    attendance.push({
      id: `att-${p.id}-${p.hariLalu}`,
      profile_id: p.id,
      tanggal: hariLalu(p.hariLalu),
      jam_masuk: p.jamMasuk,
      lat_masuk: MOCK_SETTINGS.latitude,
      lng_masuk: MOCK_SETTINGS.longitude,
      akurasi_masuk_meter: 15,
      status_radius_masuk: "Valid",
      jam_pulang: p.jamPulang,
      lat_pulang: MOCK_SETTINGS.latitude,
      lng_pulang: MOCK_SETTINGS.longitude,
      akurasi_pulang_meter: 15,
      status_radius_pulang: "Valid",
      menit_terlambat: p.telat,
    });
  }

  overtime.push(
    {
      id: "ot-1",
      profile_id: "mock-kar-01",
      tanggal: hariLalu(1),
      jam_mulai: "18:00",
      jam_selesai: "20:30",
      total_jam: 2.5,
      alasan: "Menyelesaikan pesanan kue ulang tahun",
      status: "Approved",
      approved_by: "mock-admin-1",
      tanggal_persetujuan: hariLalu(1),
      catatan_admin: "Disetujui",
      nominal: 50000,
    },
    {
      id: "ot-2",
      profile_id: "mock-kar-02",
      tanggal: hariLalu(1),
      jam_mulai: "18:00",
      jam_selesai: "20:30",
      total_jam: 2.5,
      alasan: "Persiapan adonan untuk besok pagi",
      status: "Approved",
      approved_by: "mock-admin-1",
      tanggal_persetujuan: hariLalu(1),
      catatan_admin: "Disetujui",
      nominal: 62500,
    },
    {
      id: "ot-3",
      profile_id: "mock-kar-03",
      tanggal: hariLalu(0),
      jam_mulai: "17:00",
      jam_selesai: "19:00",
      total_jam: 2,
      alasan: "Membersihkan area produksi setelah tutup",
      status: "Pending",
      approved_by: null,
      tanggal_persetujuan: null,
      catatan_admin: null,
      nominal: 0,
    },
    {
      id: "ot-4",
      profile_id: "mock-kar-04",
      tanggal: hariLalu(2),
      jam_mulai: "17:30",
      jam_selesai: "19:30",
      total_jam: 2,
      alasan: "Membantu packing pesanan besar",
      status: "Rejected",
      approved_by: "mock-admin-1",
      tanggal_persetujuan: hariLalu(2),
      catatan_admin: "Tidak ada anggaran lembur hari itu",
      nominal: 0,
    },
  );

  return { attendance, overtime };
}

export function cariProfile(id: string): Profile | undefined {
  return MOCK_PROFILES.find((p) => p.id === id);
}

export function daftarKaryawanAktif(): Profile[] {
  return MOCK_PROFILES.filter((p) => p.role === "karyawan" && p.is_active);
}
