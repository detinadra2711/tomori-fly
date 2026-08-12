"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, CalendarDays, Plane } from "lucide-react";
import { Panel } from "@/components/cards/Panel";
import { StatusBadge } from "@/components/status/StatusBadge";
import { SearchBar } from "@/components/shell/SearchBar";
import { ExportButton } from "@/components/shell/ExportButton";
import type { TripRequest } from "@/types";

type Tab = "QUEUE" | "BOOKED" | "RETURNED";

export function BookingsList({ trips, query }: { trips: TripRequest[]; query: string }) {
  const [tab, setTab] = useState<Tab>("QUEUE");

  const byTab = trips.filter((t) =>
    tab === "QUEUE"
      ? t.status === "ACKNOWLEDGED"
      : tab === "BOOKED"
        ? t.status === "BOOKED"
        : t.status === "REJECTED"
  );

  const filtered = byTab;

  const queueCount = trips.filter((t) => t.status === "ACKNOWLEDGED").length;
  const bookedCount = trips.filter((t) => t.status === "BOOKED").length;
  const returnedCount = trips.filter((t) => t.status === "REJECTED").length;

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
      <Panel className="min-w-0 p-5 sm:p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-accent-blue">
            Travel Agent
          </p>
          <h2 className="mt-1 text-2xl font-normal">Proses Booking</h2>
          <p className="mt-1 text-sm text-muted">
            Proses pengajuan yang telah diketahui Officer, isi detail tiket &
            hotel, lalu tandai selesai.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <TabButton active={tab === "QUEUE"} onClick={() => setTab("QUEUE")}>
            Siap diproses ({queueCount})
          </TabButton>
          <TabButton active={tab === "BOOKED"} onClick={() => setTab("BOOKED")}>
            Terbooking ({bookedCount})
          </TabButton>
          <TabButton active={tab === "RETURNED"} onClick={() => setTab("RETURNED")}>
            Dikembalikan ({returnedCount})
          </TabButton>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
          <SearchBar basePath="/travel-agent/bookings" initialQuery={query} placeholder="Cari kode atau keperluan..." />
          <ExportButton endpoint="/api/export/travel-agent" query={query} />
        </div>

        <div className="mt-5 space-y-3">
          {filtered.map((trip) => {
            const Icon = trip.tripType !== "CUTI" ? Plane : CalendarDays;
            return (
              <Link
                key={trip.id}
                href={`/travel-agent/bookings/${trip.id}`}
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
                  <p className="mt-2 truncate text-sm font-medium">{trip.purpose}</p>
                  <p className="mt-1 text-xs text-muted">
                    {trip.userName}
                    {trip.segments.length ? ` · ${trip.segments.length} segmen` : ""}
                    {trip.needHotel ? " · hotel" : ""}
                  </p>
                </div>
                <span className="flex items-center gap-2 text-xs text-muted group-hover:text-primary">
                  {trip.status === "ACKNOWLEDGED" ? "Proses" : "Detail"}{" "}
                  <ArrowUpRight className="size-4" />
                </span>
              </Link>
            );
          })}
          {!filtered.length ? (
            <div className="rounded-[var(--radius-card)] bg-black/15 px-6 py-14 text-center text-sm text-muted">
              Tidak ada pengajuan pada tab ini.
            </div>
          ) : null}
        </div>
      </Panel>

      <aside className="space-y-4">
        <Panel tone="detail" className="p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Antrian
          </p>
          <p className="mt-4 text-6xl font-thin text-accent-blue">{queueCount}</p>
          <p className="mt-1 text-xs text-muted">siap diproses</p>
          <div className="mt-6 space-y-2 text-xs">
            <Row label="Terbooking" value={bookedCount} color="bg-accent-green" />
            <Row label="Dikembalikan" value={returnedCount} color="bg-accent-red" />
          </div>
        </Panel>
        <div className="rounded-[var(--radius-card)] bg-card p-5 shadow-float">
          <p className="text-sm font-medium">Alur</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Hanya pengajuan berstatus Diketahui yang dapat diproses. Isi nomor
            tiket & kode booking, lalu tandai selesai atau kembalikan bila ada
            kendala.
          </p>
        </div>
      </aside>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
        active ? "bg-accent-green text-[#0b2415]" : "bg-card text-muted hover:bg-card-hover"
      }`}
    >
      {children}
    </button>
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
