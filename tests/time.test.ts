import { describe, it, expect } from "vitest";
import {
  getTanggalWITA,
  getJamWITA,
  rentangTanggal,
  namaFileRekap,
  tanggalValid,
  validasiPeriode,
} from "@/lib/time";

describe("time WITA (bab 8.1, acceptance A13)", () => {
  it("23:30 WITA tetap tanggal WITA, bukan tanggal UTC", () => {
    // 2026-09-15T23:30:00+08:00 === 2026-09-15T15:30:00Z
    const d = new Date("2026-09-15T15:30:00Z");
    expect(getTanggalWITA(d)).toBe("2026-09-15");
    expect(getJamWITA(d)).toBe("23:30");
  });

  it("00:30 WITA adalah tanggal WITA yang benar", () => {
    // 2026-09-16T00:30:00+08:00 === 2026-09-15T16:30:00Z (UTC masih 15 Sep)
    const d = new Date("2026-09-15T16:30:00Z");
    expect(getTanggalWITA(d)).toBe("2026-09-16");
  });

  it("rentangTanggal inklusif", () => {
    expect(rentangTanggal("2026-09-01", "2026-09-03")).toEqual([
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
    ]);
  });

  it("namaFileRekap format benar", () => {
    expect(namaFileRekap("2026-09-01", "2026-09-30")).toBe(
      "rekap-20260901-sampai-20260930.xlsx",
    );
  });
});

describe("tanggalValid", () => {
  it("menerima tanggal YYYY-MM-DD yang valid", () => {
    expect(tanggalValid("2026-09-15")).toBe(true);
  });

  it("menolak format salah", () => {
    expect(tanggalValid("15-09-2026")).toBe(false);
    expect(tanggalValid("2026/09/15")).toBe(false);
    expect(tanggalValid("")).toBe(false);
  });

  it("menolak tanggal kalender tidak valid", () => {
    expect(tanggalValid("2026-13-01")).toBe(false);
    expect(tanggalValid("2026-02-30")).toBe(false);
  });
});

describe("validasiPeriode", () => {
  it("menerima rentang wajar", () => {
    const hasil = validasiPeriode("2026-09-01", "2026-09-30");
    expect(hasil.valid).toBe(true);
    expect(hasil.mulai).toBe("2026-09-01");
    expect(hasil.akhir).toBe("2026-09-30");
  });

  it("menolak format tanggal salah", () => {
    expect(validasiPeriode("2026/09/01", "2026-09-30").valid).toBe(false);
  });

  it("menolak rentang terbalik", () => {
    expect(validasiPeriode("2026-09-30", "2026-09-01").valid).toBe(false);
  });

  it("menolak rentang melebihi batas", () => {
    expect(validasiPeriode("2020-01-01", "2026-01-01").valid).toBe(false);
  });
});
