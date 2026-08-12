"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";

export type MasterResult = { ok: true } | { ok: false; error: string };

function revalidate() {
  revalidatePath("/admin/master");
}

async function guard(): Promise<MasterResult | null> {
  try {
    await assertAdmin();
    return null;
  } catch {
    return { ok: false, error: "Akses ditolak." };
  }
}

// ---------------------------------------------------------------------------
// Airlines
// ---------------------------------------------------------------------------

export async function createAirline(name: string, code?: string): Promise<MasterResult> {
  const denied = await guard();
  if (denied) return denied;
  if (!name.trim()) return { ok: false, error: "Nama maskapai wajib diisi." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("airlines")
    .insert({ name: name.trim(), code: code?.trim() || null });
  if (error) return { ok: false, error: error.message.includes("duplicate") ? "Maskapai sudah ada." : "Gagal menambah maskapai." };
  revalidate();
  return { ok: true };
}

export async function setAirlineActive(id: string, isActive: boolean): Promise<MasterResult> {
  const denied = await guard();
  if (denied) return denied;
  const supabase = await createClient();
  const { error } = await supabase.from("airlines").update({ is_active: isActive }).eq("id", id);
  if (error) return { ok: false, error: "Gagal memperbarui maskapai." };
  revalidate();
  return { ok: true };
}

export async function deleteAirline(id: string): Promise<MasterResult> {
  const denied = await guard();
  if (denied) return denied;
  const supabase = await createClient();
  const { error } = await supabase.from("airlines").delete().eq("id", id);
  if (error) return { ok: false, error: "Gagal menghapus maskapai." };
  revalidate();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Cities
// ---------------------------------------------------------------------------

export async function createCity(name: string): Promise<MasterResult> {
  const denied = await guard();
  if (denied) return denied;
  if (!name.trim()) return { ok: false, error: "Nama kota wajib diisi." };

  const supabase = await createClient();
  const { error } = await supabase.from("cities").insert({ name: name.trim() });
  if (error) return { ok: false, error: error.message.includes("duplicate") ? "Kota sudah ada." : "Gagal menambah kota." };
  revalidate();
  return { ok: true };
}

export async function setCityActive(id: string, isActive: boolean): Promise<MasterResult> {
  const denied = await guard();
  if (denied) return denied;
  const supabase = await createClient();
  const { error } = await supabase.from("cities").update({ is_active: isActive }).eq("id", id);
  if (error) return { ok: false, error: "Gagal memperbarui kota." };
  revalidate();
  return { ok: true };
}

export async function deleteCity(id: string): Promise<MasterResult> {
  const denied = await guard();
  if (denied) return denied;
  const supabase = await createClient();
  const { error } = await supabase.from("cities").delete().eq("id", id);
  if (error) return { ok: false, error: "Gagal menghapus kota." };
  revalidate();
  return { ok: true };
}
