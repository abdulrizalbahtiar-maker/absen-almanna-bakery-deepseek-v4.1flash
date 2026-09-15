import type { ReactNode } from "react";

type Nada = "netral" | "sukses" | "bahaya" | "peringatan";

const nada: Record<Nada, string> = {
  netral: "bg-primary-soft text-primary-dark",
  sukses: "bg-success-soft text-success",
  bahaya: "bg-danger-soft text-danger",
  peringatan: "bg-primary-soft text-primary-dark",
};

export function Badge({
  children,
  tone = "netral",
}: {
  children: ReactNode;
  tone?: Nada;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${nada[tone]}`}
    >
      {children}
    </span>
  );
}
