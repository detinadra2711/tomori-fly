"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { acknowledgeTrip } from "@/app/(dashboard)/officer/actions";

export function AcknowledgeAction({
  tripId,
  canAcknowledge,
  hasPassphrase,
}: {
  tripId: string;
  canAcknowledge: boolean;
  hasPassphrase: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState("");

  async function run() {
    if (!passphrase.trim()) {
      setError("Passphrase wajib diisi.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await acknowledgeTrip(tripId, passphrase);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setPassphrase("");
    router.refresh();
  }

  if (!canAcknowledge) return null;

  return (
    <div className="rounded-[var(--radius-card)] bg-card p-5 shadow-float">
      <p className="text-sm font-medium">Tandai telah diketahui</p>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Masukkan passphrase Anda untuk menandai pengajuan ini telah diketahui,
        lalu diteruskan ke Travel Agent.
      </p>

      {!hasPassphrase ? (
        <div className="mt-3 rounded-2xl bg-accent-orange/12 px-3 py-2.5 text-xs text-accent-orange">
          Anda belum mengatur passphrase.{" "}
          <Link href="/profile" className="font-medium underline">
            Atur di Profil
          </Link>{" "}
          terlebih dahulu.
        </div>
      ) : (
        <label className="mt-4 block space-y-1.5">
          <span className="text-xs font-medium text-muted">Passphrase</span>
          <div className="relative">
            <ShieldCheck className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Passphrase Officer"
              className="pl-11"
              autoComplete="off"
            />
          </div>
        </label>
      )}

      {error ? (
        <p className="mt-3 rounded-2xl bg-accent-red/12 px-3 py-2 text-xs text-accent-red">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        className="mt-4 w-full"
        disabled={busy || !hasPassphrase}
        onClick={run}
      >
        <Eye /> {busy ? "Memproses…" : "Mengetahui"}
      </Button>
    </div>
  );
}
