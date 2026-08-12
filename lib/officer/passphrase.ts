import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Simpan (set/ganti) passphrase Officer sebagai hash bcrypt di officer_pins.
 * Dipakai dari server action; memakai service-role agar bisa menulis hash.
 */
export async function setOfficerPassphrase(userId: string, passphrase: string) {
  const admin = createAdminClient();
  const hash = await bcrypt.hash(passphrase, 10);
  const { error } = await admin.from("officer_pins").upsert(
    { user_id: userId, pin_hash: hash, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  return !error;
}

/** Apakah Officer sudah memiliki passphrase? */
export async function hasOfficerPassphrase(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("officer_pins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

/** Verifikasi passphrase terhadap hash tersimpan. */
export async function verifyOfficerPassphrase(
  userId: string,
  passphrase: string
): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("officer_pins")
    .select("pin_hash")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data?.pin_hash) return false;
  return bcrypt.compare(passphrase, data.pin_hash);
}
