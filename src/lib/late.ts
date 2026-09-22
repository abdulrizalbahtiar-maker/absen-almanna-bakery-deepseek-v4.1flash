/** Ubah "HH:MM" atau "HH:MM:SS" jadi total detik sejak tengah malam. */
export function jamKeDetik(jam: string): number {
  const [h, m, s = "0"] = jam.split(":");
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

/**
 * Normalisasi waktu ke format "HH:MM".
 * Menerima "HH:MM" dan "HH:MM:SS" (format yang dikembalikan kolom time Supabase).
 * Mengembalikan null jika format tidak dikenali.
 */
export function normalisasiJam(nilai: unknown): string | null {
  if (typeof nilai !== "string") return null;
  const cocok = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(nilai.trim());
  if (!cocok) return null;
  return `${cocok[1]}:${cocok[2]}`;
}

/** Apakah string jam valid dalam format "HH:MM" atau "HH:MM:SS". */
export function jamValid(nilai: unknown): boolean {
  return normalisasiJam(nilai) !== null;
}

/**
 * Menit terlambat = MAX(0, jam_masuk_aktual - jam_masuk_standar).
 * Pembulatan ke bawah, satuan menit, integer.
 */
export function hitungMenitTerlambat(
  jamMasukAktual: string,
  jamMasukStandar: string,
): number {
  const selisihDetik = jamKeDetik(jamMasukAktual) - jamKeDetik(jamMasukStandar);
  if (selisihDetik <= 0) return 0;
  return Math.floor(selisihDetik / 60);
}

export function hitungJamTerlambat(totalMenit: number): number {
  return Math.round((totalMenit / 60) * 100) / 100;
}

/** Durasi kerja dalam jam desimal dari jam masuk ke jam pulang. */
export function durasiKerja(jamMasuk: string, jamPulang: string): number {
  const selisihDetik = jamKeDetik(jamPulang) - jamKeDetik(jamMasuk);
  if (selisihDetik <= 0) return 0;
  return Math.round((selisihDetik / 3600) * 100) / 100;
}
