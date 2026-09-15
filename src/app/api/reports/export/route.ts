import { NextResponse } from "next/server";
import { getProfileSaya } from "@/lib/supabase/auth";
import { ambilRekapKeterlambatan, ambilRekapLembur } from "@/lib/supabase/queries";
import { buatBufferExcel } from "@/lib/excel";
import { namaFileRekap } from "@/lib/time";

export async function GET(request: Request) {
  const profile = await getProfileSaya();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ pesan: "Hanya admin." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const mulai = searchParams.get("from") ?? "";
  const akhir = searchParams.get("to") ?? "";
  if (!mulai || !akhir) {
    return NextResponse.json({ pesan: "Filter periode wajib." }, { status: 400 });
  }

  const [late, ot] = await Promise.all([
    ambilRekapKeterlambatan(mulai, akhir),
    ambilRekapLembur(mulai, akhir),
  ]);

  const buffer = await buatBufferExcel(late, ot);
  const nama = namaFileRekap(mulai, akhir);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nama}"`,
    },
  });
}
