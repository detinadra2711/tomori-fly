"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, CalendarDays, Plane } from "lucide-react";
import { Panel } from "@/components/cards/Panel";
import { StatusBadge } from "@/components/status/StatusBadge";
import { SearchBar } from "@/components/shell/SearchBar";
import { ExportButton } from "@/components/shell/ExportButton";
import type { TripRequest, TripStatus } from "@/types";

type StatusFilter = "ALL" | TripStatus;

export function RequestsMonitor({ trips, query }: { trips: TripRequest[]; query: string }) {
  const [status, setStatus] = useState<StatusFilter>("ALL");

  const filtered = trips.filter((t) => {
    return status === "ALL" || t.status === status;
  });

  const waiting = trips.filter((t) => t.status === "PENDING").length;
  const acknowledged = trips.filter((t) => t.status === "ACKNOWLEDGED").length;
  const booked = trips.filter((t) => t.status === "BOOKED").length;

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
      <Panel className="min-w-0 p-5 sm:p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-accent-orange">
            Pemantauan
          </p>
          <h2 className="mt-1 text-2xl font-normal">Mengetahui Pengajuan</h2>
          <p className="mt-1 text-sm text-muted">
            Pantau seluruh pengajuan perjalanan dan tandai bahwa Anda telah
            mengetahuinya.
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_180px]">
          <SearchBar basePath="/officer/requests" initialQuery={query} placeholder="Cari kode atau keperluan..." />
          <ExportButton endpoint="/api/export/officer" query={query} />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="h-11 rounded-2xl bg-black/25 px-4 text-sm text-primary ring-1 ring-inset ring-white/10 outline-none focus:ring-2 focus:ring-accent-blue/60"
          >
            <option value="ALL">Semua status</option>
            <option value="PENDING">Menunggu diketahui</option>
            <option value="ACKNOWLEDGED">Diketahui</option>
            <option value="BOOKED">Terbooking</option>
            <option value="REJECTED">Dikembalikan</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>
        </div>

        <div className="mt-5 space-y-3">
          {filtered.map((trip) => {
            const Icon = trip.tripType !== "CUTI" ? Plane : CalendarDays;
            return (
              <Link
                key={trip.id}
                href={`/officer/requests/${trip.id}`}
                className="group grid gap-4 rounded-[var(--radius-card)] bg-card p-4 shadow-card transition-colors hover:bg-card-hover sm:grid-cols-[44px_1fr_auto] sm:items-center"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-black/20 text-accent-blue">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted">{trip.code}</span>
                    <StatusBadge status={trip.status} />
                  </div>
                  <p className="mt-2 truncate text-sm font-medium">
                    {trip.purpose}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {trip.userName}
                    {trip.segments.length ? ` · ${trip.segments.length} segmen` : ""}
                  </p>
                </div>
                <span className="flex items-center gap-2 text-xs text-muted group-hover:text-primary">
                  Detail <ArrowUpRight className="size-4" />
                </span>
              </Link>
            );
          })}
          {!filtered.length ? (
            <div className="rounded-[var(--radius-card)] bg-black/15 px-6 py-14 text-center text-sm text-muted">
              Tidak ada pengajuan yang sesuai filter.
            </div>
          ) : null}
        </div>
      </Panel>

      <aside className="space-y-4">
        <Panel tone="detail" className="p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Menunggu diketahui
          </p>
          <p className="mt-4 text-6xl font-thin text-accent-orange">{waiting}</p>
          <p className="mt-1 text-xs text-muted">dari {trips.length} pengajuan</p>
          <div className="mt-6 space-y-2 text-xs">
            <Row label="Diketahui" value={acknowledged} color="bg-accent-green" />
            <Row label="Terbooking" value={booked} color="bg-accent-green" />
          </div>
        </Panel>
        <div className="rounded-[var(--radius-card)] bg-card p-5 shadow-float">
          <p className="text-sm font-medium">Peran Anda</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Officer bertindak sebagai pihak yang mengetahui, bukan pemberi
            persetujuan. Anda tidak dapat menolak atau mengubah isi pengajuan.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Row({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-black/15 px-3 py-2.5">
      <span className="flex items-center gap-2 text-muted">
        <span className={`size-2 rounded-full ${color}`} />
        {label}
      </span>
      <span className="font-medium text-primary">{value}</span>
    </div>
  );
}
