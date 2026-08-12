"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/cards/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BED_TYPES,
  emptyHotel,
  emptySegment,
  Field,
  FormSection,
  HotelFields,
  SegmentFields,
  TypeFields,
  type HotelDraft,
  type SegmentDraft,
} from "@/components/forms/TripFormFields";
import { createTrip, updateTrip, type TripInput } from "@/lib/trip-store";
import { isGoogleDriveUrl } from "@/lib/validation/url";
import { useMasterData } from "@/lib/master-data/use-master-data";
import type { BedType, RequestType, TripRequest, TripStatus } from "@/types";

function bedTypeToLabel(value?: BedType) {
  return BED_TYPES.find((bed) => bed.value === value)?.label ?? "Twin Bed";
}

function labelToBedType(label: string): BedType {
  return (BED_TYPES.find((bed) => bed.label === label)?.value ?? "TWIN_BED") as BedType;
}

function requestTypeOf(trip: TripRequest): RequestType {
  if (trip.tripType === "CUTI") return "CUTI";
  if (trip.tripType === "DINAS_LUAR") return "DINAS_LUAR";
  return trip.dutyType ?? "ON_DUTY";
}

export function TripEditor({ trip }: { trip?: TripRequest }) {
  const { airlines, cities } = useMasterData();
  const router = useRouter();
  const editing = Boolean(trip);

  const [requestType, setRequestType] = useState<RequestType>(
    trip ? requestTypeOf(trip) : "ON_DUTY"
  );
  const [leaveStart, setLeaveStart] = useState(trip?.leaveStart ?? "");
  const [leaveEnd, setLeaveEnd] = useState(trip?.leaveEnd ?? "");
  const [spkrLinks, setSpkrLinks] = useState<string[]>(
    trip?.spkrLinks?.length ? trip.spkrLinks : [""]
  );
  const [needHotel, setNeedHotel] = useState(trip?.needHotel ?? false);
  const [hotel, setHotel] = useState<HotelDraft>(
    trip?.hotel
      ? {
          name: trip.hotel.hotelName,
          city: trip.hotel.city,
          checkin: trip.hotel.checkinDate,
          checkout: trip.hotel.checkoutDate,
          bedType: bedTypeToLabel(trip.hotel.bedType),
          notes: trip.hotel.notes ?? "",
        }
      : emptyHotel()
  );
  const [segments, setSegments] = useState<SegmentDraft[]>(
    trip?.segments.length
      ? trip.segments.map((segment) => ({
          airlineName: segment.airlineName,
          flightCode: segment.flightCode ?? "",
          originCity: segment.originCity,
          destCity: segment.destCity,
          departureDate: segment.departureDate,
          departureTime: segment.departureTime,
          arrivalTime: segment.arrivalTime ?? "",
        }))
      : [emptySegment()]
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function validate(status: TripStatus) {
    if (requestType === "CUTI") {
      if (!leaveStart || !leaveEnd) return "Tanggal mulai dan selesai cuti wajib diisi.";
      return leaveEnd < leaveStart ? "Tanggal selesai tidak boleh sebelum tanggal mulai." : null;
    }
    const requiredMissing = segments.some(
      (segment) =>
        !segment.airlineName.trim() ||
        !segment.originCity.trim() ||
        !segment.destCity.trim() ||
        !segment.departureDate.trim() ||
        !segment.departureTime.trim() ||
        !segment.arrivalTime.trim()
    );
    if (requiredMissing) return "Lengkapi seluruh data penerbangan (kode penerbangan opsional).";
    if (segments.some((segment) => segment.originCity === segment.destCity))
      return "Kota asal dan kota tujuan tidak boleh sama.";
    if (status === "PENDING" && !isGoogleDriveUrl(spkrLinks[0]))
      return "Tautan SPKR Google Drive yang valid wajib diisi sebelum submit.";
    if (spkrLinks.some((link) => link.trim() && !isGoogleDriveUrl(link)))
      return "Semua tautan SPKR harus berupa link Google Drive yang valid.";
    if (needHotel && (!hotel.name.trim() || !hotel.city.trim() || !hotel.checkin || !hotel.checkout))
      return "Lengkapi data hotel (nama, kota, check-in, check-out).";
    if (needHotel && hotel.checkout < hotel.checkin)
      return "Tanggal check-out tidak boleh sebelum check-in.";
    return null;
  }

  async function save(status: TripStatus) {
    const validationError = validate(status);
    if (validationError) return setError(validationError);

    const isCuti = requestType === "CUTI";
    const validLinks = spkrLinks.map((link) => link.trim()).filter(Boolean);
    const flightSegments = !isCuti
      ? segments.map((segment) => ({
          airlineName: segment.airlineName,
          flightCode: segment.flightCode.trim() || undefined,
          originCity: segment.originCity,
          destCity: segment.destCity,
          departureDate: segment.departureDate,
          departureTime: segment.departureTime,
          arrivalTime: segment.arrivalTime,
        }))
      : [];

    const input: TripInput = {
      tripType:
        requestType === "DINAS_LUAR"
          ? "DINAS_LUAR"
          : isCuti
            ? "CUTI"
            : "DINAS",
      dutyType:
        requestType === "ON_DUTY" || requestType === "OFF_DUTY"
          ? requestType
          : undefined,
      leaveStart: isCuti ? leaveStart : undefined,
      leaveEnd: isCuti ? leaveEnd : undefined,
      purpose: requestType.replace("_", " "),
      spkrLinks: !isCuti ? validLinks : [],
      needHotel: !isCuti && needHotel,
      status,
      segments: flightSegments,
      hotel:
        !isCuti && needHotel
          ? {
              hotelName: hotel.name.trim(),
              city: hotel.city.trim(),
              checkinDate: hotel.checkin,
              checkoutDate: hotel.checkout,
              bedType: labelToBedType(hotel.bedType),
              notes: hotel.notes.trim() || undefined,
            }
          : undefined,
    };

    setSaving(true);
    setError(null);
    try {
      const result = trip ? await updateTrip(trip.id, input) : await createTrip(input);
      router.push(`/user/requests/${result.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan pengajuan.");
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
      <Panel className="p-5 sm:p-7">
        <p className="text-xs uppercase tracking-[0.18em] text-accent-green">Form perjalanan</p>
        <h2 className="mt-1 text-2xl font-normal">
          {editing ? "Edit Pengajuan" : "Buat Pengajuan Baru"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Simpan sebagai draft atau kirim langsung ke Officer.
        </p>
        <TypeFields value={requestType} onChange={setRequestType} />
        {requestType === "CUTI" ? (
          <FormSection number="02" title="Periode cuti">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tanggal mulai">
                <Input type="date" value={leaveStart} onChange={(event) => setLeaveStart(event.target.value)} />
              </Field>
              <Field label="Tanggal selesai">
                <Input type="date" value={leaveEnd} onChange={(event) => setLeaveEnd(event.target.value)} />
              </Field>
            </div>
          </FormSection>
        ) : (
          <>
            <SegmentFields segments={segments} onChange={setSegments} airlines={airlines} cities={cities} />
            <HotelFields
              enabled={needHotel}
              hotel={hotel}
              spkrLinks={spkrLinks}
              onEnabled={setNeedHotel}
              onHotel={setHotel}
              onSpkrLinks={setSpkrLinks}
            />
          </>
        )}
        {error ? (
          <p className="mt-6 rounded-2xl bg-accent-red/12 px-4 py-3 text-sm text-accent-red">{error}</p>
        ) : null}
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" disabled={saving} onClick={() => save("DRAFT")}>
            Simpan Draft
          </Button>
          <Button type="button" disabled={saving} onClick={() => save("PENDING")}>
            {saving ? "Menyimpan…" : "Kirim ke Officer"}
          </Button>
        </div>
      </Panel>
      <aside className="space-y-4">
        <Panel tone="detail" className="p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Progress</p>
          <p className="mt-4 text-6xl font-thin text-accent-green">
            {requestType === "CUTI" ? "2" : "3"}
          </p>
          <p className="text-xs text-muted">bagian formulir</p>
        </Panel>
        <div className="rounded-[var(--radius-card)] bg-card p-5 shadow-float">
          <p className="text-sm font-medium">Draft aman</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Draft tidak dikirim ke Officer dan bisa diedit lagi. SPKR hanya wajib saat pengajuan
            disubmit.
          </p>
        </div>
      </aside>
    </div>
  );
}

