import { createClient } from "@/lib/supabase/server";
import type { TripStatus } from "@/types";

async function countStatus(status: TripStatus): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("trip_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", status);
  return count ?? 0;
}

export interface OfficerStats {
  pending: number;
  acknowledged: number;
  booked: number;
  total: number;
}

/** Statistik untuk dashboard Officer (seluruh pengajuan yang terlihat via RLS). */
export async function officerStats(): Promise<OfficerStats> {
  const supabase = await createClient();
  const [{ count: total }, pending, acknowledged, booked] = await Promise.all([
    supabase
      .from("trip_requests")
      .select("id", { count: "exact", head: true })
      .neq("status", "DRAFT"),
    countStatus("PENDING"),
    countStatus("ACKNOWLEDGED"),
    countStatus("BOOKED"),
  ]);
  return { pending, acknowledged, booked, total: total ?? 0 };
}

export interface AgentStats {
  queue: number;
  booked: number;
  returned: number;
}

/** Statistik untuk dashboard Travel Agent. */
export async function agentStats(): Promise<AgentStats> {
  const [queue, booked, returned] = await Promise.all([
    countStatus("ACKNOWLEDGED"),
    countStatus("BOOKED"),
    countStatus("REJECTED"),
  ]);
  return { queue, booked, returned };
}

export interface AdminStats {
  totalRequests: number;
  pending: number;
  acknowledged: number;
  booked: number;
}

/** Statistik pengajuan untuk dashboard Admin. */
export async function adminRequestStats(): Promise<AdminStats> {
  const supabase = await createClient();
  const [{ count: totalRequests }, pending, acknowledged, booked] =
    await Promise.all([
      supabase.from("trip_requests").select("id", { count: "exact", head: true }),
      countStatus("PENDING"),
      countStatus("ACKNOWLEDGED"),
      countStatus("BOOKED"),
    ]);
  return {
    totalRequests: totalRequests ?? 0,
    pending,
    acknowledged,
    booked,
  };
}
