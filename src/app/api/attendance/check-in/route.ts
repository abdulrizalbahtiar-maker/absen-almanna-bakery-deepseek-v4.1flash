import { NextResponse } from "next/server";
import { buatKlienServer } from "@/lib/supabase/server";
import { ambilSettings } from "@/lib/supabase/queries";
import { jarakKeKantor, validasiGeo } from "@/lib/geo";
import { hitungMenitTerlambat } from "@/lib/late";
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

  // Bandingkan jarak asli dengan radius, bulatkan hanya untuk ditampilkan.
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

  // Insert langsung dan andalkan unique constraint (profile_id, tanggal)
  // sehingga request ganda tidak bisa menghasilkan dua baris absensi.
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
    // 23505 = unique_violation: sudah check-in hari ini (aman dari race).
    if (error.code === "23505") {
      return NextResponse.json({ pesan: "Sudah check-in hari ini." }, { status: 409 });
    }
    console.error("[check-in] gagal insert attendance:", error.message);
    return NextResponse.json(
      { pesan: "Gagal menyimpan absensi. Coba lagi." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    pesan: menit > 0 ? `Check-in tercatat. Telat ${menit} menit.` : "Check-in tepat waktu.",
    jarak,
    statusRadius,
    menit_terlambat: menit,
  });
}
