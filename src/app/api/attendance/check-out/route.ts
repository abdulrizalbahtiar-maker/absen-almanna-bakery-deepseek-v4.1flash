import { NextResponse } from "next/server";
import { buatKlienServer } from "@/lib/supabase/server";
import { ambilSettings } from "@/lib/supabase/queries";
import { jarakKeKantor } from "@/lib/geo";
import { getJamLengkapWITA, getTanggalWITA } from "@/lib/time";

export async function POST(request: Request) {
  const supabase = await buatKlienServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ pesan: "Tidak terautentikasi." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  const akurasi = Number(body?.akurasi);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(akurasi)) {
    return NextResponse.json({ pesan: "lat, lng, akurasi wajib." }, { status: 400 });
  }

  const settings = await ambilSettings();
  if (!settings) {
    return NextResponse.json({ pesan: "Settings belum diatur." }, { status: 500 });
  }

  const jarak = Math.round(
    jarakKeKantor(lat, lng, settings.latitude, settings.longitude),
  );
  const didalam = jarak <= settings.radius_meter;
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
    .select("id, jam_masuk, jam_pulang")
    .eq("profile_id", user.id)
    .eq("tanggal", tanggal)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ pesan: "Belum check-in hari ini." }, { status: 409 });
  }
  if (existing.jam_pulang) {
    return NextResponse.json({ pesan: "Sudah check-out hari ini." }, { status: 409 });
  }

  const { error } = await supabase
    .from("attendance")
    .update({
      jam_pulang: getJamLengkapWITA(),
      lat_pulang: lat,
      lng_pulang: lng,
      akurasi_pulang_meter: Math.round(akurasi),
      status_radius_pulang: statusRadius,
    })
    .eq("id", existing.id);

  if (error) return NextResponse.json({ pesan: error.message }, { status: 500 });

  return NextResponse.json({ pesan: "Check-out tercatat.", jarak, statusRadius });
}
