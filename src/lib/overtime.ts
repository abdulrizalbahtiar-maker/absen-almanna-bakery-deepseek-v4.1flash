import { jamKeDetik } from "./late";

export const MAKS_HARI_KE_DEPAN = 7;
export const MIN_PANJANG_ALASAN = 10;

/** Total jam lembur = (jam_selesai - jam_mulai) dalam jam, 2 desimal. */
export function hitungTotalJam(jamMulai: string, jamSelesai: string): number {
  const selisihDetik = jamKeDetik(jamSelesai) - jamKeDetik(jamMulai);
  if (selisihDetik <= 0) return 0;
  return Math.round((selisihDetik / 3600) * 100) / 100;
}

/** Nominal lembur = total_jam * tarif per jam pengaju. */
export function hitungNominal(totalJam: number, tarifPerJam: number): number {
  return Math.round(totalJam * tarifPerJam);
}

export interface ValidasiLemburInput {
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  alasan: string;
  hariIni: string;
}

export interface HasilValidasi {
  valid: boolean;
  pesan: string | null;
}

/** Validasi pengajuan lembur (bab 8.2). */
export function validasiPengajuanLembur(
  input: ValidasiLemburInput,
): HasilValidasi {
  const { tanggal, jam_mulai, jam_selesai, alasan, hariIni } = input;

  if (!tanggal || !jam_mulai || !jam_selesai) {
    return { valid: false, pesan: "Tanggal dan jam wajib diisi." };
  }

  if (jamKeDetik(jam_selesai) <= jamKeDetik(jam_mulai)) {
    return { valid: false, pesan: "Jam selesai harus setelah jam mulai." };
  }

  if (alasan.trim().length < MIN_PANJANG_ALASAN) {
    return {
      valid: false,
      pesan: `Alasan minimal ${MIN_PANJANG_ALASAN} karakter.`,
    };
  }

  const selisih = selisihHariYMD(hariIni, tanggal);

  if (selisih < 0) {
    return { valid: false, pesan: "Tanggal tidak boleh di masa lalu." };
  }

  if (selisih > MAKS_HARI_KE_DEPAN) {
    return {
      valid: false,
      pesan: `Tanggal maksimal ${MAKS_HARI_KE_DEPAN} hari ke depan.`,
    };
  }

  return { valid: true, pesan: null };
}

/** Selisih hari (b - a) untuk tanggal YYYY-MM-DD. */
function selisihHariYMD(a: string, b: string): number {
  const ta = Date.parse(`${a}T00:00:00Z`);
  const tb = Date.parse(`${b}T00:00:00Z`);
  if (Number.isNaN(ta) || Number.isNaN(tb)) return 0;
  return Math.round((tb - ta) / 86400000);
}
