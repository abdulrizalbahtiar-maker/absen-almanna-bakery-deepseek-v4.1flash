import { describe, it, expect } from "vitest";
import {
  hitungMenitTerlambat,
  hitungJamTerlambat,
  normalisasiJam,
  jamValid,
} from "@/lib/late";

describe("hitungMenitTerlambat (bab 8.1)", () => {
  it("contoh 1: standar 08:00, aktual 07:55 => 0", () => {
    expect(hitungMenitTerlambat("07:55", "08:00")).toBe(0);
  });

  it("contoh 2: standar 08:00, aktual 08:00 => 0", () => {
    expect(hitungMenitTerlambat("08:00", "08:00")).toBe(0);
  });

  it("contoh 3: standar 08:00, aktual 08:25:30 => 25 (pembulatan ke bawah)", () => {
    expect(hitungMenitTerlambat("08:25:30", "08:00")).toBe(25);
  });

  it("contoh 4: shift beda per karyawan", () => {
    expect(hitungMenitTerlambat("08:30", "08:00")).toBe(30);
    expect(hitungMenitTerlambat("08:30", "09:00")).toBe(0);
  });

  it("hitungJamTerlambat: 90 menit => 1.5 jam", () => {
    expect(hitungJamTerlambat(90)).toBe(1.5);
  });
});

describe("normalisasiJam", () => {
  it("menormalkan HH:MM:SS dari kolom time Supabase", () => {
    expect(normalisasiJam("08:00:00")).toBe("08:00");
    expect(normalisasiJam("17:30:45")).toBe("17:30");
  });

  it("membiarkan HH:MM apa adanya", () => {
    expect(normalisasiJam("08:00")).toBe("08:00");
    expect(normalisasiJam("23:59")).toBe("23:59");
  });

  it("memangkas spasi di tepi", () => {
    expect(normalisasiJam(" 08:00:00 ")).toBe("08:00");
  });

  it("menolak format tidak valid", () => {
    expect(normalisasiJam("8:00")).toBeNull();
    expect(normalisasiJam("24:00")).toBeNull();
    expect(normalisasiJam("08:60")).toBeNull();
    expect(normalisasiJam("08")).toBeNull();
    expect(normalisasiJam("")).toBeNull();
    expect(normalisasiJam(null)).toBeNull();
    expect(normalisasiJam(undefined)).toBeNull();
  });
});

describe("jamValid", () => {
  it("true untuk HH:MM dan HH:MM:SS", () => {
    expect(jamValid("08:00")).toBe(true);
    expect(jamValid("08:00:00")).toBe(true);
  });

  it("false untuk format lain", () => {
    expect(jamValid("8:00")).toBe(false);
    expect(jamValid("abc")).toBe(false);
    expect(jamValid(123)).toBe(false);
  });
});
