"use client";

import { useSyncExternalStore } from "react";
import { getVersiMock, subscribeMock } from "./mockStore";

/**
 * Berlangganan perubahan mockStore. Nilai balik berubah tiap kali store
 * disimpan, sehingga query turunan otomatis dihitung ulang.
 */
export function useMockVersi(): number {
  return useSyncExternalStore(
    subscribeMock,
    getVersiMock,
    () => 0,
  );
}
