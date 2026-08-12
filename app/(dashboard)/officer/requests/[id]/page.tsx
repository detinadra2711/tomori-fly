import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  Hotel,
  Plane,
} from "lucide-react";
import { Panel } from "@/components/cards/Panel";
import { StatusBadge } from "@/components/status/StatusBadge";
import { getOfficerRequest } from "@/lib/officer/requests";
import { getCurrentUser } from "@/lib/supabase/auth";
import { hasOfficerPassphrase } from "@/lib/officer/passphrase";
import type { BedType, TripStatus } from "@/types";
import { AcknowledgeAction } from "./AcknowledgeAction";
import { formatDate } from "@/lib/format";

const FLOW: TripStatus[] = ["DRAFT", "PENDING", "ACKNOWLEDGED", "BOOKED"];

export default async function OfficerRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [trip, user] = await Promise.all([
    getOfficerRequest(id),
    getCurrentUser(),
  ]);
  if (!trip) notFound();

  const isDinas = trip.tripType !== "CUTI";
  const currentStep = FLOW.indexOf(trip.status);
  const canAcknowledge = user?.role === "officer" && trip.status === "PENDING";
  const officerHasPassphrase =
    canAcknowledge && user ? await hasOfficerPassphrase(user.id) : false;

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <Panel className="p-5 sm:p-7">
        <Link
          href="/officer/requests"
          className="inline-flex items-center gap-2 text-xs text-muted hover:text-primary"
        >
          <ArrowLeft className="size-4" /> Kembali ke daftar
        </Link>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs text-muted">{trip.code}</p>
            <h2 className="mt-1 text-2xl font-normal">{trip.purpose}</h2>
            <p className="mt-2 text-xs text-muted">
              Pemohon: {trip.userName} · Dibuat {formatDate(trip.createdAt)}
            </p>
          </div>
          <StatusBadge status={trip.status} className="self-start" />
        </div>

        {trip.rejectionNote ? (
          <div className="mt-6 rounded-2xl bg-accent-red/12 p-4 text-sm text-accent-red">
            <span className="font-medium">Catatan pengembalian:</span>{" "}
            {trip.rejectionNote}
          </div>
        ) : null}

        {!isDinas ? (
          <section className="mt-8">
            <Title icon={CalendarDays} label="Periode cuti" />
            <div className="mt-3 rounded-[var(--radius-card)] bg-card p-5">
              <p className="text-xl font-light">
                {formatDate(trip.leaveStart)}{" "}
                <span className="text-muted">hingga</span>{" "}
                {formatDate(trip.leaveEnd)}
              </p>
            </div>
          </section>
        ) : (
          <>
            <section className="mt-8">
              <Title
                icon={Plane}
                label={`Penerbangan · ${trip.dutyType?.replace("_", " ") ?? trip.tripType.replace("_", " ")}`}
              />
              <div className="mt-3 space-y-3">
                {trip.segments.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-[var(--radius-card)] bg-card p-5 shadow-card"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-base font-medium">
                        {s.originCity} <span className="text-accent-green">→</span>{" "}
                        {s.destCity}
                      </p>
                      <span className="text-xs text-muted">
                        {s.airlineName}
                        {s.flightCode ? ` · ${s.flightCode}` : ""}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      {formatDate(s.departureDate)} · Departure {s.departureTime}
                      {s.arrivalTime ? ` · Arrival ${s.arrivalTime}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {trip.hotel ? (
              <section className="mt-8">
                <Title icon={Hotel} label="Reservasi hotel" />
                <div className="mt-3 rounded-[var(--radius-card)] bg-card p-5">
                  <p className="font-medium">{trip.hotel.hotelName}</p>
                  <p className="mt-1 text-xs text-muted">
                    {trip.hotel.city} · {formatDate(trip.hotel.checkinDate)} →{" "}
                    {formatDate(trip.hotel.checkoutDate)}
                    {trip.hotel.bedType
                      ? ` · ${bedTypeLabel(trip.hotel.bedType)}`
                      : ""}
                  </p>
                  {trip.hotel.notes ? (
                    <p className="mt-2 text-xs text-muted">
                      Notes: {trip.hotel.notes}
                    </p>
                  ) : null}
                </div>
              </section>
            ) : null}

            {trip.spkrLinks?.length ? (
              <div className="mt-8 flex flex-wrap gap-2">
                {trip.spkrLinks.map((link, i) => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-accent-blue/15 px-4 py-2.5 text-sm text-accent-blue hover:bg-accent-blue/25"
                  >
                    <ExternalLink className="size-4" /> Buka SPKR {i + 1}
                  </a>
                ))}
              </div>
            ) : null}
          </>
        )}
      </Panel>

      <aside className="space-y-4">
        <Panel tone="detail" className="p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Alur status
          </p>
          <div className="mt-5 space-y-1">
            {FLOW.map((status, index) => {
              const complete = currentStep >= index && currentStep !== -1;
              return (
                <div key={status} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`size-3 rounded-full ${complete ? "bg-accent-green" : "bg-black/25"}`}
                    />
                    {index < FLOW.length - 1 ? (
                      <span
                        className={`h-10 w-px ${complete && currentStep > index ? "bg-accent-green" : "bg-black/25"}`}
                      />
                    ) : null}
                  </div>
                  <div className="-mt-1">
                    <p className={complete ? "text-sm text-primary" : "text-sm text-muted"}>
                      {statusLabel(status)}
                    </p>
                    <p className="text-[11px] text-muted">{statusHint(status)}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {trip.acknowledgedAt ? (
            <p className="mt-5 rounded-2xl bg-black/20 px-3 py-2 text-[11px] text-muted">
              Diketahui pada {formatDate(trip.acknowledgedAt)}
            </p>
          ) : null}
        </Panel>

        <AcknowledgeAction
          tripId={trip.id}
          canAcknowledge={canAcknowledge}
          hasPassphrase={officerHasPassphrase}
        />
      </aside>
    </div>
  );
}

function Title({ icon: Icon, label }: { icon: typeof Plane; label: string }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-medium">
      <Icon className="size-4 text-accent-blue" /> {label}
    </h3>
  );
}


function bedTypeLabel(value: BedType) {
  return { TWIN_BED: "Twin Bed", QUEEN_BED: "Queen Bed", KING_BED: "King Bed" }[
    value
  ];
}

function statusLabel(status: TripStatus) {
  return {
    DRAFT: "Draft dibuat",
    PENDING: "Menunggu diketahui",
    ACKNOWLEDGED: "Diketahui Officer",
    BOOKED: "Booking selesai",
    REJECTED: "Dikembalikan",
    CANCELLED: "Dibatalkan",
  }[status];
}

function statusHint(status: TripStatus) {
  return {
    DRAFT: "Belum dikirim",
    PENDING: "Menunggu Officer memantau",
    ACKNOWLEDGED: "Siap diproses agent",
    BOOKED: "Tiket & hotel selesai",
    REJECTED: "Dikembalikan travel agent",
    CANCELLED: "Dibatalkan pemohon",
  }[status];
}
