"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Panel } from "@/components/cards/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createAccount, updateAccount } from "@/app/(dashboard)/admin/actions";
import { ALL_ROLES, ROLE_LABELS, type AdminAccount } from "@/lib/admin/types";
import type { Role } from "@/types";

export function AccountForm({ account }: { account?: AdminAccount }) {
  const router = useRouter();
  const editing = Boolean(account);

  const [name, setName] = useState(account?.name ?? "");
  const [email, setEmail] = useState(account?.email ?? "");
  const [department, setDepartment] = useState(account?.department ?? "");
  const [role, setRole] = useState<Role>(account?.role ?? "user");
  const [mode, setMode] = useState<"password" | "invite">("password");
  const [password, setPassword] = useState("");
  const [requireChange, setRequireChange] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    setError(null);
    setErrorField(undefined);

    let targetId: string;
    if (editing) {
      const result = await updateAccount({
        id: account!.id,
        name,
        email,
        department: department.trim() || null,
        role,
      });
      if (!result.ok) {
        setError(result.error);
        setErrorField(result.field);
        setSaving(false);
        return;
      }
      targetId = account!.id;
    } else {
      const result = await createAccount({
        name,
        email,
        role,
        department: department.trim() || undefined,
        provisioning:
          mode === "password"
            ? { mode: "password", password, requireChange }
            : { mode: "invite" },
      });
      if (!result.ok) {
        setError(result.error);
        setErrorField(result.field);
        setSaving(false);
        return;
      }
      targetId = result.data.id;
    }

    router.push(`/admin/users/${targetId}`);
    router.refresh();
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
      <Panel className="p-5 sm:p-7">
        <Link
          href={editing ? `/admin/users/${account!.id}` : "/admin/users"}
          className="inline-flex items-center gap-2 text-xs text-muted hover:text-primary"
        >
          <ArrowLeft className="size-4" /> Kembali
        </Link>
        <h2 className="mt-4 text-2xl font-normal">
          {editing ? "Edit Akun" : "Buat Akun Baru"}
        </h2>

        <Section number="01" title="Identitas">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nama lengkap" invalid={errorField === "name"}>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama pengguna" />
            </Field>
            <Field label="Departemen (opsional)">
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Finance" />
            </Field>
            <Field label="Email" className="sm:col-span-2" invalid={errorField === "email"}>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@company.com" />
            </Field>
          </div>
        </Section>

        <Section number="02" title="Peran">
          <div className="grid gap-3 sm:grid-cols-2">
            {ALL_ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "rounded-2xl p-4 text-left text-sm transition-colors",
                  role === r ? "bg-panel-detail ring-2 ring-accent-green/60" : "bg-card hover:bg-card-hover"
                )}
              >
                <span className="font-medium">{ROLE_LABELS[r]}</span>
              </button>
            ))}
          </div>
          {errorField === "role" ? (
            <p className="mt-2 text-xs text-accent-red">{error}</p>
          ) : null}
        </Section>

        {!editing ? (
          <Section number="03" title="Kredensial">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMode("password")}
                className={cn(
                  "rounded-2xl p-4 text-left text-sm transition-colors",
                  mode === "password" ? "bg-panel-detail ring-2 ring-accent-green/60" : "bg-card hover:bg-card-hover"
                )}
              >
                <span className="block font-medium">Set password awal</span>
                <span className="block text-xs text-muted">Admin menentukan password</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("invite")}
                className={cn(
                  "rounded-2xl p-4 text-left text-sm transition-colors",
                  mode === "invite" ? "bg-panel-detail ring-2 ring-accent-green/60" : "bg-card hover:bg-card-hover"
                )}
              >
                <span className="block font-medium">Kirim undangan email</span>
                <span className="block text-xs text-muted">User set password sendiri</span>
              </button>
            </div>
            {mode === "password" ? (
              <div className="mt-3 space-y-3">
                <Field label="Password awal" invalid={errorField === "password"}>
                  <Input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 karakter, huruf & angka"
                  />
                </Field>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={requireChange}
                    onChange={(e) => setRequireChange(e.target.checked)}
                    className="size-4 accent-green-500"
                  />
                  Wajib ganti password saat login pertama
                </label>
              </div>
            ) : (
              <p className="mt-3 rounded-2xl bg-black/20 p-3 text-xs text-muted">
                Undangan akan dikirim ke email. Pastikan SMTP Supabase aktif.
              </p>
            )}
          </Section>
        ) : null}

        {error && errorField !== "role" ? (
          <p className="mt-6 rounded-2xl bg-accent-red/12 px-4 py-3 text-sm text-accent-red">
            {error}
          </p>
        ) : null}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href={editing ? `/admin/users/${account!.id}` : "/admin/users"}
            className="inline-flex h-10 items-center justify-center rounded-full px-5 text-sm text-muted ring-1 ring-inset ring-white/15 hover:bg-white/5"
          >
            Batal
          </Link>
          <Button type="button" disabled={saving} onClick={submit}>
            {saving ? "Menyimpan…" : editing ? "Simpan Perubahan" : "Buat Akun"}
          </Button>
        </div>
      </Panel>

      <aside className="space-y-4">
        <div className="rounded-[var(--radius-card)] bg-card p-5 shadow-float">
          <p className="text-sm font-medium">Catatan</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {editing
              ? "Perubahan email memperbarui akun autentikasi. Anda tidak dapat mengubah peran akun sendiri."
              : "Akun langsung aktif. Password awal ditampilkan agar dapat disampaikan ke pengguna secara aman."}
          </p>
        </div>
      </aside>
    </div>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-3">
        <span className="font-mono text-xs text-accent-green">{number}</span>
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  className,
  invalid,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  invalid?: boolean;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className={cn("text-xs font-medium", invalid ? "text-accent-red" : "text-muted")}>
        {label}
      </span>
      {children}
    </label>
  );
}
