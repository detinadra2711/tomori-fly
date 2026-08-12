import { createClient } from "@/lib/supabase/server";
import type { User } from "@/types";
import type { ProfileRow } from "@/lib/supabase/types";

function toUser(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    department: row.department ?? undefined,
    phone: row.phone ?? undefined,
    gffCode: row.gff_code ?? undefined,
    bffCode: row.bff_code ?? undefined,
    isActive: row.is_active,
  };
}

/**
 * Ambil profil user yang sedang login (server-side). Return null bila belum login.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();


  if (!profile) {
    // Fallback bila trigger profil belum berjalan.
    return {
      id: user.id,
      name: user.email?.split("@")[0] ?? "User",
      email: user.email ?? "",
      role: "user",
      isActive: true,
    };
  }

  return toUser(profile as ProfileRow);
}
