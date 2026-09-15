"use client";

import dynamic from "next/dynamic";
import type { OfficeMapProps } from "./OfficeMap";

const OfficeMap = dynamic<OfficeMapProps>(() => import("./OfficeMap"), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full rounded-2xl border border-border bg-primary-soft sm:h-80" />
  ),
});

export default OfficeMap;
