"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Save, ShieldCheck } from "lucide-react";
import { Panel } from "@/components/cards/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  changeOwnPassword,
  updateOwnProfile,
} from "@/app/(dashboard)/profile/actions";
import { setPassphrase } from "@/app/(dashboard)/officer/actions";
import { requiresTravelCodes, showsTravelCodes } from "@/lib/profile/fields";
import { ROLE_LABELS } from "@/lib/admin/types";
import type { User } from "@/types";

export function ProfileForm({
  user,
  passphraseSet = false,
}: {
  user: User;
  passphraseSet?: boolean;
}) {
  const router = useRouter();
  const usesCodes = showsTravelCodes(user.role);
  const codesRequired = requiresTravelCodes(user.role);
  const isOfficer = user.role === "officer";

  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [gff, setGff] = useState(user.gffCode ?? "");
  const [bff, setBff] = useState(user.bffCode ?? "");

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileField, setProfileField] = useState<string | undefined>();
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [savingPass, setSavingPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passMsg, setPassMsg] = useState<string | null>(null);

  async function savePassphrase() {
    setSavingPass(true);
    setPassError(null);
    setPassMsg(null);
    if (pass1 !== pass2) {
      setSavingPass(false);
      setPassError("Konfirmasi passphrase tidak cocok.");
      return;
    }
    const result = await setPassphrase(pass1);
    setSavingPass(false);
    if (!result.ok) {
      setPassError(result.error);
      return;
    }
    setPass1("");
    setPass2("");
    setPassMsg("Passphrase berhasil disimpan.");
    router.refresh();
  }

  async function saveProfile() {
    setSavingProfile(true);
    setProfileError(null);
    setProfileField(undefined);
    setProfileMsg(null);
    const result = await updateOwnProfile({
      name,
      phone,
      gffCode: usesCodes ? gff : undefined,
      bffCode: usesCodes ? bff : undefined,
    });
    setSavingProfile(false);
    if (!result.ok) {
      setProfileError(result.error);
      setProfileField(result.field);
      return;
    }
    setProfileMsg("Profil berhasil disimpan.");
    router.refresh();
  }

  async function savePassword() {
    setSavingPw(true);
    setPwError(null);
    setPwMsg(null);
    if (password !== confirm) {
      setSavingPw(false);
      setPwError("Konfirmasi password tidak cocok.");
      return;
    }
    const result = await changeOwnPassword(password);
    setSavingPw(false);
    if (!result.ok) {
      setPwError(result.error);
      return;
    }
    setPassword("");
    setConfirm("");
    setPwMsg("Password berhasil diperbarui.");
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <Panel className="p-5 sm:p-7">
        <p className="text-xs uppercase tracking-[0.18em] text-accent-green">
          Akun saya
        </p>
        <h2 className="mt-1 text-2xl font-normal">Profil</h2>
        <p className="mt-1 text-sm text-muted">
          Lengkapi data diri Anda. Email &amp; peran dikelola oleh admin.
        </p>

        <section className="mt-8">
          <SectionTitle number="01" title="Data diri" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nama lengkap" invalid={profileField === "name"}>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" />
            </Field>
            <Field label="Nomor HP" invalid={profileField === "phone"}>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
            </Field>
            {usesCodes ? (
              <>
                <Field
                  label={codesRequired ? "Kode GFF" : "Kode GFF (opsional)"}
                  invalid={profileField === "gffCode"}
                >
                  <Input value={gff} onChange={(e) => setGff(e.target.value)} placeholder="Kode GFF" />
                </Field>
                <Field
                  label={codesRequired ? "Kode Cabin Crew" : "Kode Cabin Crew (opsional)"}
                  invalid={profileField === "bffCode"}
                >
                  <Input value={bff} onChange={(e) => setBff(e.target.value)} placeholder="Kode Cabin Crew" />
                </Field>
              </>
            ) : null}
          </div>

          {profileError ? (
            <p className="mt-4 rounded-2xl bg-accent-red/12 px-4 py-3 text-sm text-accent-red">
              {profileError}
            </p>
          ) : null}
          {profileMsg ? (
            <p className="mt-4 rounded-2xl bg-accent-green/12 px-4 py-3 text-sm text-accent-green">
              {profileMsg}
            </p>
          ) : null}

          <div className="mt-6 flex justify-end">
            <Button type="button" disabled={savingProfile} onClick={saveProfile}>
              <Save /> {savingProfile ? "Menyimpan…" : "Simpan Profil"}
            </Button>
          </div>
        </section>

        <section className="mt-10">
          <SectionTitle number="02" title="Ganti password" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Password baru">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 karakter, huruf & angka"
                autoComplete="new-password"
              />
            </Field>
            <Field label="Konfirmasi password">
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Ulangi password baru"
                autoComplete="new-password"
              />
            </Field>
          </div>

          {pwError ? (
            <p className="mt-4 rounded-2xl bg-accent-red/12 px-4 py-3 text-sm text-accent-red">
              {pwError}
            </p>
          ) : null}
          {pwMsg ? (
            <p className="mt-4 rounded-2xl bg-accent-green/12 px-4 py-3 text-sm text-accent-green">
              {pwMsg}
            </p>
          ) : null}

          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              variant="secondary"
              disabled={savingPw || !password || !confirm}
              onClick={savePassword}
            >
              <KeyRound /> {savingPw ? "Menyimpan…" : "Perbarui Password"}
            </Button>
          </div>
        </section>

        {isOfficer ? (
          <section className="mt-10">
            <SectionTitle number="03" title="Passphrase Mengetahui" />
            <p className="-mt-1 mb-3 text-xs leading-relaxed text-muted">
              Passphrase terpisah dari password login, wajib dimasukkan setiap
              kali Anda menandai pengajuan sebagai diketahui.{" "}
              {passphraseSet ? (
                <span className="text-accent-green">Passphrase sudah diatur.</span>
              ) : (
                <span className="text-accent-orange">Belum diatur.</span>
              )}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={passphraseSet ? "Passphrase baru" : "Passphrase"}>
                <Input
                  type="password"
                  value={pass1}
                  onChange={(e) => setPass1(e.target.value)}
                  placeholder="Min. 6 karakter"
                  autoComplete="off"
                />
              </Field>
              <Field label="Konfirmasi passphrase">
                <Input
                  type="password"
                  value={pass2}
                  onChange={(e) => setPass2(e.target.value)}
                  placeholder="Ulangi passphrase"
                  autoComplete="off"
                />
              </Field>
            </div>

            {passError ? (
              <p className="mt-4 rounded-2xl bg-accent-red/12 px-4 py-3 text-sm text-accent-red">
                {passError}
              </p>
            ) : null}
            {passMsg ? (
              <p className="mt-4 rounded-2xl bg-accent-green/12 px-4 py-3 text-sm text-accent-green">
                {passMsg}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                variant="secondary"
                disabled={savingPass || !pass1 || !pass2}
                onClick={savePassphrase}
              >
                <ShieldCheck />{" "}
                {savingPass
                  ? "Menyimpan…"
                  : passphraseSet
                    ? "Ganti Passphrase"
                    : "Simpan Passphrase"}
              </Button>
            </div>
          </section>
        ) : null}
      </Panel>

      <aside className="space-y-4">
        <Panel tone="detail" className="p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Akun</p>
          <div className="mt-4 flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-black/20 text-lg font-medium">
              {user.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
          <div className="mt-5 space-y-2 text-xs">
            <Row label="Email" value={user.email} />
            {user.department ? <Row label="Departemen" value={user.department} /> : null}
          </div>
        </Panel>
        <div className="rounded-[var(--radius-card)] bg-card p-5 shadow-float">
          <p className="text-sm font-medium">Catatan</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {codesRequired
              ? "Kode GFF & Cabin Crew wajib dilengkapi agar pengajuan perjalanan Anda dapat diproses."
              : "Email dan peran hanya dapat diubah oleh admin."}
          </p>
        </div>
      </aside>
    </div>
  );
}

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="font-mono text-xs text-accent-green">{number}</span>
      <h3 className="text-sm font-medium">{title}</h3>
    </div>
  );
}

function Field({
  label,
  children,
  invalid,
}: {
  label: string;
  children: React.ReactNode;
  invalid?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className={cn("text-xs font-medium", invalid ? "text-accent-red" : "text-muted")}>
        {label}
      </span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-black/15 px-3 py-2.5">
      <span className="text-muted">{label}</span>
      <span className="max-w-[60%] truncate font-medium text-primary">{value}</span>
    </div>
  );
}
