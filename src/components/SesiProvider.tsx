"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import type { Profile } from "@/types";
import { buatKlienBrowser } from "@/lib/supabase/client";
import { logoutSupabase } from "@/lib/otentikasi";

interface SesiContextValue {
  profile: Profile | null;
  siap: boolean;
  keluar: () => void;
}

const SesiContext = createContext<SesiContextValue>({
  profile: null,
  siap: false,
  keluar: () => {},
});

export function SesiProvider({
  profileAwal,
  children,
}: {
  profileAwal: Profile | null;
  children: ReactNode;
}) {
  const router = useRouter();

  // Profil bersumber dari server (prop). Saat login/logout, router.refresh()
  // mengirim prop terbaru; tidak ada state lokal yang bisa basi.
  useEffect(() => {
    const supabase = buatKlienBrowser();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        router.refresh();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  const keluar = useCallback(async () => {
    await logoutSupabase();
    router.push("/login");
    router.refresh();
  }, [router]);

  const value = useMemo<SesiContextValue>(
    () => ({ profile: profileAwal, siap: true, keluar }),
    [profileAwal, keluar],
  );

  return <SesiContext.Provider value={value}>{children}</SesiContext.Provider>;
}

export function useSesi() {
  return useContext(SesiContext);
}
