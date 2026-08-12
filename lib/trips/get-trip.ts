import { createClient } from "@/lib/supabase/server";
import {
  mapJoinedTrip,
  TRIP_JOIN_SELECT,
  type TripJoined,
} from "@/lib/trips/map-joined";
import type { TripRequest } from "@/types";

/** Ambil satu pengajuan (server-side, dibatasi RLS pemanggil). */
export async function getTripServer(id: string): Promise<TripRequest | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trip_requests")
    .select(TRIP_JOIN_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return data ? mapJoinedTrip(data as TripJoined) : null;
}
