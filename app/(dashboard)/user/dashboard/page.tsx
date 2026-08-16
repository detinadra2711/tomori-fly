"use client";

import { useMemo, useState } from "react";
import { Plane, Hotel, CalendarDays, FileText, X } from "lucide-react";
import { Panel } from "@/components/cards/Panel";
import { StatCard } from "@/components/cards/StatCard";
import { RequestCard } from "@/components/cards/RequestCard";
import { FloatingWidget } from "@/components/cards/FloatingWidget";
import { StatusBadge } from "@/components/status/StatusBadge";
import { Loader } from "@/components/ui/loader";
import { useTrips } from "@/lib/trip-store";
import type { TripRequest } from "@/types";

export default function UserDashboardPage() {
  const { trips, loading } = useTrips();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Default ke item pertama tanpa setState-in-effect: fallback saat belum ada pilihan.
  const selected =
    trips.find((t) => t.id === selectedId) ?? (selectedId ? null : trips[0] ?? null);

  const stats = useMemo(() => {
    return {
      total: trips.length,
      pending: trips.filter((t) => t.status === "PENDING").length,
      active: trips.filter(
        (t) => t.status === "ACKNOWLEDGED" || t.status === "BOOKED"
      ).length,
    };
  }, [trips]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader label="Memuat pengajuan..." />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
      {/* LEFT: stats + main panel of request cards */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total Pengajuan" value={stats.total} accent="blue" />
          <StatCard
            label="Menunggu Diketahui"
            value={stats.pending}
            accent="orange"
            hint="menunggu officer"
          />
          <StatCard
            label="Aktif / Booked"
            value={stats.active}
            accent="green"
            hint="diketahui & terbooking"
          />
        </div>

        <Panel className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-medium text-primary">
                Pengajuan Terbaru
              </h2>
              <p className="text-xs text-muted">
                Pilih kartu untuk melihat detail.
              </p>
            </div>
            <span className="rounded-full bg-black/20 px-3 py-1 text-xs text-muted">
              {trips.length} item
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <RequestCard
                key={trip.id}
                trip={trip}
                active={selected?.id === trip.id}
                onSelect={(t) => setSelectedId(t.id)}
              />
            ))}
          </div>
        </Panel>
      </div>

      {/* RIGHT: floating widget (detached) + detail side panel */}
      <div className="flex flex-col gap-4">
        <FloatingWidget />
        <DetailPanel trip={selected} onClose={() => setSelectedId(null)} />
      </div>
    </div>
  );
}

function DetailPanel({
  trip,
  onClose,
}: {
  trip: TripRequest | null;
  onClose: () => void;
}) {
  if (!trip) {
    return (
      <Panel tone="detail" className="flex flex-1 items-center justify-center p-8">
        <p className="text-center text-sm text-muted">
          Belum ada pengajuan dipilih.
          <br />
          Klik salah satu kartu di sebelah kiri.
        </p>
      </Panel>
    );
  }

  const isDinas = trip.tripType !== "CUTI";

  return (
    <Panel tone="detail" className="flex flex-1 flex-col p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-muted">{trip.code}</p>
          <h3 className="mt-1 text-xl font-normal text-primary">
            {trip.tripType}
            {trip.dutyType ? (
              <span className="text-muted"> · {trip.dutyType.replace("_", " ")}</span>
            ) : null}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-xl text-muted transition-colors hover:bg-white/5 hover:text-primary"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-3">
        <StatusBadge status={trip.status} />
      </div>

      <p className="mt-4 text-sm text-primary">{trip.purpose}</p>

      {trip.status === "REJECTED" && trip.rejectionNote ? (
        <div className="mt-4 rounded-2xl bg-accent-red/12 p-3 text-xs text-accent-red">
          Catatan pengembalian: {trip.rejectionNote}
        </div>
      ) : null}

      {/* CUTI dates */}
      {!isDinas ? (
        <div className="mt-5 rounded-2xl bg-black/20 p-4">
          <p className="flex items-center gap-2 text-xs text-muted">
            <CalendarDays className="size-4" /> Periode cuti
          </p>
          <p className="mt-1 text-sm text-primary">
            {trip.leaveStart} → {trip.leaveEnd}
          </p>
        </div>
      ) : null}

      {/* DINAS flight segments */}
      {isDinas && trip.segments.length > 0 ? (
        <div className="mt-5">
          <p className="mb-2 flex items-center gap-2 text-xs text-muted">
            <Plane className="size-4" /> Penerbangan
          </p>
          <div className="space-y-2">
            {trip.segments.map((s) => (
              <div key={s.id} className="rounded-2xl bg-black/20 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-primary">
                    {s.originCity} → {s.destCity}
                  </span>
                  <span className="text-xs text-muted">{s.airlineName}</span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {s.departureDate} · {s.departureTime}
                  {s.arrivalTime ? ` → ${s.arrivalTime}` : ""}
                  {s.ticketNumber ? (
                    <span className="ml-2 text-accent-green">
                      Tiket {s.ticketNumber}
                    </span>
                  ) : null}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Hotel */}
      {isDinas && trip.hotel ? (
        <div className="mt-4 rounded-2xl bg-black/20 p-3 text-sm">
          <p className="flex items-center gap-2 text-xs text-muted">
            <Hotel className="size-4" /> Hotel
          </p>
          <p className="mt-1 text-primary">
            {trip.hotel.hotelName}, {trip.hotel.city}
          </p>
          <p className="text-xs text-muted">
            {trip.hotel.checkinDate} → {trip.hotel.checkoutDate}
          </p>
        </div>
      ) : null}

      {/* SPKR link */}
      {trip.spkrLinks?.length ? (
        <div className="mt-5 flex flex-wrap gap-2">{trip.spkrLinks.map((link, index) => <a key={link} href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs text-accent-blue hover:underline"><FileText className="size-4" /> SPKR {index + 1}</a>)}</div>
      ) : null}
    </Panel>
  );
}
