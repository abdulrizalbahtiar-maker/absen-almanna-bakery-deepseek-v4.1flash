export const TITIK_KANTOR = {
  lat: -4.030128,
  lng: 122.473738,
} as const;

export const MAKS_AKURASI_METER = 100;

/** Jarak Haversine antara dua koordinat dalam meter. */
export function haversineMeter(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function jarakKeKantor(
  lat: number,
  lng: number,
  kantorLat: number,
  kantorLng: number,
): number {
  return haversineMeter(lat, lng, kantorLat, kantorLng);
}

export function diDalamRadius(
  lat: number,
  lng: number,
  kantorLat: number,
  kantorLng: number,
  radiusMeter: number,
): boolean {
  return jarakKeKantor(lat, lng, kantorLat, kantorLng) <= radiusMeter;
}

export function akurasiValid(akurasi: number): boolean {
  return akurasi <= MAKS_AKURASI_METER;
}
