import type { ButtonHTMLAttributes } from "react";

type Varian = "primary" | "outline" | "danger" | "ghost";

const gaya: Record<Varian, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-dark disabled:opacity-50",
  outline:
    "border border-border bg-surface text-ink hover:bg-primary-soft disabled:opacity-50",
  danger: "bg-danger text-white hover:opacity-90 disabled:opacity-50",
  ghost: "text-ink-soft hover:bg-primary-soft",
};

export function Button({
  varian = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { varian?: Varian }) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed ${gaya[varian]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
