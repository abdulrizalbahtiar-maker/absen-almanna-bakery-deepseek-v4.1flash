import { describe, it, expect } from "vitest";
import { verifikasiLogin } from "@/lib/auth";
import { MOCK_PROFILES, MOCK_PASSWORD } from "@/lib/mockData";

const profiles = MOCK_PROFILES;

describe("verifikasiLogin (mode mock)", () => {
  it("email + password benar => sukses", () => {
    const r = verifikasiLogin("admin@almanna.test", MOCK_PASSWORD, profiles);
    expect(r.sukses).toBe(true);
    expect(r.profile?.role).toBe("admin");
  });

  it("email case-insensitive + spasi => sukses", () => {
    const r = verifikasiLogin("  KAR01@Almanna.Test ", MOCK_PASSWORD, profiles);
    expect(r.sukses).toBe(true);
    expect(r.profile?.id).toBe("mock-kar-01");
  });

  it("password salah => gagal", () => {
    const r = verifikasiLogin("admin@almanna.test", "salah", profiles);
    expect(r.sukses).toBe(false);
    expect(r.pesan).toContain("Password salah");
  });

  it("email tidak terdaftar => gagal", () => {
    const r = verifikasiLogin("tidakada@almanna.test", MOCK_PASSWORD, profiles);
    expect(r.sukses).toBe(false);
    expect(r.pesan).toContain("tidak terdaftar");
  });

  it("field kosong => gagal", () => {
    expect(verifikasiLogin("", MOCK_PASSWORD, profiles).sukses).toBe(false);
    expect(verifikasiLogin("admin@almanna.test", "", profiles).sukses).toBe(false);
  });
});
