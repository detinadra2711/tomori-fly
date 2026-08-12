import { createClient as createAdminClientBase } from "@supabase/supabase-js";

/**
 * Supabase client dengan service_role key untuk operasi admin (auth.admin.*).
 * SERVER-ONLY. service_role BYPASS RLS — hanya panggil setelah assertAdmin().
 * Guard runtime memastikan modul ini tidak pernah dieksekusi di browser.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient() hanya boleh dipanggil di server.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY belum diset. Tambahkan di .env.local (server-only)."
    );
  }

  return createAdminClientBase(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
