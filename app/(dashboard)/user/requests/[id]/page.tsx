"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Download, ExternalLink, Hotel, Pencil, Plane, Printer, Send, XCircle } from "lucide-react";
import { Panel } from "@/components/cards/Panel";
import { StatusBadge } from "@/components/status/StatusBadge";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { cancelTrip, submitTrip, useTrips } from "@/lib/trip-store";
import type { BedType, TripStatus } from "@/types";
import { formatDate, formatDateLong } from "@/lib/format";

const FLOW: TripStatus[] = ["DRAFT", "PENDING", "ACKNOWLEDGED", "BOOKED"];

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const { trips, loading, refetch } = useTrips();
  const trip = trips.find((item) => item.id === params.id);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (loading) {
    return <Panel className="flex min-h-[40vh] items-center justify-center p-10"><Loader label="Memuat pengajuan..." /></Panel>;
  }

  if (!trip) {
    return <Panel className="p-10 text-center"><p className="text-lg">Pengajuan tidak ditemukan.</p><Link href="/user/requests" className="mt-4 inline-flex text-sm text-accent-blue hover:underline">Kembali ke daftar</Link></Panel>;
  }

  async function handleCancel() {
    if (await cancelTrip(trip!.id)) refetch();
  }

  async function handleSubmit() {
    const result = await submitTrip(trip!.id);
    if (result) refetch();
    else setSubmitError("Lengkapi SPKR Google Drive yang valid sebelum mengirim ke Officer.");
  }

  const currentStep = FLOW.indexOf(trip.status);
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <Panel className="p-5 sm:p-7">
        <Link href="/user/requests" className="inline-flex items-center gap-2 text-xs text-muted hover:text-primary"><ArrowLeft className="size-4" /> Kembali ke pengajuan</Link>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div><p className="font-mono text-xs text-muted">{trip.code}</p><h2 className="mt-1 text-2xl font-normal">{trip.purpose}</h2><p className="mt-2 text-xs text-muted">Dibuat {formatDateLong(trip.createdAt)} · Diperbarui {formatDateLong(trip.updatedAt)}</p></div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={trip.status} className="self-start" />
            <a href={`/print/trips/${trip.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs text-muted transition-colors hover:bg-card-hover hover:text-primary"><Printer className="size-3.5" /> Cetak / PDF</a>
          </div>
        </div>

        <div className="mt-6 grid gap-3 rounded-[var(--radius-card)] bg-card p-4 sm:grid-cols-4">
          <Contact label="Pemohon" value={trip.userName} />
          <Contact label="No. HP" value={trip.userPhone} />
          <Contact label="Kode GFF" value={trip.userGffCode} mono />
          <Contact label="Kode Cabin Crew" value={trip.userBffCode} mono />
        </div>

        {trip.rejectionNote ? <div className="mt-6 rounded-2xl bg-accent-red/12 p-4 text-sm text-accent-red"><span className="font-medium">Catatan pengembalian:</span> {trip.rejectionNote}</div> : null}

        {trip.tripType === "CUTI" ? (
          <section className="mt-8"><Title icon={CalendarDays} label="Periode cuti" /><div className="mt-3 rounded-[var(--radius-card)] bg-card p-5"><p className="text-xl font-light">{formatDate(trip.leaveStart)} <span className="text-muted">hingga</span> {formatDate(trip.leaveEnd)}</p></div></section>
        ) : (
          <>
            <section className="mt-8"><Title icon={Plane} label={`Penerbangan · ${trip.dutyType?.replace("_", " ") ?? trip.tripType.replace("_", " ")}`} /><div className="mt-3 space-y-3">{trip.segments.map((segment) => <div key={segment.id} className="rounded-[var(--radius-card)] bg-card p-5 shadow-card"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-base font-medium">{segment.originCity} <span className="text-accent-green">→</span> {segment.destCity}</p><span className="text-xs text-muted">{segment.airlineName}{segment.flightCode ? ` · ${segment.flightCode}` : ""}</span></div><p className="mt-2 text-xs text-muted">{formatDate(segment.departureDate)} · Departure {segment.departureTime}{segment.arrivalTime ? ` · Arrival ${segment.arrivalTime}` : ""}</p>{segment.ticketNumber ? <p className="mt-3 text-xs text-accent-green">Tiket {segment.ticketNumber} · Booking {segment.bookingCode}</p> : null}</div>)}</div></section>
            {trip.hotel ? <section className="mt-8"><Title icon={Hotel} label="Reservasi hotel" /><div className="mt-3 rounded-[var(--radius-card)] bg-card p-5"><p className="font-medium">{trip.hotel.hotelName}</p><p className="mt-1 text-xs text-muted">{trip.hotel.city} · {formatDate(trip.hotel.checkinDate)} → {formatDate(trip.hotel.checkoutDate)}{trip.hotel.bedType ? ` · ${bedTypeLabel(trip.hotel.bedType)}` : ""}</p>{trip.hotel.notes ? <p className="mt-2 text-xs text-muted">Notes: {trip.hotel.notes}</p> : null}{trip.hotel.bookingRef ? <p className="mt-3 text-xs text-accent-green">Ref. {trip.hotel.bookingRef}</p> : null}</div></section> : null}
            {trip.spkrLinks?.length ? <div className="mt-8 flex flex-wrap gap-2">{trip.spkrLinks.map((link, index) => <a key={link} href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-accent-blue/15 px-4 py-2.5 text-sm text-accent-blue hover:bg-accent-blue/25"><ExternalLink className="size-4" /> Buka SPKR {index + 1}</a>)}</div> : null}
            {trip.ticketLinks?.length ? <section className="mt-8"><Title icon={Download} label="File tiket & booking" /><div className="mt-3 flex flex-wrap gap-2">{trip.ticketLinks.map((link, index) => <a key={link} href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-accent-green/15 px-4 py-2.5 text-sm text-accent-green hover:bg-accent-green/25"><Download className="size-4" /> Unduh file {index + 1}</a>)}</div></section> : null}
          </>
        )}
      </Panel>

      <aside className="space-y-4">
        <Panel tone="detail" className="p-5"><p className="text-xs uppercase tracking-[0.16em] text-muted">Alur status</p><div className="mt-5 space-y-1">{FLOW.map((status, index) => { const complete = currentStep >= index && currentStep !== -1; return <div key={status} className="flex gap-3"><div className="flex flex-col items-center"><span className={`size-3 rounded-full ${complete ? "bg-accent-green" : "bg-black/25"}`} />{index < FLOW.length - 1 ? <span className={`h-10 w-px ${complete && currentStep > index ? "bg-accent-green" : "bg-black/25"}`} /> : null}</div><div className="-mt-1"><p className={complete ? "text-sm text-primary" : "text-sm text-muted"}>{statusLabel(status)}</p><p className="text-[11px] text-muted">{statusHint(status)}</p></div></div>; })}</div></Panel>
        {trip.status === "DRAFT" ? <div className="rounded-[var(--radius-card)] bg-card p-5 shadow-float"><p className="text-sm font-medium">Lanjutkan draft ini</p><p className="mt-2 text-xs leading-relaxed text-muted">Edit kembali pengajuan lalu kirim ke Officer bila sudah lengkap.</p>{submitError ? <p className="mt-3 rounded-2xl bg-accent-red/12 px-3 py-2 text-xs text-accent-red">{submitError}</p> : null}<div className="mt-4 space-y-2"><Link href={`/user/requests/${trip.id}/edit`} className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-card-hover text-sm font-medium text-primary transition-colors hover:brightness-110"><Pencil className="size-4" /> Edit pengajuan</Link><Button type="button" className="w-full" onClick={handleSubmit}><Send /> Kirim ke Officer</Button></div></div> : null}
        {trip.status === "REJECTED" ? <div className="rounded-[var(--radius-card)] bg-card p-5 shadow-float"><p className="text-sm font-medium">Pengajuan dikembalikan</p><p className="mt-2 text-xs leading-relaxed text-muted">Perbaiki pengajuan sesuai catatan, lalu kirim ulang ke Officer.</p>{submitError ? <p className="mt-3 rounded-2xl bg-accent-red/12 px-3 py-2 text-xs text-accent-red">{submitError}</p> : null}<div className="mt-4 space-y-2"><Link href={`/user/requests/${trip.id}/edit`} className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-card-hover text-sm font-medium text-primary transition-colors hover:brightness-110"><Pencil className="size-4" /> Perbaiki pengajuan</Link><Button type="button" className="w-full" onClick={handleSubmit}><Send /> Kirim ulang</Button></div></div> : null}
        {trip.status === "PENDING" ? <div className="rounded-[var(--radius-card)] bg-card p-5 shadow-float"><p className="text-sm font-medium">Batalkan pengajuan?</p><p className="mt-2 text-xs leading-relaxed text-muted">Pengajuan yang belum diketahui Officer dapat dibatalkan.</p><Button type="button" variant="danger" className="mt-4 w-full" onClick={handleCancel}><XCircle /> Batalkan</Button></div> : null}
      </aside>
    </div>
  );
}

function Title({ icon: Icon, label }: { icon: typeof Plane; label: string }) { return <h3 className="flex items-center gap-2 text-sm font-medium"><Icon className="size-4 text-accent-blue" /> {label}</h3>; }
function Contact({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 text-sm ${value ? "text-primary" : "text-muted"} ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
    </div>
  );
}
function bedTypeLabel(value: BedType) { return { TWIN_BED: "Twin Bed", QUEEN_BED: "Queen Bed", KING_BED: "King Bed" }[value]; }
function statusLabel(status: TripStatus) { return { DRAFT: "Draft dibuat", PENDING: "Menunggu diketahui", ACKNOWLEDGED: "Diketahui Officer", BOOKED: "Booking selesai", REJECTED: "Dikembalikan", CANCELLED: "Dibatalkan" }[status]; }
function statusHint(status: TripStatus) { return { DRAFT: "Belum dikirim", PENDING: "Menunggu Officer mengetahui", ACKNOWLEDGED: "Siap diproses agent", BOOKED: "Tiket & hotel selesai", REJECTED: "Dikembalikan travel agent", CANCELLED: "Dibatalkan pemohon" }[status]; }
