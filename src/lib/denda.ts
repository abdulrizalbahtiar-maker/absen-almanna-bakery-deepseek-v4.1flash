/**
 * Denda keterlambatan.
 * - Toleransi global (settings.toleransi_telat_menit).
 * - Tarif per karyawan (profiles.tarif_denda_per_jam).
 * - Proporsional: menit efektif / 60 * tarif.
 */

/** Menit efektif setelah dikurangi toleransi (tidak pernah negatif). */
export function menitEfektifTelat(
  menitTerlambat: number,
  toleransiMenit: number,
): number {
  return Math.max(0, menitTerlambat - Math.max(0, toleransiMenit));
}

/** Denda harian: (menit_efektif / 60) * tarif per jam. */
export function hitungDendaHarian(
  menitTerlambat: number,
  toleransiMenit: number,
  tarifDendaPerJam: number,
): number {
  const efektif = menitEfektifTelat(menitTerlambat, toleransiMenit);
  if (efektif === 0 || tarifDendaPerJam <= 0) return 0;
  return (efektif / 60) * tarifDendaPerJam;
}
