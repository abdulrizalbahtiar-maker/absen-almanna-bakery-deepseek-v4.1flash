/** Format rupiah deterministik (tanpa toLocaleString) agar aman hidrasi. */
export function formatRupiah(nilai: number): string {
  const bulat = Math.round(nilai);
  const tanda = bulat < 0 ? "-" : "";
  const digit = Math.abs(bulat).toString();
  const denganTitik = digit.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${tanda}Rp ${denganTitik}`;
}
