import { NextResponse } from "next/server";
import { buatKlienServer } from "@/lib/supabase/server";
import { hitungTotalJam, validasiPengajuanLembur } from "@/lib/overtime";
import { getTanggalWITA } from "@/lib/time";

export async function GET(request: Request) {
  const supabase = await buatKlienServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ pesan: "Tidak terautentikasi." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit"));
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(Math.trunc(limitParam), 1), 200)
    : 60;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let q = supabase
    .from("overtime_requests")
    .select("*")
    .order("tanggal", { ascending: false })
    .limit(limit);
  // RLS sudah membatasi karyawan ke datanya sendiri.
  if (from) q = q.gte("tanggal", from);
  if (to) q = q.lte("tanggal", to);

  const { data, error } = await q;
  if (error) {
    console.error("[overtime GET] gagal memuat:", error.message);
    return NextResponse.json({ pesan: "Gagal memuat data lembur." }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await buatKlienServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ pesan: "Tidak terautentikasi." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const tanggal = String(body?.tanggal ?? "");
  const jam_mulai = String(body?.jam_mulai ?? "");
  const jam_selesai = String(body?.jam_selesai ?? "");
  const alasan = String(body?.alasan ?? "");

  const validasi = validasiPengajuanLembur({
    tanggal,
    jam_mulai,
    jam_selesai,
    alasan,
    hariIni: getTanggalWITA(),
  });
  if (!validasi.valid) {
    return NextResponse.json({ pesan: validasi.pesan }, { status: 400 });
  }

  const { error } = await supabase.from("overtime_requests").insert({
    profile_id: user.id,
    tanggal,
    jam_mulai,
    jam_selesai,
    total_jam: hitungTotalJam(jam_mulai, jam_selesai),
    alasan: alasan.trim(),
    status: "Pending",
  });

  if (error) {
    console.error("[overtime POST] gagal insert:", error.message);
    return NextResponse.json({ pesan: "Gagal mengirim pengajuan lembur." }, { status: 500 });
  }
  return NextResponse.json({ pesan: "Pengajuan lembur dikirim." });
}
