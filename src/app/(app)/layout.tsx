import type { ReactNode } from "react";
import { SesiProvider } from "@/components/SesiProvider";
import { AppShell } from "@/components/nav/AppShell";
import { getProfileSaya } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Profil diambil di server hanya untuk route terproteksi,
  // sehingga route publik (/login) tidak ikut melakukan query.
  const profile = await getProfileSaya();

  return (
    <SesiProvider profileAwal={profile}>
      <AppShell>{children}</AppShell>
    </SesiProvider>
  );
}
