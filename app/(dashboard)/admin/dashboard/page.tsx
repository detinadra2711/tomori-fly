import Link from "next/link";
import { ArrowUpRight, Database, Users } from "lucide-react";
import { StatCard } from "@/components/cards/StatCard";
import { accountStats } from "@/lib/admin/accounts";
import { adminRequestStats } from "@/lib/trips/stats";

export default async function AdminDashboardPage() {
  const [accounts, requests] = await Promise.all([
    accountStats(),
    adminRequestStats(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Akun</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Akun" value={accounts.total} accent="blue" />
          <StatCard label="Akun Aktif" value={accounts.active} accent="green" />
          <StatCard label="Administrator" value={accounts.admins} accent="orange" />
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Pengajuan</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-4">
          <StatCard label="Total" value={requests.totalRequests} accent="blue" />
          <StatCard label="Menunggu" value={requests.pending} accent="orange" />
          <StatCard label="Diketahui" value={requests.acknowledged} accent="green" />
          <StatCard label="Terbooking" value={requests.booked} accent="green" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/users" className="group flex items-center justify-between rounded-[var(--radius-card)] bg-card p-5 shadow-card transition-colors hover:bg-card-hover">
          <span className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-black/20 text-accent-blue"><Users className="size-5" /></span>
            <span>
              <span className="block text-sm font-medium">Manajemen User</span>
              <span className="block text-xs text-muted">Kelola akun & peran</span>
            </span>
          </span>
          <ArrowUpRight className="size-4 text-muted group-hover:text-primary" />
        </Link>
        <Link href="/admin/master" className="group flex items-center justify-between rounded-[var(--radius-card)] bg-card p-5 shadow-card transition-colors hover:bg-card-hover">
          <span className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-black/20 text-accent-orange"><Database className="size-5" /></span>
            <span>
              <span className="block text-sm font-medium">Master Data</span>
              <span className="block text-xs text-muted">Maskapai & kota</span>
            </span>
          </span>
          <ArrowUpRight className="size-4 text-muted group-hover:text-primary" />
        </Link>
      </div>
    </div>
  );
}
