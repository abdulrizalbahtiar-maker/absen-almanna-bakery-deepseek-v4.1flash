export const APP_TIMEZONE = "Asia/Makassar";

/** Format tanggal YYYY-MM-DD di timezone aplikasi (WITA). */
export function getTanggalWITA(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return parts;
}

/** Format jam HH:MM di timezone aplikasi (WITA). */
export function getJamWITA(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/** Format waktu lengkap HH:MM:SS di timezone aplikasi (WITA). */
export function getJamLengkapWITA(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

/** Selisih hari kalender antara dua tanggal YYYY-MM-DD. */
export function selisihHari(dari: string, sampai: string): number {
  const a = Date.parse(`${dari}T00:00:00Z`);
  const b = Date.parse(`${sampai}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

/** Daftar tanggal YYYY-MM-DD inklusif antara dua tanggal. */
export function rentangTanggal(mulai: string, akhir: string): string[] {
  const hasil: string[] = [];
  const total = selisihHari(mulai, akhir);
  if (total < 0) return hasil;
  const start = Date.parse(`${mulai}T00:00:00Z`);
  for (let i = 0; i <= total; i++) {
    hasil.push(new Date(start + i * 86400000).toISOString().slice(0, 10));
  }
  return hasil;
}

/** Nama file export: rekap-YYYYMMDD-sampai-YYYYMMDD.xlsx */
export function namaFileRekap(mulai: string, akhir: string): string {
  const pad = (s: string) => s.replaceAll("-", "");
  return `rekap-${pad(mulai)}-sampai-${pad(akhir)}.xlsx`;
}

const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

/** Cek format YYYY-MM-DD dan validitas kalender. */
export function tanggalValid(teks: string): boolean {
  if (!POLA_TANGGAL.test(teks)) return false;
  const d = new Date(`${teks}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === teks;
}

export interface HasilValidasiPeriode {
  valid: boolean;
  pesan?: string;
  mulai?: string;
  akhir?: string;
}

/** Rentang maksimum laporan (hari). */
export const MAKS_RENTANG_LAPORAN_HARI = 366;

/** Validasi filter periode laporan: format, urutan, dan batas rentang. */
export function validasiPeriode(
  mulai: string,
  akhir: string,
): HasilValidasiPeriode {
  if (!tanggalValid(mulai) || !tanggalValid(akhir)) {
    return { valid: false, pesan: "Format tanggal harus YYYY-MM-DD." };
  }
  const total = selisihHari(mulai, akhir);
  if (total < 0) {
    return { valid: false, pesan: "Tanggal 'dari' harus sebelum 'sampai'." };
  }
  if (total > MAKS_RENTANG_LAPORAN_HARI) {
    return {
      valid: false,
      pesan: `Rentang maksimal ${MAKS_RENTANG_LAPORAN_HARI} hari.`,
    };
  }
  return { valid: true, mulai, akhir };
}
