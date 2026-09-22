"use client";

import dynamic from "next/dynamic";
import type { OfficeMapProps } from "./OfficeMap";

const OfficeMap = dynamic<OfficeMapProps>(() => import("./OfficeMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-border bg-primary-soft text-sm font-semibold text-ink-soft sm:h-80">
      Memuat peta…
    </div>
  ),
});

export default OfficeMap;
