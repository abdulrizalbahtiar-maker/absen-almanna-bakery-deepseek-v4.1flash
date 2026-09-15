import { describe, it, expect } from "vitest";
import {
  getTanggalWITA,
  getJamWITA,
  rentangTanggal,
  namaFileRekap,
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
