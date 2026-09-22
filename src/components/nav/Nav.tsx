"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useSesi } from "@/components/SesiProvider";

interface MenuItem {
  href: string;
  label: string;
  adminSaja: boolean;
  ikon: ReactNode;
}

function Ikon({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 sm:h-4 sm:w-4"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const MENU: MenuItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    adminSaja: false,
    ikon: <Ikon d="M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10" />,
  },
  {
    href: "/attendance",
    label: "Absen",
    adminSaja: false,
    ikon: <Ikon d="M12 21s7-6.4 7-11a7 7 0 10-14 0c0 4.6 7 11 7 11zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />,
  },
  {
    href: "/overtime",
    label: "Lembur",
    adminSaja: false,
    ikon: <Ikon d="M12 8v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z" />,
  },
  {
    href: "/reports",
    label: "Rekap",
    adminSaja: true,
    ikon: <Ikon d="M4 20V4m0 16h16M8 16V9m4 7V6m4 10v-4" />,
  },
  {
    href: "/settings",
    label: "Atur",
    adminSaja: true,
    ikon: <Ikon d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-2.9 1.2v.2a2 2 0 11-4 0v-.1a1.7 1.7 0 00-2.9-1.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.7 1.7 0 003.6 15H3.4a2 2 0 110-4h.1a1.7 1.7 0 001.3-2.9l-.1-.1a2 2 0 112.8-2.8l.1.1A1.7 1.7 0 0010.5 4v-.2a2 2 0 114 0V4a1.7 1.7 0 002.9 1.3l.1-.1a2 2 0 112.8 2.8l-.1.1A1.7 1.7 0 0020.4 11h.2a2 2 0 110 4h-.2a1.7 1.7 0 00-1 .7z" />,
  },
];

export function TopBar() {
  const { profile, keluar } = useSesi();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
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
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  aktif ? "bg-primary-soft text-primary-dark" : "text-ink-soft hover:bg-primary-soft"
                }`}
              >
                {m.ikon}
                {m.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={keluar}
          className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft transition hover:bg-danger-soft hover:text-danger"
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
    <nav
      className="sticky bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex">
        {menu.map((m) => {
          const aktif = pathname === m.href;
          return (
            <Link
              key={m.href}
              href={m.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold transition ${
                aktif ? "text-primary" : "text-ink-soft"
              }`}
            >
              {m.ikon}
              {m.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
