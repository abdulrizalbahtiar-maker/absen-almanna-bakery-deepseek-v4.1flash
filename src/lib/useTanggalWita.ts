"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getTanggalWITA } from "./time";

function subscribe(callback: () => void) {
  // Deteksi pergantian hari (cek tiap menit) tanpa setState di effect.
  const id = setInterval(callback, 60_000);
  return () => clearInterval(id);
}

/**
 * Tanggal WITA yang aman untuk hidrasi.
 * Snapshot server = null (tidak mencetak tanggal), snapshot client = tanggal WITA.
 * React memakai snapshot server saat hidrasi, lalu beralih ke client — tanpa
 * mismatch dan tanpa setState di dalam effect.
 */
export function useTanggalWita(): string | null {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => getTanggalWITA(),
    () => null,
  );
  return useMemo(() => snapshot, [snapshot]);
}
