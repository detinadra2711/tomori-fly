import { createClient } from "@/lib/supabase/server";
import {
  mapJoinedTrip,
  TRIP_JOIN_SELECT,
  type TripJoined,
} from "@/lib/trips/map-joined";
import type { TripRequest } from "@/types";

/**
 * Semua pengajuan yang sudah disubmit user (bukan DRAFT).
 * Officer memantau seluruh pengajuan, bukan hanya yang menunggu.
 */
export async function listOfficerRequests(): Promise<TripRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trip_requests")
    .select(TRIP_JOIN_SELECT)
    .neq("status", "DRAFT")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data as TripJoined[] | null) ?? []).map(mapJoinedTrip);
}

export async function getOfficerRequest(
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

/** Officer list dengan pagination server-side. */
export async function listOfficerRequestsPaged(
  from: number,
  to: number,
  query?: string
): Promise<PagedTrips> {
  const supabase = await createClient();
  let q = supabase
    .from("trip_requests")
    .select(TRIP_JOIN_SELECT, { count: "exact" })
    .neq("status", "DRAFT");
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

/** Beberapa pengajuan terbaru untuk dashboard. */
export async function recentOfficerRequests(limit = 5): Promise<TripRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trip_requests")
    .select(TRIP_JOIN_SELECT)
    .neq("status", "DRAFT")
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data as TripJoined[] | null) ?? []).map(mapJoinedTrip);
}

/** Semua pengajuan (non-draft) untuk ekspor. Dibatasi agar aman. */
export interface ExportFilter {
  query?: string;
  from?: string; // ISO date (inclusive)
  to?: string; // ISO date (inclusive)
}

export async function listOfficerRequestsForExport(
  filter: ExportFilter = {},
  limit = 5000
): Promise<TripRequest[]> {
  const supabase = await createClient();
  let q = supabase.from("trip_requests").select(TRIP_JOIN_SELECT).neq("status", "DRAFT");
  if (filter.query && filter.query.trim()) {
    const term = `%${filter.query.trim()}%`;
    q = q.or(`code.ilike.${term},purpose.ilike.${term}`);
  }
  if (filter.from) q = q.gte("created_at", `${filter.from}T00:00:00`);
  if (filter.to) q = q.lte("created_at", `${filter.to}T23:59:59`);
  const { data } = await q.order("created_at", { ascending: false }).limit(limit);
  return ((data as TripJoined[] | null) ?? []).map(mapJoinedTrip);
}
