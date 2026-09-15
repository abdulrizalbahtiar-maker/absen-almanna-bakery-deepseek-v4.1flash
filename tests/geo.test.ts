import { describe, it, expect } from "vitest";
import {
  haversineMeter,
  jarakKeKantor,
  diDalamRadius,
  akurasiValid,
  TITIK_KANTOR,
} from "@/lib/geo";

const K = TITIK_KANTOR;

describe("geo (bab 7.1)", () => {
  it("jarak titik yang sama = 0", () => {
    expect(haversineMeter(K.lat, K.lng, K.lat, K.lng)).toBe(0);
  });

  it("titik di kantor berada dalam radius 100m", () => {
    expect(diDalamRadius(K.lat, K.lng, K.lat, K.lng, 100)).toBe(true);
  });

  it("titik ~881m dari kantor di luar radius 100m", () => {
    const jarak = jarakKeKantor(-4.035, 122.48, K.lat, K.lng);
    expect(jarak).toBeGreaterThan(500);
    expect(diDalamRadius(-4.035, 122.48, K.lat, K.lng, 100)).toBe(false);
  });

  it("titik dekat (~50m) masih dalam radius 100m", () => {
    const lat = K.lat + 0.00045;
    const jarak = jarakKeKantor(lat, K.lng, K.lat, K.lng);
    expect(jarak).toBeLessThan(100);
  });

  it("jarak memakai koordinat kantor yang diberikan, bukan konstanta", () => {
    // kantor digeser ~1.1km ke selatan
    const kantorLat = K.lat - 0.01;
    const jarak = jarakKeKantor(K.lat, K.lng, kantorLat, K.lng);
    expect(jarak).toBeGreaterThan(1000);
  });

  it("akurasi > 100 ditolak", () => {
    expect(akurasiValid(150)).toBe(false);
    expect(akurasiValid(100)).toBe(true);
    expect(akurasiValid(15)).toBe(true);
  });
});
