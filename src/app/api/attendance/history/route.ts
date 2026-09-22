import { NextResponse } from "next/server";
import { buatKlienServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await buatKlienServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ pesan: "Tidak terautentikasi." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const semua = searchParams.get("semua") === "1";

  let q = supabase
    .from("attendance")
    .select("*")
    .order("tanggal", { ascending: false })
    .limit(200);
  if (!semua) q = q.eq("profile_id", user.id);
  if (from) q = q.gte("tanggal", from);
  if (to) q = q.lte("tanggal", to);

  const { data, error } = await q;
  if (error) {
    console.error("[attendance/history] gagal memuat:", error.message);
    return NextResponse.json({ pesan: "Gagal memuat riwayat absensi." }, { status: 500 });
  }
  return NextResponse.json({ data });
}
