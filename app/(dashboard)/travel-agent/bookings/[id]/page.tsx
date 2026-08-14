import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Panel } from "@/components/cards/Panel";
import { StatusBadge } from "@/components/status/StatusBadge";
import { getAgentBooking } from "@/lib/travel-agent/bookings";
import { BookingForm } from "./BookingForm";
import { formatDate } from "@/lib/format";


export default async function AgentBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trip = await getAgentBooking(id);
  if (!trip) notFound();

  return (
    <div className="space-y-4">
      <Panel className="p-5 sm:p-6">
        <Link
          href="/travel-agent/bookings"
          className="inline-flex items-center gap-2 text-xs text-muted hover:text-primary"
        >
          <ArrowLeft className="size-4" /> Kembali ke daftar
        </Link>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs text-muted">{trip.code}</p>
            <h2 className="mt-1 text-2xl font-normal">{trip.purpose}</h2>
            <p className="mt-2 text-xs text-muted">
              Dibuat {formatDate(trip.createdAt)}
              {trip.acknowledgedAt
                ? ` · Diketahui ${formatDate(trip.acknowledgedAt)}`
                : ""}
            </p>
          </div>
          <StatusBadge status={trip.status} className="self-start" />
        </div>

        <div className="mt-4 grid gap-3 rounded-[var(--radius-card)] bg-card p-4 sm:grid-cols-4">
          <Contact label="Pemohon" value={trip.userName} />
          <Contact label="No. HP" value={trip.userPhone} />
          <Contact label="Kode GFF" value={trip.userGffCode} mono />
          <Contact label="Kode Cabin Crew" value={trip.userBffCode} mono />
        </div>

        {trip.rejectionNote ? (
          <div className="mt-4 rounded-2xl bg-accent-red/12 p-4 text-sm text-accent-red">
            <span className="font-medium">Catatan pengembalian:</span>{" "}
            {trip.rejectionNote}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {trip.spkrLinks?.map((link, i) => (
            <a
              key={link}
              href={link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-accent-blue/15 px-4 py-2 text-xs text-accent-blue hover:bg-accent-blue/25"
            >
              <ExternalLink className="size-3.5" /> SPKR {i + 1}
            </a>
          ))}
          {trip.ticketLinks?.map((link, i) => (
            <a
              key={link}
              href={link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-accent-green/15 px-4 py-2 text-xs text-accent-green hover:bg-accent-green/25"
            >
              <ExternalLink className="size-3.5" /> Tiket {i + 1}
            </a>
          ))}
        </div>
      </Panel>

      <BookingForm trip={trip} />
    </div>
  );
}

function Contact({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p
        className={`mt-1 text-sm ${value ? "text-primary" : "text-muted"} ${mono ? "font-mono" : ""}`}
      >
        {value || "—"}
      </p>
    </div>
  );
}
