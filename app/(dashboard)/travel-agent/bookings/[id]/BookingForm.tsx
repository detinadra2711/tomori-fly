"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Link2, Plus, Save, Trash2, Undo2 } from "lucide-react";
import { Panel } from "@/components/cards/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  markBooked,
  returnRequest,
  saveBooking,
  type HotelBooking,
  type SegmentBooking,
} from "@/app/(dashboard)/travel-agent/actions";
import type { TripRequest } from "@/types";

export function BookingForm({ trip }: { trip: TripRequest }) {
  const router = useRouter();
  const editable = trip.status === "ACKNOWLEDGED";

  const [segments, setSegments] = useState<SegmentBooking[]>(
    trip.segments.map((s) => ({
      id: s.id,
      ticketNumber: s.ticketNumber ?? "",
      bookingCode: s.bookingCode ?? "",
    }))
  );
  const [hotel, setHotel] = useState<HotelBooking>({
    bookingRef: trip.hotel?.bookingRef ?? "",
    roomType: trip.hotel?.roomType ?? "",
  });
  const [ticketLinks, setTicketLinks] = useState<string[]>(
    trip.ticketLinks?.length ? trip.ticketLinks : [""]
  );
  const [note, setNote] = useState("");
  const [showReturn, setShowReturn] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function updateSegment(id: string, field: keyof SegmentBooking, value: string) {
    setSegments((cur) =>
      cur.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, ok?: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
    const result = await fn();
    setBusy(false);
    if (!result.ok) return setError(result.error ?? "Terjadi kesalahan.");
    if (ok) setMessage(ok);
    router.refresh();
  }

  const hotelArg = trip.needHotel && trip.hotel ? hotel : undefined;
  const cleanLinks = ticketLinks.map((l) => l.trim()).filter(Boolean);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <Panel className="p-5 sm:p-7">
        <p className="text-xs uppercase tracking-[0.18em] text-accent-blue">
          Detail booking
        </p>
        <h3 className="mt-1 text-lg font-medium">Penerbangan</h3>

        <div className="mt-4 space-y-3">
          {trip.segments.map((s) => {
            const draft = segments.find((x) => x.id === s.id)!;
            return (
              <div
                key={s.id}
                className="rounded-[var(--radius-card)] bg-card p-4 shadow-card"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {s.originCity} <span className="text-accent-green">→</span>{" "}
                    {s.destCity}
                  </p>
                  <span className="text-xs text-muted">
                    {s.airlineName}
                    {s.flightCode ? ` · ${s.flightCode}` : ""}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {s.departureDate} · {s.departureTime}
                  {s.arrivalTime ? ` → ${s.arrivalTime}` : ""}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Nomor tiket">
                    <Input
                      value={draft.ticketNumber}
                      onChange={(e) => updateSegment(s.id, "ticketNumber", e.target.value)}
                      placeholder="mis. 126-1234567890"
                      disabled={!editable}
                    />
                  </Field>
                  <Field label="Kode booking">
                    <Input
                      value={draft.bookingCode}
                      onChange={(e) => updateSegment(s.id, "bookingCode", e.target.value)}
                      placeholder="mis. QW7K2P"
                      disabled={!editable}
                    />
                  </Field>
                </div>
              </div>
            );
          })}
        </div>

        {trip.needHotel && trip.hotel ? (
          <>
            <h3 className="mt-8 text-lg font-medium">Hotel</h3>
            <div className="mt-3 rounded-[var(--radius-card)] bg-card p-4 shadow-card">
              <p className="text-sm font-medium">{trip.hotel.hotelName}</p>
              <p className="mt-1 text-xs text-muted">
                {trip.hotel.city} · {trip.hotel.checkinDate} → {trip.hotel.checkoutDate}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Ref. booking hotel">
                  <Input
                    value={hotel.bookingRef}
                    onChange={(e) => setHotel({ ...hotel, bookingRef: e.target.value })}
                    placeholder="mis. HB-889201"
                    disabled={!editable}
                  />
                </Field>
                <Field label="Tipe kamar">
                  <Input
                    value={hotel.roomType}
                    onChange={(e) => setHotel({ ...hotel, roomType: e.target.value })}
                    placeholder="mis. Deluxe King"
                    disabled={!editable}
                  />
                </Field>
              </div>
            </div>
          </>
        ) : null}

        <h3 className="mt-8 text-lg font-medium">Link file tiket</h3>
        <p className="mt-1 text-xs text-muted">
          Minimal 1 link file tiket pesawat wajib. Tambahkan link lain untuk
          tiket hotel bila ada.
        </p>
        <div className="mt-3 space-y-2">
          {ticketLinks.map((link, index) => (
            <div key={index} className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  type="url"
                  value={link}
                  onChange={(e) =>
                    setTicketLinks((cur) =>
                      cur.map((l, i) => (i === index ? e.target.value : l))
                    )
                  }
                  placeholder={
                    index === 0
                      ? "Link tiket pesawat (wajib)"
                      : "Link tiket lain (mis. hotel)"
                  }
                  className="pl-11"
                  disabled={!editable}
                />
              </div>
              {editable && index > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Hapus link"
                  onClick={() =>
                    setTicketLinks((cur) => cur.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 />
                </Button>
              ) : null}
            </div>
          ))}
          {editable ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setTicketLinks((cur) => [...cur, ""])}
            >
              <Plus /> Tambah link
            </Button>
          ) : null}
        </div>

        {error ? (
          <p className="mt-6 rounded-2xl bg-accent-red/12 px-4 py-3 text-sm text-accent-red">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="mt-6 rounded-2xl bg-accent-green/12 px-4 py-3 text-sm text-accent-green">
            {message}
          </p>
        ) : null}
      </Panel>

      <aside className="space-y-4">
        {editable ? (
          <div className="rounded-[var(--radius-card)] bg-card p-5 shadow-float">
            <p className="text-sm font-medium">Tindakan</p>
            <div className="mt-4 space-y-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={busy}
                onClick={() => run(() => saveBooking(trip.id, segments, hotelArg, cleanLinks), "Detail booking disimpan.")}
              >
                <Save /> Simpan detail
              </Button>
              <Button
                type="button"
                className="w-full"
                disabled={busy}
                onClick={() => run(() => markBooked(trip.id, segments, hotelArg, cleanLinks))}
              >
                <CheckCircle2 /> Tandai selesai (Booked)
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={busy}
                onClick={() => setShowReturn((v) => !v)}
              >
                <Undo2 /> Kembalikan
              </Button>
              {showReturn ? (
                <div className="space-y-2 rounded-2xl bg-black/20 p-3">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Alasan pengembalian (wajib)"
                    className="w-full resize-none rounded-2xl bg-black/25 px-4 py-3 text-sm text-primary ring-1 ring-inset ring-white/10 outline-none placeholder:text-muted/70 focus:ring-2 focus:ring-accent-blue/60"
                  />
                  <Button
                    type="button"
                    variant="danger"
                    className="w-full"
                    disabled={busy}
                    onClick={() => run(() => returnRequest(trip.id, note))}
                  >
                    Kembalikan pengajuan
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="rounded-[var(--radius-card)] bg-card p-5 shadow-float">
            <p className="text-sm font-medium">
              {trip.status === "BOOKED" ? "Sudah terbooking" : "Dikembalikan"}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {trip.status === "BOOKED"
                ? "Pengajuan ini sudah selesai diproses. Detail tidak dapat diubah lagi."
                : "Pengajuan dikembalikan ke pemohon untuk diperbaiki."}
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
