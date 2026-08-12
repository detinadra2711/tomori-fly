"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, UserPlus } from "lucide-react";
import { Panel } from "@/components/cards/Panel";
import { SearchBar } from "@/components/shell/SearchBar";
import { ALL_ROLES, ROLE_LABELS, type AdminAccount } from "@/lib/admin/types";
import type { Role } from "@/types";

type RoleFilter = "ALL" | Role;
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

const ROLE_CHIP: Record<Role, string> = {
  admin: "bg-accent-red/12 text-accent-red",
  officer: "bg-accent-orange/12 text-accent-orange",
  travel_agent: "bg-accent-blue/12 text-accent-blue",
  user: "bg-white/5 text-muted",
};

export function AccountsList({ accounts, query }: { accounts: AdminAccount[]; query: string }) {
  const [role, setRole] = useState<RoleFilter>("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");

  const filtered = accounts.filter((a) => {
    const matchesRole = role === "ALL" || a.role === role;
    const matchesStatus =
      status === "ALL" || (status === "ACTIVE" ? a.isActive : !a.isActive);
    return matchesRole && matchesStatus;
  });

  const counts = ALL_ROLES.map((r) => ({
    role: r,
    count: accounts.filter((a) => a.role === r).length,
  }));
  const activeCount = accounts.filter((a) => a.isActive).length;

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
      <Panel className="min-w-0 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-accent-red">
              Administrasi
            </p>
            <h2 className="mt-1 text-2xl font-normal">Manajemen User</h2>
            <p className="mt-1 text-sm text-muted">
              Kelola akun untuk semua peran dalam sistem.
            </p>
          </div>
          <Link
            href="/admin/users/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-accent-green px-5 text-sm font-medium text-[#0b2415] shadow-card hover:brightness-110"
          >
            <UserPlus className="size-4" /> Akun Baru
          </Link>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_160px_150px]">
          <SearchBar basePath="/admin/users" initialQuery={query} placeholder="Cari nama atau email..." />
          <Select value={role} onChange={(v) => setRole(v as RoleFilter)}>
            <option value="ALL">Semua peran</option>
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(v) => setStatus(v as StatusFilter)}>
            <option value="ALL">Semua status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
          </Select>
        </div>

        <div className="mt-5 space-y-3">
          {filtered.map((a) => (
            <Link
              key={a.id}
              href={`/admin/users/${a.id}`}
              className="group grid gap-4 rounded-[var(--radius-card)] bg-card p-4 shadow-card transition-colors hover:bg-card-hover sm:grid-cols-[44px_1fr_auto] sm:items-center"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-black/20 text-sm font-medium text-primary">
                {initials(a.name)}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium">{a.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${ROLE_CHIP[a.role]}`}
                  >
                    {ROLE_LABELS[a.role]}
                  </span>
                  {!a.isActive ? (
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-muted">
                      Nonaktif
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 truncate text-xs text-muted">
                  {a.email}
                  {a.department ? ` · ${a.department}` : ""}
                </p>
              </div>
              <span className="flex items-center gap-2 text-xs text-muted group-hover:text-primary">
                Kelola <ArrowUpRight className="size-4" />
              </span>
            </Link>
          ))}
          {!filtered.length ? (
            <div className="rounded-[var(--radius-card)] bg-black/15 px-6 py-14 text-center text-sm text-muted">
              Tidak ada akun yang sesuai filter.
            </div>
          ) : null}
        </div>
      </Panel>

      <aside className="space-y-4">
        <Panel tone="detail" className="p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Ringkasan</p>
          <p className="mt-4 text-6xl font-thin text-primary">{accounts.length}</p>
          <p className="mt-1 text-xs text-muted">total akun · {activeCount} aktif</p>
          <div className="mt-6 space-y-2 text-xs">
            {counts.map((c) => (
              <div
                key={c.role}
                className="flex items-center justify-between rounded-2xl bg-black/15 px-3 py-2.5"
              >
                <span className="text-muted">{ROLE_LABELS[c.role]}</span>
                <span className="font-medium text-primary">{c.count}</span>
              </div>
            ))}
          </div>
        </Panel>
      </aside>
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 rounded-2xl bg-black/25 px-4 text-sm text-primary ring-1 ring-inset ring-white/10 outline-none focus:ring-2 focus:ring-accent-blue/60"
    >
      {children}
    </select>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
