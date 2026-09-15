import { describe, it, expect } from "vitest";
import { hitungMenitTerlambat, hitungJamTerlambat } from "@/lib/late";

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
