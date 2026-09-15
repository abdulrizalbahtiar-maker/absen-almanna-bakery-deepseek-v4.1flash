"use client";

import { useEffect } from "react";

type Tipe = "sukses" | "error" | "info";

const tone: Record<Tipe, string> = {
  sukses: "bg-success-soft text-success border-success/30",
  error: "bg-danger-soft text-danger border-danger/30",
  info: "bg-primary-soft text-primary-dark border-primary/30",
};

export function Toast({
  pesan,
  tipe = "info",
  onTutup,
}: {
  pesan: string | null;
  tipe?: Tipe;
  onTutup: () => void;
}) {
  useEffect(() => {
    if (!pesan) return;
    const t = setTimeout(onTutup, 4000);
    return () => clearTimeout(t);
  }, [pesan, onTutup]);

  if (!pesan) return null;

  return (
    <div
      className={`fixed inset-x-4 bottom-4 z-50 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg sm:left-auto sm:right-4 sm:w-80 ${tone[tipe]}`}
      role="status"
    >
      {pesan}
    </div>
  );
}
