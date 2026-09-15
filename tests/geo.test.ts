import { describe, it, expect } from "vitest";
import {
  haversineMeter,
  jarakKeKantor,
  diDalamRadius,
  akurasiValid,
  TITIK_KANTOR,
} from "@/lib/geo";

describe("geo (bab 7.1)", () => {
  it("jarak titik yang sama = 0", () => {
    expect(
      haversineMeter(TITIK_KANTOR.lat, TITIK_KANTOR.lng, TITIK_KANTOR.lat, TITIK_KANTOR.lng),
    ).toBe(0);
  });

  it("titik di kantor berada dalam radius 100m", () => {
    expect(diDalamRadius(TITIK_KANTOR.lat, TITIK_KANTOR.lng, 100)).toBe(true);
  });

  it("titik simulasi di luar (-4.035, 122.480) berjarak ~881m", () => {
    const jarak = jarakKeKantor(-4.035, 122.48);
    expect(jarak).toBeGreaterThan(500);
    expect(diDalamRadius(-4.035, 122.48, 100)).toBe(false);
  });

  it("titik dekat (~50m) masih dalam radius 100m", () => {
    // geser ~0.00045 derajat lintang ~ 50m
    const lat = TITIK_KANTOR.lat + 0.00045;
    const jarak = jarakKeKantor(lat, TITIK_KANTOR.lng);
    expect(jarak).toBeLessThan(100);
  });

  it("akurasi > 100 ditolak", () => {
    expect(akurasiValid(150)).toBe(false);
    expect(akurasiValid(15)).toBe(true);
  });
});
