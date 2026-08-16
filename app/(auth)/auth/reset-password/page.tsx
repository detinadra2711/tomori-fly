"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, Loader2, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

/**
 * Halaman tujuan link "reset password" dari email Supabase.
 * Supabase menaruh token pada URL hash dan membuat sesi recovery, sehingga
 * user dapat langsung menetapkan password baru di sini.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    // Sesi recovery dibuat Supabase dari token di URL.
    supabase.auth.getSession().then(({ data }) => {
      setValidSession(Boolean(data.session));
      setReady(true);
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password minimal 8 karakter dan mengandung huruf serta angka.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[var(--radius-panel)] bg-panel p-8 shadow-panel">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-accent-green text-[#0b2415] shadow-card">
            <Plane className="size-6" />
          </span>
          <h1 className="text-2xl font-normal text-primary">Atur Password Baru</h1>
          <p className="mt-1 text-sm text-muted">
            Masukkan password baru untuk akun Anda.
          </p>
        </div>

        {!ready ? (
          <p className="text-center text-sm text-muted">Memuat…</p>
        ) : done ? (
          <div className="space-y-4 text-center">
            <p className="rounded-2xl bg-accent-green/12 px-4 py-3 text-sm text-accent-green">
              Password berhasil diperbarui.
            </p>
            <Button type="button" size="lg" className="w-full" onClick={() => router.push("/login")}>
              Ke halaman login
            </Button>
          </div>
        ) : !validSession ? (
          <div className="space-y-4">
            <p className="rounded-2xl bg-accent-red/12 px-4 py-3 text-xs text-accent-red">
              Tautan reset tidak valid atau sudah kedaluwarsa. Minta admin
              mengirim ulang email reset password.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => router.push("/login")}
            >
              Kembali ke login
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-muted">
                Password baru
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 karakter, huruf & angka"
                  className="pr-11"
                  required
                />
                <PasswordVisibilityButton
                  visible={showPassword}
                  onToggle={() => setShowPassword((visible) => !visible)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirm" className="text-xs font-medium text-muted">
                Konfirmasi password
              </label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="pr-11"
                  required
                />
                <PasswordVisibilityButton
                  visible={showConfirm}
                  onToggle={() => setShowConfirm((visible) => !visible)}
                />
              </div>
            </div>

            {error ? (
              <p className="rounded-2xl bg-accent-red/12 px-4 py-2.5 text-xs text-accent-red">
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" className="w-full" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Menyimpan…
                </>
              ) : (
                <>
                  <KeyRound className="size-4" />
                  Simpan Password
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}

function PasswordVisibilityButton({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
      aria-pressed={visible}
      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:text-primary"
    >
      {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  );
}
