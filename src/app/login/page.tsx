"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { loginSupabase } from "@/lib/otentikasi";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function masuk() {
    setError(null);
    setLoading(true);
    const hasil = await loginSupabase(email, password);
    if (!hasil.sukses) {
      setError(hasil.pesan ?? "Login gagal.");
      setLoading(false);
      return;
    }
    // Hard navigation: pastikan server render ulang dengan cookie sesi terbaru.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/dashboard";
    return;
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-lg font-extrabold text-primary">Absensi Al Manna</h1>
        <p className="mb-6 text-xs text-ink-soft">Masuk dengan email & password</p>

        <label className="mb-1 block text-xs font-semibold text-ink-soft">Email</label>
        <Input
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="mt-3 mb-1 block text-xs font-semibold text-ink-soft">Password</label>
        <Input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") masuk();
          }}
        />

        {error && <p className="mt-2 text-xs font-semibold text-danger">{error}</p>}

        <Button className="mt-4 w-full" onClick={masuk} disabled={loading}>
          {loading ? (
            <>
              <Spinner ukuran="sm" /> Masuk…
            </>
          ) : (
            "Masuk"
          )}
        </Button>
      </div>
    </main>
  );
}
