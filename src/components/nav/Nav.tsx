"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSesi } from "@/components/SesiProvider";

const MENU = [
  { href: "/dashboard", label: "Dashboard", adminSaja: false },
  { href: "/attendance", label: "Absen", adminSaja: false },
  { href: "/overtime", label: "Lembur", adminSaja: false },
  { href: "/reports", label: "Rekap", adminSaja: false },
  { href: "/settings", label: "Pengaturan", adminSaja: true },
];

export function TopBar() {
  const { profile, keluar } = useSesi();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-primary">Al Manna Bakery</p>
          <p className="truncate text-xs text-ink-soft">
            {profile?.nama} · {profile?.role}
          </p>
        </div>
        <nav className="hidden gap-1 sm:flex">
          {MENU.filter((m) => !m.adminSaja || profile?.role === "admin").map((m) => {
            const aktif = pathname === m.href;
            return (
              <Link
                key={m.href}
                href={m.href}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  aktif ? "bg-primary-soft text-primary-dark" : "text-ink-soft hover:bg-primary-soft"
                }`}
              >
                {m.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={keluar}
          className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-danger-soft hover:text-danger"
        >
          Keluar
        </button>
      </div>
    </header>
  );
}

export function BottomNav() {
  const { profile } = useSesi();
  const pathname = usePathname();
  const menu = MENU.filter((m) => !m.adminSaja || profile?.role === "admin");

  return (
    <nav className="sticky bottom-0 z-20 border-t border-border bg-surface sm:hidden">
      <div className="flex">
        {menu.map((m) => {
          const aktif = pathname === m.href;
          return (
            <Link
              key={m.href}
              href={m.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold ${
                aktif ? "text-primary" : "text-ink-soft"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${aktif ? "bg-primary" : "bg-transparent"}`} />
              {m.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
