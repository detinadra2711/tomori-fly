import { createClient } from "@/lib/supabase/server";
import {
  mapJoinedTrip,
  TRIP_JOIN_SELECT,
  type TripJoined,
} from "@/lib/trips/map-joined";
import type { TripRequest } from "@/types";

/**
 * Pengajuan yang relevan untuk Travel Agent: yang sudah diketahui (siap diproses),
 * yang sudah terbooking, dan yang dikembalikan.
 */
export async function listAgentBookings(): Promise<TripRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trip_requests")
    .select(TRIP_JOIN_SELECT)
    .in("status", ["ACKNOWLEDGED", "BOOKED", "REJECTED"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data as TripJoined[] | null) ?? []).map(mapJoinedTrip);
}

export async function getAgentBooking(
  id: string
): Promise<TripRequest | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trip_requests")
    .select(TRIP_JOIN_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapJoinedTrip(data as TripJoined) : null;
}

export interface PagedTrips {
  trips: TripRequest[];
  count: number;
}

const AGENT_STATUSES = ["ACKNOWLEDGED", "BOOKED", "REJECTED"] as const;

/** Travel Agent list dengan pagination server-side. */
export async function listAgentBookingsPaged(
  from: number,
  to: number,
  query?: string
): Promise<PagedTrips> {
  const supabase = await createClient();
  let q = supabase
    .from("trip_requests")
    .select(TRIP_JOIN_SELECT, { count: "exact" })
    .in("status", AGENT_STATUSES as unknown as string[]);
  if (query && query.trim()) {
    const term = `%${query.trim()}%`;
    q = q.or(`code.ilike.${term},purpose.ilike.${term}`);
  }
  const { data, count, error } = await q
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;
  return {
    trips: ((data as TripJoined[] | null) ?? []).map(mapJoinedTrip),
    count: count ?? 0,
  };
}

/** Antrian booking terbaru untuk dashboard. */
export async function recentAgentQueue(limit = 5): Promise<TripRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trip_requests")
    .select(TRIP_JOIN_SELECT)
    .eq("status", "ACKNOWLEDGED")
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data as TripJoined[] | null) ?? []).map(mapJoinedTrip);
}

/** Semua pengajuan yang relevan untuk agent, untuk ekspor. */
export interface ExportFilter {
  query?: string;
  from?: string;
  to?: string;
}

export async function listAgentBookingsForExport(
  filter: ExportFilter = {},
  limit = 5000
): Promise<TripRequest[]> {
  const supabase = await createClient();
  let q = supabase.from("trip_requests").select(TRIP_JOIN_SELECT).in("status", AGENT_STATUSES as unknown as string[]);
  if (filter.query && filter.query.trim()) {
    const term = `%${filter.query.trim()}%`;
    q = q.or(`code.ilike.${term},purpose.ilike.${term}`);
  }
  if (filter.from) q = q.gte("created_at", `${filter.from}T00:00:00`);
  if (filter.to) q = q.lte("created_at", `${filter.to}T23:59:59`);
  const { data } = await q.order("created_at", { ascending: false }).limit(limit);
  return ((data as TripJoined[] | null) ?? []).map(mapJoinedTrip);
}
