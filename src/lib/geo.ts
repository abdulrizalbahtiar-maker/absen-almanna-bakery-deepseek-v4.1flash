export const TITIK_KANTOR = {
  lat: -4.030128,
  lng: 122.473738,
} as const;

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

export interface HasilValidasiGeo {
  valid: boolean;
  pesan?: string;
  lat?: number;
  lng?: number;
  akurasi?: number;
}

/** Batas akurasi wajar (meter). Di atas ini titik dianggap tidak dapat dipercaya. */
export const AKURASI_MAKSIMUM_METER = 200;

/**
 * Validasi payload koordinat mentah dari body request.
 * Menolak nilai non-angka, di luar rentang bumi, dan akurasi tak wajar.
 */
export function validasiGeo(body: unknown): HasilValidasiGeo {
  if (typeof body !== "object" || body === null) {
    return { valid: false, pesan: "Body request tidak valid." };
  }
  const b = body as Record<string, unknown>;
  const lat = Number(b.lat);
  const lng = Number(b.lng);
  const akurasi = Number(b.akurasi);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(akurasi)) {
    return { valid: false, pesan: "lat, lng, akurasi wajib berupa angka." };
  }
  if (lat < -90 || lat > 90) {
    return { valid: false, pesan: "Latitude harus antara -90 dan 90." };
  }
  if (lng < -180 || lng > 180) {
    return { valid: false, pesan: "Longitude harus antara -180 dan 180." };
  }
  if (akurasi < 0) {
    return { valid: false, pesan: "Akurasi tidak boleh negatif." };
  }
  if (akurasi > AKURASI_MAKSIMUM_METER) {
    return {
      valid: false,
      pesan: `Akurasi GPS terlalu rendah (${Math.round(akurasi)} m). Cari sinyal yang lebih baik.`,
    };
  }

  return { valid: true, lat, lng, akurasi };
}
