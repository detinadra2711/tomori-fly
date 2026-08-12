"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  mapJoinedTrip,
  TRIP_JOIN_SELECT,
  type TripJoined,
} from "@/lib/trips/map-joined";
import { isGoogleDriveUrl } from "@/lib/validation/url";
import type { FlightSegment, HotelReservation, TripRequest, TripStatus } from "@/types";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function fetchTrips(): Promise<TripRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trip_requests")
    .select(TRIP_JOIN_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data as TripJoined[] | null) ?? []).map(mapJoinedTrip);
}

export async function fetchTrip(id: string): Promise<TripRequest | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trip_requests")
    .select(TRIP_JOIN_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapJoinedTrip(data as TripJoined) : null;
}

/**
 * Client hook — memuat pengajuan milik user login (RLS memastikan hanya miliknya
 * yang terbaca untuk role user). Menyediakan status loading & refetch.
 */
export function useTrips() {
  const [trips, setTrips] = useState<TripRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchTrips();
      setTrips(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch data awal saat mount; setState terjadi di dalam callback async.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  return { trips, loading, error, refetch };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export interface TripInput {
  tripType: TripRequest["tripType"];
  dutyType?: TripRequest["dutyType"];
  leaveStart?: string;
  leaveEnd?: string;
  purpose: string;
  spkrLinks: string[];
  needHotel: boolean;
  status: TripStatus;
  segments: Array<Omit<FlightSegment, "id" | "segmentOrder">>;
  hotel?: Omit<HotelReservation, "id">;
}

async function nextCode(): Promise<string> {
  const supabase = createClient();
  const { count } = await supabase
    .from("trip_requests")
    .select("id", { count: "exact", head: true });
  const sequence = (count ?? 0) + 1;
  return `TR-${new Date().getFullYear()}-${String(sequence).padStart(3, "0")}`;
}

async function writeChildren(tripId: string, input: TripInput) {
  const supabase = createClient();

  await supabase.from("flight_segments").delete().eq("trip_request_id", tripId);
  await supabase.from("hotel_reservations").delete().eq("trip_request_id", tripId);

  if (input.tripType !== "CUTI" && input.segments.length) {
    const rows = input.segments.map((segment, index) => ({
      trip_request_id: tripId,
      airline_name: segment.airlineName,
      flight_code: segment.flightCode ?? null,
      origin_city: segment.originCity,
      dest_city: segment.destCity,
      departure_date: segment.departureDate,
      departure_time: segment.departureTime,
      arrival_time: segment.arrivalTime ?? null,
      segment_order: index + 1,
    }));
    const { error } = await supabase.from("flight_segments").insert(rows);
    if (error) throw error;
  }

  if (input.tripType !== "CUTI" && input.needHotel && input.hotel) {
    const { error } = await supabase.from("hotel_reservations").insert({
      trip_request_id: tripId,
      hotel_name: input.hotel.hotelName,
      city: input.hotel.city,
      checkin_date: input.hotel.checkinDate,
      checkout_date: input.hotel.checkoutDate,
      bed_type: input.hotel.bedType ?? null,
      notes: input.hotel.notes ?? null,
    });
    if (error) throw error;
  }
}

export async function createTrip(input: TripInput): Promise<TripRequest> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum login.");

  const code = await nextCode();
  const { data, error } = await supabase
    .from("trip_requests")
    .insert({
      code,
      user_id: user.id,
      trip_type: input.tripType,
      duty_type: input.dutyType ?? null,
      leave_start: input.leaveStart ?? null,
      leave_end: input.leaveEnd ?? null,
      purpose: input.purpose,
      spkr_links: input.spkrLinks,
      need_hotel: input.needHotel,
      status: input.status,
    })
    .select("id")
    .single();
  if (error) throw error;

  await writeChildren(data.id, input);
  const trip = await fetchTrip(data.id);
  if (!trip) throw new Error("Gagal memuat pengajuan baru.");
  return trip;
}

export async function updateTrip(
  id: string,
  input: TripInput
): Promise<TripRequest> {
  const supabase = createClient();
  const { error } = await supabase
    .from("trip_requests")
    .update({
      trip_type: input.tripType,
      duty_type: input.dutyType ?? null,
      leave_start: input.leaveStart ?? null,
      leave_end: input.leaveEnd ?? null,
      purpose: input.purpose,
      spkr_links: input.spkrLinks,
      need_hotel: input.needHotel,
      status: input.status,
      rejection_note: null,
    })
    .eq("id", id);
  if (error) throw error;

  await writeChildren(id, input);
  const trip = await fetchTrip(id);
  if (!trip) throw new Error("Gagal memuat pengajuan.");
  return trip;
}

export async function submitTrip(id: string): Promise<boolean> {
  const trip = await fetchTrip(id);
  // Boleh submit dari DRAFT (baru) atau REJECTED (perbaikan/submit ulang).
  if (!trip || (trip.status !== "DRAFT" && trip.status !== "REJECTED"))
    return false;

  const needsSpkr = trip.tripType !== "CUTI";
  if (needsSpkr && !isGoogleDriveUrl(trip.spkrLinks?.[0])) return false;

  const supabase = createClient();
  const { error } = await supabase
    .from("trip_requests")
    .update({ status: "PENDING", rejection_note: null })
    .eq("id", id);
  return !error;
}

export async function cancelTrip(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("trip_requests")
    .update({ status: "CANCELLED" })
    .eq("id", id)
    .eq("status", "PENDING");
  return !error;
}
