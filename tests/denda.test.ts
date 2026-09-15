import { describe, it, expect } from "vitest";
import { menitEfektifTelat, hitungDendaHarian } from "@/lib/denda";
import { durasiKerja } from "@/lib/late";
import { formatRupiah } from "@/lib/format";

describe("menitEfektifTelat (denda)", () => {
  it("telat di bawah toleransi => 0", () => {
    expect(menitEfektifTelat(10, 15)).toBe(0);
    expect(menitEfektifTelat(15, 15)).toBe(0);
  });

  it("telat di atas toleransi => selisih", () => {
    expect(menitEfektifTelat(61, 15)).toBe(46);
  });

  it("toleransi 0 => pakai menit telat penuh", () => {
    expect(menitEfektifTelat(20, 0)).toBe(20);
  });
});

describe("hitungDendaHarian (proporsional)", () => {
  it("tarif 10000/jam, toleransi 15, telat 61 => 7667 (46/60*10000)", () => {
    const denda = hitungDendaHarian(61, 15, 10000);
    expect(Math.round(denda)).toBe(7667);
  });

  it("dalam toleransi => 0", () => {
    expect(hitungDendaHarian(10, 15, 10000)).toBe(0);
  });

  it("tarif 0 => 0", () => {
    expect(hitungDendaHarian(60, 15, 0)).toBe(0);
  });

  it("telat tepat 1 jam di atas toleransi: 75 mnt => 1 jam penuh", () => {
    expect(Math.round(hitungDendaHarian(75, 15, 20000))).toBe(20000);
  });
});

describe("durasiKerja", () => {
  it("08:00-17:00 => 9 jam", () => {
    expect(durasiKerja("08:00", "17:00")).toBe(9);
  });
  it("07:00-16:30 => 9.5 jam", () => {
    expect(durasiKerja("07:00", "16:30")).toBe(9.5);
  });
});

describe("formatRupiah", () => {
  it("memberi titik ribuan tanpa locale", () => {
    expect(formatRupiah(7667)).toBe("Rp 7.667");
    expect(formatRupiah(1500000)).toBe("Rp 1.500.000");
    expect(formatRupiah(0)).toBe("Rp 0");
  });

  it("membulatkan ke rupiah terdekat", () => {
    expect(formatRupiah(7666.7)).toBe("Rp 7.667");
  });
});
