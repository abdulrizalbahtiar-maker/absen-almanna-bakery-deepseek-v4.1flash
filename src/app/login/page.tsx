"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { getProfiles } from "@/lib/mockStore";
import { setSesiMock } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [profiles] = useState(() => getProfiles());
  const [id, setId] = useState("");
  const [error, setError] = useState<string | null>(null);

  function masuk() {
    const p = profiles.find((x) => x.id === id);
    if (!p) {
      setError("Pilih akun.");
      return;
    }
    setSesiMock(p.id, p.role);
    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-lg font-extrabold text-primary">Absensi Al Manna</h1>
        <p className="mb-6 text-xs text-ink-soft">Mode simulasi</p>

        <label className="mb-1 block text-xs font-semibold text-ink-soft">Akun</label>
        <Select value={id} onChange={(e) => setId(e.target.value)}>
          <option value="">-- pilih akun --</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama} ({p.role})
            </option>
          ))}
        </Select>

        {error && <p className="mt-2 text-xs font-semibold text-danger">{error}</p>}

        <Button className="mt-4 w-full" onClick={masuk}>
          Masuk
        </Button>
      </div>
    </main>
  );
}
