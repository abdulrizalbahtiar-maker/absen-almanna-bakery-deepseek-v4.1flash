import { NextResponse } from "next/server";
import { buatKlienServer } from "@/lib/supabase/server";
import { ambilSettings } from "@/lib/supabase/queries";
import { jarakKeKantor } from "@/lib/geo";
import { hitungMenitTerlambat } from "@/lib/late";
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
    .select("id")
    .eq("profile_id", user.id)
    .eq("tanggal", tanggal)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ pesan: "Sudah check-in hari ini." }, { status: 409 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("jam_masuk_standar")
    .eq("id", user.id)
    .single();

  const jamMasuk = getJamLengkapWITA();
  const menit = hitungMenitTerlambat(
    jamMasuk,
    profile?.jam_masuk_standar ?? "08:00",
  );

  const { error } = await supabase.from("attendance").insert({
    profile_id: user.id,
    tanggal,
    jam_masuk: jamMasuk,
    lat_masuk: lat,
    lng_masuk: lng,
    akurasi_masuk_meter: Math.round(akurasi),
    status_radius_masuk: statusRadius,
    menit_terlambat: menit,
  });

  if (error) {
    return NextResponse.json({ pesan: error.message }, { status: 500 });
  }

  return NextResponse.json({
    pesan: menit > 0 ? `Check-in tercatat. Telat ${menit} menit.` : "Check-in tepat waktu.",
    jarak,
    statusRadius,
    menit_terlambat: menit,
  });
}
