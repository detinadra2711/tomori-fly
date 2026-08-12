import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Panel } from "@/components/cards/Panel";
import { getAccount } from "@/lib/admin/accounts";
import { getCurrentUser } from "@/lib/supabase/auth";
import { ROLE_LABELS } from "@/lib/admin/types";
import { AccountActions } from "./AccountActions";
import { formatDateTime } from "@/lib/format";


export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [account, current] = await Promise.all([getAccount(id), getCurrentUser()]);
  if (!account) notFound();
  const isSelf = current?.id === account.id;

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <Panel className="p-5 sm:p-7">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-xs text-muted hover:text-primary"
        >
          <ArrowLeft className="size-4" /> Kembali ke daftar
        </Link>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-black/20 text-lg font-medium">
              {account.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <div>
              <h2 className="text-2xl font-normal">{account.name}</h2>
              <p className="text-sm text-muted">{account.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-black/20 px-3 py-1 text-xs text-primary">
              {ROLE_LABELS[account.role]}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs ${
                account.isActive
                  ? "bg-accent-green/12 text-accent-green"
                  : "bg-white/5 text-muted"
              }`}
            >
              {account.isActive ? "Aktif" : "Nonaktif"}
            </span>
          </div>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <Info label="Departemen" value={account.department ?? "-"} />
          <Info label="Peran" value={ROLE_LABELS[account.role]} />
          <Info label="Dibuat" value={formatDateTime(account.createdAt)} />
          <Info label="Diperbarui" value={formatDateTime(account.updatedAt)} />
        </dl>

        {isSelf ? (
          <p className="mt-6 rounded-2xl bg-accent-blue/12 px-4 py-3 text-xs text-accent-blue">
            Ini akun Anda sendiri. Beberapa aksi (ubah peran, nonaktifkan) dinonaktifkan untuk mencegah lockout.
          </p>
        ) : null}
      </Panel>

      <aside>
        <AccountActions account={account} isSelf={isSelf} />
      </aside>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-card)] bg-card p-4">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-primary">{value}</dd>
    </div>
  );
}
