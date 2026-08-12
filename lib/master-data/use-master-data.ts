"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AirlineRow, CityRow } from "@/lib/supabase/types";

export interface MasterData {
  airlines: string[];
  cities: string[];
  loading: boolean;
}

/**
 * Muat daftar maskapai & kota aktif untuk mengisi dropdown form pengajuan.
 * Semua user login boleh membaca (RLS select true).
 */
export function useMasterData(): MasterData {
  const [airlines, setAirlines] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const [a, c] = await Promise.all([
        supabase.from("airlines").select("name").eq("is_active", true).order("name"),
        supabase.from("cities").select("name").eq("is_active", true).order("name"),
      ]);
      if (!active) return;
      setAirlines(((a.data as Pick<AirlineRow, "name">[] | null) ?? []).map((r) => r.name));
      setCities(((c.data as Pick<CityRow, "name">[] | null) ?? []).map((r) => r.name));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { airlines, cities, loading };
}
