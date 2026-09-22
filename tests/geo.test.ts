import { describe, it, expect } from "vitest";
import {
  haversineMeter,
  jarakKeKantor,
  diDalamRadius,
  validasiGeo,
  AKURASI_MAKSIMUM_METER,
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
});

describe("validasiGeo", () => {
  it("menerima payload koordinat yang wajar", () => {
    const hasil = validasiGeo({ lat: K.lat, lng: K.lng, akurasi: 12 });
    expect(hasil.valid).toBe(true);
    expect(hasil.lat).toBe(K.lat);
    expect(hasil.lng).toBe(K.lng);
    expect(hasil.akurasi).toBe(12);
  });

  it("menolak nilai bukan angka", () => {
    expect(validasiGeo({ lat: "abc", lng: 1, akurasi: 1 }).valid).toBe(false);
  });

  it("menolak latitude di luar -90..90", () => {
    expect(validasiGeo({ lat: 999, lng: 122, akurasi: 10 }).valid).toBe(false);
    expect(validasiGeo({ lat: -91, lng: 122, akurasi: 10 }).valid).toBe(false);
  });

  it("menolak longitude di luar -180..180", () => {
    expect(validasiGeo({ lat: -4, lng: -999, akurasi: 10 }).valid).toBe(false);
  });

  it("menolak akurasi negatif", () => {
    expect(validasiGeo({ lat: -4, lng: 122, akurasi: -5 }).valid).toBe(false);
  });

  it("menolak akurasi terlalu rendah (di atas batas)", () => {
    expect(
      validasiGeo({ lat: -4, lng: 122, akurasi: AKURASI_MAKSIMUM_METER + 1 }).valid,
    ).toBe(false);
  });

  it("menolak body bukan object", () => {
    expect(validasiGeo(null).valid).toBe(false);
    expect(validasiGeo("bukan object").valid).toBe(false);
  });
});
