"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";

export type NotificationResult = { ok: true } | { ok: false; error: string };

/** Tandai satu notifikasi milik sendiri sebagai sudah dibaca. */
export async function markNotificationRead(
  id: string
): Promise<NotificationResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Belum login." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "Gagal memperbarui notifikasi." };

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Tandai semua notifikasi milik sendiri sebagai sudah dibaca. */
export async function markAllNotificationsRead(): Promise<NotificationResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Belum login." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);
  if (error) return { ok: false, error: "Gagal memperbarui notifikasi." };

  revalidatePath("/", "layout");
  return { ok: true };
}
