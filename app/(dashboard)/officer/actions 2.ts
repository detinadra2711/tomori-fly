"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import {
  setOfficerPassphrase,
  verifyOfficerPassphrase,
} from "@/lib/officer/passphrase";

export type OfficerResult = { ok: true } | { ok: false; error: string };

/**
 * Tandai pengajuan sebagai DIKETAHUI oleh Officer.
 * Wajib menyertakan passphrase (terpisah dari password login) yang telah
 * di-set Officer di profilnya. Officer bukan approver: tidak ada aksi menolak.
 */
export async function acknowledgeTrip(
  id: string,
  passphrase: string
): Promise<OfficerResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "officer" || !user.isActive) {
    return { ok: false, error: "Akses ditolak." };
  }

  if (!passphrase.trim()) {
    return { ok: false, error: "Passphrase wajib diisi." };
  }

  const valid = await verifyOfficerPassphrase(user.id, passphrase);
  if (!valid) {
    return {
      ok: false,
      error:
        "Passphrase salah atau belum diatur. Atur passphrase di halaman Profil.",
    };
  }

  const supabase = await createClient();

  const { data: trip } = await supabase
    .from("trip_requests")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (!trip) return { ok: false, error: "Pengajuan tidak ditemukan." };
  if (trip.status !== "PENDING") {
    return {
      ok: false,
      error: "Hanya pengajuan berstatus Menunggu yang dapat ditandai diketahui.",
    };
  }

  const { error } = await supabase
    .from("trip_requests")
    .update({
      status: "ACKNOWLEDGED",
      acknowledged_by: user.id,
      acknowledged_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "PENDING");

  if (error) return { ok: false, error: "Gagal menandai pengajuan." };

  revalidatePath("/officer/requests");
  revalidatePath(`/officer/requests/${id}`);
  return { ok: true };
}

/**
 * Set / ganti passphrase Officer (dari halaman Profil, oleh Officer sendiri).
 */
export async function setPassphrase(passphrase: string): Promise<OfficerResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "officer" || !user.isActive) {
    return { ok: false, error: "Akses ditolak." };
  }
  if (passphrase.trim().length < 6) {
    return { ok: false, error: "Passphrase minimal 6 karakter." };
  }

  const ok = await setOfficerPassphrase(user.id, passphrase.trim());
  if (!ok) return { ok: false, error: "Gagal menyimpan passphrase." };

  revalidatePath("/profile");
  return { ok: true };
}
