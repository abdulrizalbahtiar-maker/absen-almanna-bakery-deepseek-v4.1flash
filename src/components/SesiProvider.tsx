"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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
  const [profile, setProfile] = useState<Profile | null>(profileAwal);

  useEffect(() => {
    const supabase = buatKlienBrowser();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setProfile(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const keluar = useCallback(async () => {
    await logoutSupabase();
    setProfile(null);
    router.push("/login");
  }, [router]);

  const value = useMemo<SesiContextValue>(
    () => ({ profile, siap: true, keluar }),
    [profile, keluar],
  );

  return <SesiContext.Provider value={value}>{children}</SesiContext.Provider>;
}

export function useSesi() {
  return useContext(SesiContext);
}
