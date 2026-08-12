import Link from "next/link";
import { ArrowUpRight, Eye } from "lucide-react";
import { Panel } from "@/components/cards/Panel";
import { StatCard } from "@/components/cards/StatCard";
import { StatusBadge } from "@/components/status/StatusBadge";
import { officerStats } from "@/lib/trips/stats";
import { recentOfficerRequests } from "@/lib/officer/requests";

export default async function OfficerDashboardPage() {
  const [stats, recent] = await Promise.all([
    officerStats(),
    recentOfficerRequests(6),
  ]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Menunggu Diketahui" value={stats.pending} accent="orange" hint="perlu tindakan Anda" />
        <StatCard label="Diketahui" value={stats.acknowledged} accent="green" hint="diteruskan ke agent" />
        <StatCard label="Total Pengajuan" value={stats.total} accent="blue" hint="semua yang dipantau" />
      </div>

      <Panel className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium">Perlu diketahui</h2>
            <p className="text-xs text-muted">Pengajuan terbaru yang dikirim pemohon.</p>
          </div>
          <Link href="/officer/requests" className="inline-flex items-center gap-1.5 text-xs text-accent-blue hover:underline">
            Lihat semua <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className="mt-4 space-y-2">
          {recent.map((trip) => (
            <Link
              key={trip.id}
              href={`/officer/requests/${trip.id}`}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] bg-card p-4 shadow-card transition-colors hover:bg-card-hover"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted">{trip.code}</span>
                  <StatusBadge status={trip.status} />
                </div>
                <p className="mt-1 truncate text-sm">{trip.purpose} · {trip.userName}</p>
              </div>
              {trip.status === "PENDING" ? <Eye className="size-4 shrink-0 text-accent-orange" /> : null}
            </Link>
          ))}
          {!recent.length ? (
            <p className="rounded-[var(--radius-card)] bg-black/15 px-6 py-10 text-center text-sm text-muted">Belum ada pengajuan.</p>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
