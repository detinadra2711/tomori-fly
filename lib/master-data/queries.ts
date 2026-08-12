import { createClient as createServerClient } from "@/lib/supabase/server";
import type { AirlineRow, CityRow } from "@/lib/supabase/types";
import type { Airline, City } from "@/types";

export function toAirline(row: AirlineRow): Airline {
  return { id: row.id, name: row.name, code: row.code ?? undefined, isActive: row.is_active };
}
export function toCity(row: CityRow): City {
  return { id: row.id, name: row.name, isActive: row.is_active };
}

/** Semua maskapai (untuk admin, termasuk nonaktif). */
export async function listAirlines(): Promise<Airline[]> {
  const supabase = await createServerClient();
  const { data } = await supabase.from("airlines").select("*").order("name");
  return ((data as AirlineRow[] | null) ?? []).map(toAirline);
}

/** Semua kota (untuk admin, termasuk nonaktif). */
export async function listCities(): Promise<City[]> {
  const supabase = await createServerClient();
  const { data } = await supabase.from("cities").select("*").order("name");
  return ((data as CityRow[] | null) ?? []).map(toCity);
}
