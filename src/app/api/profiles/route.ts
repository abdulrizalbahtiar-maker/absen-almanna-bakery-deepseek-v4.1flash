import { NextResponse } from "next/server";
import { ambilProfiles } from "@/lib/supabase/queries";
import { getProfileSaya } from "@/lib/supabase/auth";

export async function GET() {
  const profile = await getProfileSaya();
  if (!profile) return NextResponse.json({ pesan: "Tidak terautentikasi." }, { status: 401 });

  const semua = await ambilProfiles();
  // Karyawan hanya perlu data dirinya; admin perlu semua nama.
  const data =
    profile.role === "admin"
      ? semua.map((p) => ({ id: p.id, nama: p.nama, role: p.role }))
      : [{ id: profile.id, nama: profile.nama, role: profile.role }];

  return NextResponse.json({ data });
}
