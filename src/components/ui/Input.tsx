import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const dasar =
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary";

export function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-xs font-semibold text-ink-soft">{children}</span>;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={dasar} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={dasar} {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={dasar} {...props} />;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      {children}
    </label>
  );
}
