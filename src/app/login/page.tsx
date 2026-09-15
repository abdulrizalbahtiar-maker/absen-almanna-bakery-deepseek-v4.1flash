"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { loginSupabase } from "@/lib/otentikasi";

export default function LoginPage() {
  const router = useRouter();
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
    router.push("/dashboard");
    router.refresh();
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
