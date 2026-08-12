import { createClient } from "@/lib/supabase/server";
import type { NotificationRow } from "@/lib/supabase/types";
import type { Notification } from "@/types";

function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    tripRequestId: row.trip_request_id ?? undefined,
    title: row.title,
    message: row.message,
    status: row.status ?? undefined,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

/** Notifikasi terbaru milik user login (RLS membatasi ke penerima). */
export async function listNotifications(limit = 15): Promise<Notification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return ((data as NotificationRow[] | null) ?? []).map(toNotification);
}

/** Jumlah notifikasi belum dibaca untuk badge di Topbar. */
export async function countUnread(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);
  if (error) return 0;
  return count ?? 0;
}
