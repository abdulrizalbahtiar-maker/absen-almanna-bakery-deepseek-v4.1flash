import { NextResponse } from "next/server";
import { ambilSettings } from "@/lib/supabase/queries";

export async function GET() {
  const settings = await ambilSettings();
  if (!settings) return NextResponse.json({ pesan: "Belum diatur." }, { status: 404 });
  return NextResponse.json({ data: settings });
}
