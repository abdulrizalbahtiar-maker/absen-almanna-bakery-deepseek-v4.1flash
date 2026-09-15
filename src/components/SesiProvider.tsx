"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Profile } from "@/types";
import { bacaCookie, COOKIE_SESI, hapusSesiMock, MOCK_MODE } from "@/lib/session";
import { getProfiles, resetStateMock } from "@/lib/mockStore";

interface SesiContextValue {
  profile: Profile | null;
  siap: boolean;
  mockMode: boolean;
  keluar: () => void;
}

const SesiContext = createContext<SesiContextValue>({
  profile: null,
  siap: false,
  mockMode: false,
  keluar: () => {},
});

const listeners = new Set<() => void>();
let cacheId: string | null | undefined = undefined;
let cacheProfil: Profile | null = null;

function bacaProfil(): Profile | null {
  if (typeof window === "undefined") return null;
  if (!MOCK_MODE) return null;
  const id = bacaCookie(COOKIE_SESI);
  if (id === cacheId) return cacheProfil;
  cacheId = id;
  cacheProfil = id ? (getProfiles().find((p) => p.id === id) ?? null) : null;
  return cacheProfil;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function beritahu() {
  cacheId = undefined;
  for (const l of listeners) l();
}

export function SesiProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const profile = useSyncExternalStore(
    subscribe,
    bacaProfil,
    () => null,
  );

  const keluar = useCallback(() => {
    hapusSesiMock();
    resetStateMock();
    beritahu();
    router.push("/login");
  }, [router]);

  const value = useMemo<SesiContextValue>(
    () => ({ profile, siap: true, mockMode: MOCK_MODE, keluar }),
    [profile, keluar],
  );

  return <SesiContext.Provider value={value}>{children}</SesiContext.Provider>;
}

export function useSesi() {
  return useContext(SesiContext);
}
