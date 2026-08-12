import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Panel } from "@/components/cards/Panel";
import { StatCard } from "@/components/cards/StatCard";
import { StatusBadge } from "@/components/status/StatusBadge";
import { agentStats } from "@/lib/trips/stats";
import { recentAgentQueue } from "@/lib/travel-agent/bookings";

export default async function AgentDashboardPage() {
  const [stats, queue] = await Promise.all([
    agentStats(),
    recentAgentQueue(6),
  ]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Siap Diproses" value={stats.queue} accent="blue" hint="menunggu booking" />
        <StatCard label="Terbooking" value={stats.booked} accent="green" hint="selesai diproses" />
        <StatCard label="Dikembalikan" value={stats.returned} accent="orange" hint="butuh perbaikan user" />
      </div>

      <Panel className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium">Antrian booking</h2>
            <p className="text-xs text-muted">Pengajuan yang siap Anda proses.</p>
          </div>
          <Link href="/travel-agent/bookings" className="inline-flex items-center gap-1.5 text-xs text-accent-blue hover:underline">
            Lihat semua <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className="mt-4 space-y-2">
          {queue.map((trip) => (
            <Link
              key={trip.id}
              href={`/travel-agent/bookings/${trip.id}`}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] bg-card p-4 shadow-card transition-colors hover:bg-card-hover"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted">{trip.code}</span>
                  <StatusBadge status={trip.status} />
                </div>
                <p className="mt-1 truncate text-sm">{trip.purpose} · {trip.userName}</p>
              </div>
              <ArrowUpRight className="size-4 shrink-0 text-muted" />
            </Link>
          ))}
          {!queue.length ? (
            <p className="rounded-[var(--radius-card)] bg-black/15 px-6 py-10 text-center text-sm text-muted">Tidak ada antrian saat ini.</p>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
