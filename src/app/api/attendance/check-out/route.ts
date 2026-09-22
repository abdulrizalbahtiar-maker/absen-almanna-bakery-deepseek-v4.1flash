import { NextResponse } from "next/server";
import { buatKlienServer } from "@/lib/supabase/server";
import { ambilSettings } from "@/lib/supabase/queries";
import { jarakKeKantor, validasiGeo } from "@/lib/geo";
import { getJamLengkapWITA, getTanggalWITA } from "@/lib/time";

export async function POST(request: Request) {
  const supabase = await buatKlienServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ pesan: "Tidak terautentikasi." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const geo = validasiGeo(body);
  if (!geo.valid) {
    return NextResponse.json({ pesan: geo.pesan }, { status: 400 });
  }
  const { lat, lng, akurasi } = geo as { lat: number; lng: number; akurasi: number };

  const settings = await ambilSettings();
  if (!settings) {
    return NextResponse.json({ pesan: "Settings belum diatur." }, { status: 500 });
  }

  const jarakAsli = jarakKeKantor(lat, lng, settings.latitude, settings.longitude);
  const jarak = Math.round(jarakAsli);
  const didalam = jarakAsli <= settings.radius_meter;
  if (!didalam && settings.tolak_diluar_radius) {
    return NextResponse.json(
      {
        pesan: `Di luar radius kantor. Jarak ${jarak} m, batas ${settings.radius_meter} m.`,
        jarak,
      },
      { status: 400 },
    );
  }
  const statusRadius = didalam ? "Valid" : "DiLuarRadius";

  const tanggal = getTanggalWITA();
  const { data: existing } = await supabase
    .from("attendance")
    .select("id, jam_pulang")
    .eq("profile_id", user.id)
    .eq("tanggal", tanggal)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ pesan: "Belum check-in hari ini." }, { status: 409 });
  }
  if (existing.jam_pulang) {
    return NextResponse.json({ pesan: "Sudah check-out hari ini." }, { status: 409 });
  }

  // Guard tambahan `jam_pulang is null` agar dua request bersamaan
  // tidak saling menimpa (hanya satu yang menang).
  const { data: diupdate, error } = await supabase
    .from("attendance")
    .update({
      jam_pulang: getJamLengkapWITA(),
      lat_pulang: lat,
      lng_pulang: lng,
      akurasi_pulang_meter: Math.round(akurasi),
      status_radius_pulang: statusRadius,
    })
    .eq("id", existing.id)
    .is("jam_pulang", null)
    .select("id");

  if (error) {
    console.error("[check-out] gagal update attendance:", error.message);
    return NextResponse.json(
      { pesan: "Gagal menyimpan absensi. Coba lagi." },
      { status: 500 },
    );
  }
  if (!diupdate || diupdate.length === 0) {
    return NextResponse.json({ pesan: "Sudah check-out hari ini." }, { status: 409 });
  }

  return NextResponse.json({ pesan: "Check-out tercatat.", jarak, statusRadius });
}
