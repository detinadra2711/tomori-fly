"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { ArrowUpRight, CalendarDays, Plane, Plus, Search } from "lucide-react";
import { Panel } from "@/components/cards/Panel";
import { StatusBadge } from "@/components/status/StatusBadge";
import { Input } from "@/components/ui/input";
import { useTrips } from "@/lib/trip-store";
import { ClientPagination } from "@/components/shell/ClientPagination";
import type { TripStatus, TripType } from "@/types";

type StatusFilter = "ALL" | TripStatus;
type TypeFilter = "ALL" | TripType;

export default function RequestsPage() {
  const { trips } = useTrips();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [type, setType] = useState<TypeFilter>("ALL");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const [page, setPage] = useState(1);
  const perPage = 8;

  const filtered = trips.filter((trip) => {
    const matchesQuery =
      !deferredQuery ||
      trip.code.toLowerCase().includes(deferredQuery) ||
      trip.purpose.toLowerCase().includes(deferredQuery);
    return (
      matchesQuery &&
      (status === "ALL" || trip.status === status) &&
      (type === "ALL" || trip.tripType === type)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
      <Panel className="min-w-0 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-accent-blue">Perjalanan</p>
            <h2 className="mt-1 text-2xl font-normal">Pengajuan Saya</h2>
            <p className="mt-1 text-sm text-muted">Pantau seluruh perjalanan dinas dan cuti dalam satu tempat.</p>
          </div>
          <Link
            href="/user/requests/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-accent-green px-5 text-sm font-medium text-[#0b2415] shadow-card hover:brightness-110"
          >
            <Plus className="size-4" /> Pengajuan Baru
          </Link>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_170px_150px]">
          <label className="relative">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari kode atau keperluan..."
              className="pl-11"
            />
          </label>
          <FilterSelect value={status} onChange={(value) => setStatus(value as StatusFilter)}>
            <option value="ALL">Semua status</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING">Menunggu</option>
            <option value="ACKNOWLEDGED">Diketahui</option>
            <option value="BOOKED">Terbooking</option>
            <option value="REJECTED">Dikembalikan</option>
            <option value="CANCELLED">Dibatalkan</option>
          </FilterSelect>
          <FilterSelect value={type} onChange={(value) => setType(value as TypeFilter)}>
            <option value="ALL">Semua jenis</option>
            <option value="DINAS">Dinas</option>
            <option value="DINAS_LUAR">Dinas Luar</option>
            <option value="CUTI">Cuti</option>
          </FilterSelect>
        </div>

        <div className="mt-5 space-y-3">
          {paged.map((trip) => {
            const Icon = trip.tripType !== "CUTI" ? Plane : CalendarDays;
            return (
              <Link
                key={trip.id}
                href={`/user/requests/${trip.id}`}
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
                  {trip.userName ? (
                    <p className="mt-1 truncate text-xs text-primary">{trip.userName}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted">
                    {trip.tripType}
                    {trip.dutyType ? ` · ${trip.dutyType.replace("_", " ")}` : ""}
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
        {filtered.length ? (
          <ClientPagination
            page={currentPage}
            totalPages={totalPages}
            totalCount={filtered.length}
            onChange={setPage}
          />
        ) : null}
      </Panel>

      <aside className="space-y-4">
        <Panel tone="detail" className="p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Ringkasan</p>
          <p className="mt-4 text-6xl font-thin text-primary">{trips.length}</p>
          <p className="mt-1 text-xs text-muted">total pengajuan</p>
          <div className="mt-6 space-y-3 text-xs">
            <SummaryRow label="Menunggu Diketahui" value={trips.filter((trip) => trip.status === "PENDING").length} color="bg-accent-orange" />
            <SummaryRow label="Diketahui / Booked" value={trips.filter((trip) => ["ACKNOWLEDGED", "BOOKED"].includes(trip.status)).length} color="bg-accent-green" />
            <SummaryRow label="Draft" value={trips.filter((trip) => trip.status === "DRAFT").length} color="bg-accent-blue" />
          </div>
        </Panel>
        <div className="rounded-[var(--radius-card)] bg-card p-5 shadow-float">
          <p className="text-sm font-medium">Perlu diingat</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">Pengajuan DINAS membutuhkan minimal satu penerbangan dan tautan SPKR Google Drive yang valid.</p>
        </div>
      </aside>
    </div>
  );
}

function FilterSelect({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 rounded-2xl bg-black/25 px-4 text-sm text-primary ring-1 ring-inset ring-white/10 outline-none focus:ring-2 focus:ring-accent-blue/60"
    >
      {children}
    </select>
  );
}

function SummaryRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-black/15 px-3 py-2.5">
      <span className="flex items-center gap-2 text-muted"><span className={`size-2 rounded-full ${color}`} />{label}</span>
      <span className="font-medium text-primary">{value}</span>
    </div>
  );
}
