"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, Pencil, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  resetPassword,
  setAccountActive,
} from "@/app/(dashboard)/admin/actions";
import type { AdminAccount } from "@/lib/admin/types";

export function AccountActions({
  account,
  isSelf,
}: {
  account: AdminAccount;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showReset, setShowReset] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [requireChange, setRequireChange] = useState(true);

  async function toggleActive() {
    setBusy(true);
    setError(null);
    setMessage(null);
    const result = await setAccountActive(account.id, !account.isActive);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    router.refresh();
  }

  async function sendResetEmail() {
    setBusy(true);
    setError(null);
    setMessage(null);
    const result = await resetPassword({ id: account.id, mode: "email" });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setMessage("Email reset password telah dikirim.");
  }

  async function setTemporary() {
    setBusy(true);
    setError(null);
    setMessage(null);
    const result = await resetPassword({
      id: account.id,
      mode: "temporary",
      password: tempPassword,
      requireChange,
    });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setMessage("Password sementara telah diterapkan.");
    setShowReset(false);
    setTempPassword("");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-card)] bg-card p-5 shadow-float">
        <p className="text-sm font-medium">Kelola akun</p>
        {error ? (
          <p className="mt-3 rounded-2xl bg-accent-red/12 px-3 py-2 text-xs text-accent-red">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="mt-3 rounded-2xl bg-accent-green/12 px-3 py-2 text-xs text-accent-green">
            {message}
          </p>
        ) : null}

        <div className="mt-4 space-y-2">
          <Link
            href={`/admin/users/${account.id}/edit`}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-card-hover text-sm font-medium text-primary hover:brightness-110"
          >
            <Pencil className="size-4" /> Edit akun
          </Link>

          <Button
            type="button"
            variant={account.isActive ? "danger" : "primary"}
            className="w-full"
            disabled={busy || (isSelf && account.isActive)}
            onClick={toggleActive}
            title={isSelf && account.isActive ? "Tidak dapat menonaktifkan akun sendiri" : undefined}
          >
            {account.isActive ? (
              <>
                <PowerOff /> Nonaktifkan
              </>
            ) : (
              <>
                <Power /> Aktifkan
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] bg-card p-5 shadow-float">
        <p className="text-sm font-medium">Reset password</p>
        <div className="mt-4 space-y-2">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={busy}
            onClick={sendResetEmail}
          >
            <KeyRound /> Kirim email reset
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={busy}
            onClick={() => setShowReset((v) => !v)}
          >
            Set password sementara
          </Button>
          {showReset ? (
            <div className="space-y-2 rounded-2xl bg-black/20 p-3">
              <Input
                type="text"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="Min. 8 karakter, huruf & angka"
              />
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={requireChange}
                  onChange={(e) => setRequireChange(e.target.checked)}
                  className="size-4 accent-green-500"
                />
                Wajib ganti saat login berikutnya
              </label>
              <Button type="button" className="w-full" disabled={busy} onClick={setTemporary}>
                Terapkan password
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
