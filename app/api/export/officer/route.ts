import { getCurrentUser } from "@/lib/supabase/auth";
import { listOfficerRequestsForExport } from "@/lib/officer/requests";
import { csvResponse, tripsToCsv } from "@/lib/export/csv";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "officer" && user.role !== "admin")) {
    return new Response("Forbidden", { status: 403 });
  }
  const params = new URL(request.url).searchParams;
  const query = params.get("q") ?? undefined;
  const from = params.get("from") ?? undefined;
  const to = params.get("to") ?? undefined;

  const trips = await listOfficerRequestsForExport({ query, from, to });
  const suffix = from || to ? `${from ?? "awal"}_sd_${to ?? "kini"}` : new Date().toISOString().slice(0, 10);
  return csvResponse(tripsToCsv(trips), `rekap-pengajuan-${suffix}.csv`);
}
