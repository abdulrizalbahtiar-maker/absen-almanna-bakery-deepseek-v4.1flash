import { describe, it, expect, beforeEach } from "vitest";
import {
  prosesAbsen,
  rekapKeterlambatan,
  rekapLembur,
  ajukanLembur,
  keputusanAdmin,
  hapusLembur,
  editLembur,
  resetTransaksi,
  getOvertime,
  getProfiles,
  hapusKaryawan,
  resetStateMock,
} from "@/lib/mockStore";
import { SIMULASI_GPS, cariProfile } from "@/lib/mockData";
import { getTanggalWITA } from "@/lib/time";

const kar01 = () => cariProfile("mock-kar-01")!;
const admin = () => cariProfile("mock-admin-1")!;

beforeEach(() => {
  resetStateMock();
});

describe("mesin aksi absen (bab 7.1)", () => {
  it("check-in di kantor => Valid", () => {
    const r = prosesAbsen(kar01(), "check-in", SIMULASI_GPS.diKantor);
    expect(r.sukses).toBe(true);
    expect(r.aksi).toBe("check-in");
    expect(r.statusRadius).toBe("Valid");
  });

  it("check-in di luar radius ditolak saat tolak_diluar_radius=true", () => {
    const r = prosesAbsen(kar01(), "check-in", SIMULASI_GPS.diLuar);
    expect(r.sukses).toBe(false);
    expect(r.jarak).toBeGreaterThan(100);
  });

  it("akurasi buruk TIDAK memblokir selama di dalam radius", () => {
    const r = prosesAbsen(kar01(), "check-in", SIMULASI_GPS.akurasiBuruk);
    expect(r.sukses).toBe(true);
    expect(r.statusRadius).toBe("Valid");
  });

  it("duplikat check-in ditolak", () => {
    prosesAbsen(kar01(), "check-in", SIMULASI_GPS.diKantor);
    const r2 = prosesAbsen(kar01(), "check-in", SIMULASI_GPS.diKantor);
    expect(r2.sukses).toBe(false);
    expect(r2.pesan).toContain("Sudah check-in");
  });

  it("check-out tanpa check-in ditolak", () => {
    const r = prosesAbsen(kar01(), "check-out", SIMULASI_GPS.diKantor);
    expect(r.sukses).toBe(false);
    expect(r.pesan).toContain("Belum check-in");
  });

  it("check-in lalu check-out berhasil, check-out kedua ditolak", () => {
    prosesAbsen(kar01(), "check-in", SIMULASI_GPS.diKantor);
    const keluar = prosesAbsen(kar01(), "check-out", SIMULASI_GPS.diKantor);
    expect(keluar.sukses).toBe(true);
    const lagi = prosesAbsen(kar01(), "check-out", SIMULASI_GPS.diKantor);
    expect(lagi.sukses).toBe(false);
    expect(lagi.pesan).toContain("Sudah check-out");
  });
});

describe("state machine lembur (bab 7.3)", () => {
  it("approve menghitung nominal per karyawan", () => {
    const hari = getTanggalWITA();
    const r = ajukanLembur("mock-kar-02", {
      tanggal: hari,
      jam_mulai: "18:00",
      jam_selesai: "20:30",
      alasan: "Persiapan produksi malam",
    });
    expect(r.sukses).toBe(true);

    const baru = getOvertime().find((o) => o.profile_id === "mock-kar-02" && o.status === "Pending")!;
    const decide = keputusanAdmin(baru.id, "Approve", "", admin().id);
    expect(decide.sukses).toBe(true);

    const updated = getOvertime().find((o) => o.id === baru.id)!;
    // tarif mock-kar-02 = 25000, 2.5 jam => 62500
    expect(updated.nominal).toBe(62500);
    expect(updated.approved_by).toBe(admin().id);
  });

  it("transisi ilegal: ubah lembur Approved ditolak", () => {
    const approved = getOvertime().find((o) => o.status === "Approved")!;
    const r = editLembur(approved.id, approved.profile_id, {
      tanggal: approved.tanggal,
      jam_mulai: "18:00",
      jam_selesai: "21:00",
      alasan: "coba ubah data final",
    });
    expect(r.sukses).toBe(false);
    expect(r.pesan).toContain("Pending");
  });

  it("hapus hanya Pending", () => {
    const approved = getOvertime().find((o) => o.status === "Approved")!;
    expect(hapusLembur(approved.id, approved.profile_id).sukses).toBe(false);
  });

  it("reject wajib catatan", () => {
    const pending = getOvertime().find((o) => o.status === "Pending")!;
    const r = keputusanAdmin(pending.id, "Reject", "", admin().id);
    expect(r.sukses).toBe(false);
    expect(r.pesan).toContain("Catatan");
  });
});

