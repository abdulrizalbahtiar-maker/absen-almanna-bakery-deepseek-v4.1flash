import { NextResponse } from "next/server";
import { buatKlienServer } from "@/lib/supabase/server";
import { buatKlienAdmin } from "@/lib/supabase/admin";
import { catatLog } from "@/lib/activityLog";
import { hitungNominal, hitungTotalJam, validasiPengajuanLembur } from "@/lib/overtime";
import { getTanggalWITA } from "@/lib/time";

async function ambilPemilik(id: string) {
  const supabase = await buatKlienServer();
  const { data } = await supabase
    .from("overtime_requests")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function PUT(
  request: Request,
  { params }: RouteContext<"/api/overtime/[id]">,
) {
  const { id } = await params;
  const supabase = await buatKlienServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ pesan: "Tidak terautentikasi." }, { status: 401 });

  const item = await ambilPemilik(id);
  if (!item) return NextResponse.json({ pesan: "Tidak ditemukan." }, { status: 404 });
  if (item.profile_id !== user.id) {
    return NextResponse.json({ pesan: "Bukan milik Anda." }, { status: 403 });
  }
  if (item.status !== "Pending") {
    return NextResponse.json({ pesan: "Hanya Pending bisa diubah." }, { status: 400 });
  }

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

  const { error } = await supabase
    .from("overtime_requests")
    .update({
      tanggal,
      jam_mulai,
      jam_selesai,
      total_jam: hitungTotalJam(jam_mulai, jam_selesai),
      alasan: alasan.trim(),
    })
    .eq("id", id);

  if (error) {
    console.error("[overtime PUT] gagal update:", error.message);
    return NextResponse.json({ pesan: "Gagal memperbarui pengajuan." }, { status: 500 });
  }
  return NextResponse.json({ pesan: "Pengajuan diperbarui." });
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext<"/api/overtime/[id]">,
) {
  const { id } = await params;
  const supabase = await buatKlienServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ pesan: "Tidak terautentikasi." }, { status: 401 });

  const item = await ambilPemilik(id);
  if (!item) return NextResponse.json({ pesan: "Tidak ditemukan." }, { status: 404 });
  if (item.profile_id !== user.id && !(await cekAdmin(user.id))) {
    return NextResponse.json({ pesan: "Tidak diizinkan." }, { status: 403 });
  }
  if (item.status !== "Pending") {
    return NextResponse.json({ pesan: "Hanya Pending bisa dihapus." }, { status: 400 });
  }

  const { error } = await supabase.from("overtime_requests").delete().eq("id", id);
  if (error) {
    console.error("[overtime DELETE] gagal hapus:", error.message);
    return NextResponse.json({ pesan: "Gagal menghapus pengajuan." }, { status: 500 });
  }
  return NextResponse.json({ pesan: "Pengajuan dihapus." });
}

export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/overtime/[id]">,
) {
  const { id } = await params;
  const supabase = await buatKlienServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ pesan: "Tidak terautentikasi." }, { status: 401 });

  if (!(await cekAdmin(user.id))) {
    return NextResponse.json({ pesan: "Hanya admin." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const action = body?.action;
  const catatan = String(body?.catatan ?? "");

  if (action !== "Approve" && action !== "Reject") {
    return NextResponse.json({ pesan: "Action tidak valid." }, { status: 400 });
  }

  const item = await ambilPemilik(id);
  if (!item) return NextResponse.json({ pesan: "Tidak ditemukan." }, { status: 404 });
  if (item.status !== "Pending") {
    return NextResponse.json(
      { pesan: `Status ${item.status} final, tidak bisa diubah.` },
      { status: 400 },
    );
  }
  if (action === "Reject" && catatan.trim() === "") {
    return NextResponse.json({ pesan: "Catatan wajib untuk reject." }, { status: 400 });
  }

  const { data: pengaju } = await supabase
    .from("profiles")
    .select("tarif_lembur_per_jam")
    .eq("id", item.profile_id)
    .single();

  const nominal =
    action === "Approve"
      ? hitungNominal(item.total_jam, pengaju?.tarif_lembur_per_jam ?? 0)
      : 0;

  const { error } = await supabase
    .from("overtime_requests")
    .update({
      status: action === "Approve" ? "Approved" : "Rejected",
      approved_by: user.id,
      tanggal_persetujuan: getTanggalWITA(),
      catatan_admin: catatan.trim() || null,
      nominal,
    })
    .eq("id", id);

  if (error) {
    console.error("[overtime PATCH] gagal putuskan:", error.message);
    return NextResponse.json({ pesan: "Gagal memproses keputusan." }, { status: 500 });
  }

  await catatLog(user.id, action === "Approve" ? "approve_lembur" : "reject_lembur", id);

  return NextResponse.json({
    pesan: action === "Approve" ? "Lembur disetujui." : "Lembur ditolak.",
  });
}

async function cekAdmin(userId: string) {
  const admin = buatKlienAdmin();
  const { data } = await admin.from("profiles").select("role").eq("id", userId).single();
  return data?.role === "admin";
}
