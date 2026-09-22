"use client";

import type { ReactNode } from "react";
import { useSesi } from "@/components/SesiProvider";
import { BottomNav, TopBar } from "@/components/nav/Nav";

export function AppShell({ children }: { children: ReactNode }) {
  const { profile } = useSesi();

  if (!profile) {
    return (
      <main className="flex flex-1 items-center justify-center p-4">
        <a href="/login" className="text-sm font-semibold text-primary">
          Sesi tidak ditemukan. Masuk
        </a>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-24 sm:pb-8">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