describe("agregasi rekap", () => {
  it("semua karyawan aktif tampil walau 0 absen di periode", () => {
    const rows = rekapKeterlambatan("2000-01-01", "2000-01-31");
    expect(rows.length).toBe(8);
    expect(rows.every((r) => r.total_hari_hadir === 0)).toBe(true);
  });

  it("nominal rekap = SUM nominal tersimpan", () => {
    const mulai = "2000-01-01";
    const akhir = "2100-01-01";
    const rows = rekapLembur(mulai, akhir);
    const totalNominal = rows.reduce((n, r) => n + r.total_nominal, 0);
    expect(totalNominal).toBe(50000 + 62500); // ot-1 + ot-2 seed
  });

  it("reset transaksi tidak menyentuh master", () => {
    resetTransaksi("all");
    expect(getOvertime().length).toBe(0);
    expect(rekapKeterlambatan("2000-01-01", "2100-01-01").length).toBe(8);
    expect(cariProfile("mock-admin-1")).toBeTruthy();
  });

  it("rekap keterlambatan memuat kolom denda", () => {
    const rows = rekapKeterlambatan("2000-01-01", "2100-01-01");
    const kar01Row = rows.find((r) => r.profile_id === "mock-kar-01")!;
    expect(kar01Row).toHaveProperty("tarif_denda_per_jam");
    expect(kar01Row).toHaveProperty("total_menit_efektif");
    expect(kar01Row).toHaveProperty("total_denda");

    // Seed: kar01 telat 12 mnt (hari-1) + 0 mnt (hari-2).
    // Toleransi 15 => efektif 0 => denda 0.
    expect(kar01Row.total_menit_efektif).toBe(0);
    expect(kar01Row.total_denda).toBe(0);
  });

  it("denda dihitung proporsional di atas toleransi", () => {
    // Seed kar03: telat 35 mnt, tarif denda 20000/jam, toleransi 15.
    // efektif = 20 mnt => 20/60*20000 = 6666.67 => dibulatkan 6667.
    const rows = rekapKeterlambatan("2000-01-01", "2100-01-01");
    const kar03Row = rows.find((r) => r.profile_id === "mock-kar-03")!;
    expect(kar03Row.total_menit_efektif).toBe(20);
    expect(kar03Row.total_denda).toBe(6667);
  });
});

describe("hapus karyawan", () => {
  it("menghapus profile + transaksi terkait, master lain aman", () => {
    const sebelum = getProfiles().length;
    const adaAbsen = rekapKeterlambatan("2000-01-01", "2100-01-01").some(
      (r) => r.profile_id === "mock-kar-04",
    );
    expect(adaAbsen).toBe(true);

    const hasil = hapusKaryawan("mock-kar-04");
    expect(hasil.sukses).toBe(true);
    expect(getProfiles().length).toBe(sebelum - 1);
    expect(getProfiles().find((p) => p.id === "mock-kar-04")).toBeUndefined();

    const masihAda = rekapKeterlambatan("2000-01-01", "2100-01-01").some(
      (r) => r.profile_id === "mock-kar-04",
    );
    expect(masihAda).toBe(false);
    expect(getProfiles().find((p) => p.id === "mock-admin-1")).toBeTruthy();
  });

  it("tidak bisa menghapus akun admin", () => {
    const hasil = hapusKaryawan("mock-admin-1");
    expect(hasil.sukses).toBe(false);
    expect(getProfiles().find((p) => p.id === "mock-admin-1")).toBeTruthy();
  });
});
