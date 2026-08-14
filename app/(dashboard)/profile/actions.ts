"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { requiresTravelCodes, showsTravelCodes } from "@/lib/profile/fields";
import { validatePassword } from "@/lib/admin/validation";
import { notifyPasswordChanged } from "@/lib/mail/notify";

export type ProfileResult =
  | { ok: true }
  | { ok: false; error: string; field?: string };

export interface OwnProfileInput {
  name: string;
  phone: string;
  gffCode?: string;
  bffCode?: string;
}

/**
 * Update profil milik sendiri. Field yang boleh diubah dibatasi (tidak termasuk
 * role/email/is_active). GFF/Cabin Crew hanya untuk role yang relevan; wajib bagi User.
 */
export async function updateOwnProfile(
  input: OwnProfileInput
): Promise<ProfileResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Belum login." };

  if (!input.name.trim())
    return { ok: false, error: "Nama lengkap wajib diisi.", field: "name" };
  if (!input.phone.trim())
    return { ok: false, error: "Nomor HP wajib diisi.", field: "phone" };
  if (!/^[0-9+()\-\s]{6,20}$/.test(input.phone.trim()))
    return { ok: false, error: "Format nomor HP tidak valid.", field: "phone" };

  const usesCodes = showsTravelCodes(user.role);
  const codesRequired = requiresTravelCodes(user.role);

  if (codesRequired) {
    if (!input.gffCode?.trim())
      return { ok: false, error: "Kode GFF wajib diisi.", field: "gffCode" };
    if (!input.bffCode?.trim())
      return { ok: false, error: "Kode Cabin Crew wajib diisi.", field: "bffCode" };
  }

  const patch: Record<string, string | null> = {
    name: input.name.trim(),
    phone: input.phone.trim(),
  };
  if (usesCodes) {
    patch.gff_code = input.gffCode?.trim() || null;
    patch.bff_code = input.bffCode?.trim() || null;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id);
  if (error) return { ok: false, error: "Gagal menyimpan profil." };

  revalidatePath("/profile");
  return { ok: true };
}

/**
 * Ganti password akun sendiri (Supabase Auth).
 */
export async function changeOwnPassword(
  newPassword: string
): Promise<ProfileResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Belum login." };

  const pwErr = validatePassword(newPassword);
  if (pwErr) return { ok: false, error: pwErr.message, field: "password" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: mapPasswordError(error.message) };

  // Notifikasi email konfirmasi (best-effort).
  await notifyPasswordChanged(user.id);

  return { ok: true };
}

function mapPasswordError(message?: string): string {
  const lower = (message ?? "").toLowerCase();
  if (lower.includes("same password") || lower.includes("different from the old"))
    return "Password baru harus berbeda dari password lama.";
  if (lower.includes("at least"))
    return "Password belum memenuhi ketentuan minimum Supabase.";
  if (lower.includes("weak") || lower.includes("easy to guess"))
    return "Password terlalu lemah. Gunakan kombinasi yang lebih kuat.";
  if (lower.includes("rate limit") || lower.includes("too many"))
    return "Terlalu banyak percobaan. Coba lagi beberapa saat.";
  if (lower.includes("reauthentication") || lower.includes("recently"))
    return "Sesi perlu diverifikasi ulang. Logout lalu login kembali, kemudian coba lagi.";
  return message || "Gagal mengubah password.";
}
