import { describe, it, expect } from "vitest";
import {
  hitungTotalJam,
  hitungNominal,
  validasiPengajuanLembur,
} from "@/lib/overtime";

describe("hitungTotalJam (bab 8.2)", () => {
  it("18:00-20:30 => 2.5", () => {
    expect(hitungTotalJam("18:00", "20:30")).toBe(2.5);
  });

  it("jam_selesai <= jam_mulai => 0", () => {
    expect(hitungTotalJam("20:00", "18:00")).toBe(0);
    expect(hitungTotalJam("18:00", "18:00")).toBe(0);
  });
});

describe("hitungNominal (bab 8.2)", () => {
  it("Budi tarif 20000 x 2.5 jam = 50000", () => {
    expect(hitungNominal(2.5, 20000)).toBe(50000);
  });

  it("Sari tarif 25000 x 2.5 jam = 62500", () => {
    expect(hitungNominal(2.5, 25000)).toBe(62500);
  });
});

describe("validasiPengajuanLembur (bab 8.2)", () => {
  const dasar = {
    tanggal: "2026-09-15",
    jam_mulai: "18:00",
    jam_selesai: "20:30",
    alasan: "Menyelesaikan pesanan kue",
    hariIni: "2026-09-15",
  };

  it("valid untuk input benar", () => {
    expect(validasiPengajuanLembur(dasar).valid).toBe(true);
  });

  it("tolak jam_selesai <= jam_mulai", () => {
    const hasil = validasiPengajuanLembur({
      ...dasar,
      jam_selesai: "17:00",
    });
    expect(hasil.valid).toBe(false);
    expect(hasil.pesan).toContain("Jam selesai");
  });

  it("tolak alasan < 10 karakter", () => {
    const hasil = validasiPengajuanLembur({ ...dasar, alasan: "lembur" });
    expect(hasil.valid).toBe(false);
    expect(hasil.pesan).toContain("10 karakter");
  });

  it("tolak tanggal masa lalu", () => {
    const hasil = validasiPengajuanLembur({
      ...dasar,
      tanggal: "2026-09-14",
    });
    expect(hasil.valid).toBe(false);
    expect(hasil.pesan).toContain("masa lalu");
  });

  it("tolak tanggal > 7 hari ke depan", () => {
    const hasil = validasiPengajuanLembur({
      ...dasar,
      tanggal: "2026-09-23",
    });
    expect(hasil.valid).toBe(false);
    expect(hasil.pesan).toContain("7 hari");
  });

  it("terima tepat 7 hari ke depan", () => {
    const hasil = validasiPengajuanLembur({
      ...dasar,
      tanggal: "2026-09-22",
    });
    expect(hasil.valid).toBe(true);
  });
});
