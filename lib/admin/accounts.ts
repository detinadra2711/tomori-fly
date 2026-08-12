import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/supabase/types";
import type { AdminAccount } from "@/lib/admin/types";

function toAccount(row: ProfileRow): AdminAccount {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    department: row.department,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Ambil semua akun (RLS: hanya admin/staff yang bisa baca semua profiles).
 * Dipakai di halaman list admin (Server Component).
 */
export async function listAccounts(): Promise<AdminAccount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data as ProfileRow[] | null) ?? []).map(toAccount);
}

export async function getAccount(id: string): Promise<AdminAccount | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toAccount(data as ProfileRow) : null;
}

export interface AccountStats {
  total: number;
  active: number;
  admins: number;
}

/** Statistik akun untuk dashboard admin. */
export async function accountStats(): Promise<AccountStats> {
  const supabase = await createClient();
  const [{ count: total }, { count: active }, { count: admins }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin"),
  ]);
  return { total: total ?? 0, active: active ?? 0, admins: admins ?? 0 };
}

export interface PagedAccounts {
  accounts: AdminAccount[];
  count: number;
}

/** Account list dengan pagination server-side + pencarian opsional. */
export async function listAccountsPaged(
  from: number,
  to: number,
  query?: string
): Promise<PagedAccounts> {
  const supabase = await createClient();
  let q = supabase.from("profiles").select("*", { count: "exact" });
  if (query && query.trim()) {
    const term = `%${query.trim()}%`;
    q = q.or(`name.ilike.${term},email.ilike.${term}`);
  }
  const { data, count, error } = await q
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;
  return {
    accounts: ((data as ProfileRow[] | null) ?? []).map(toAccount),
    count: count ?? 0,
  };
}
