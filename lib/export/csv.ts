import type { TripRequest } from "@/types";

const DUTY_LABEL: Record<string, string> = {
  ON_DUTY: "ON DUTY",
  OFF_DUTY: "OFF DUTY",
};

function escapeCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const head = headers.map(escapeCell).join(",");
  const body = rows.map((r) => r.map(escapeCell).join(",")).join("\n");
  // BOM agar Excel mengenali UTF-8.
  return "\uFEFF" + head + "\n" + body;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  PENDING: "Menunggu",
  ACKNOWLEDGED: "Diketahui",
  REJECTED: "Dikembalikan",
  BOOKED: "Terbooking",
  CANCELLED: "Dibatalkan",
};

function jenis(trip: TripRequest): string {
  if (trip.tripType === "CUTI") return "CUTI";
  if (trip.tripType === "DINAS_LUAR") return "DINAS LUAR";
  return DUTY_LABEL[trip.dutyType ?? ""] ?? "DINAS";
}

/** Rekap pengajuan -> baris CSV. */
export function tripsToCsv(trips: TripRequest[]): string {
  const headers = [
    "Kode",
    "Pemohon",
    "No HP",
    "Kode GFF",
    "Kode BFF",
    "Jenis",
    "Status",
    "Keperluan",
    "Rute",
    "Hotel",
    "Dibuat",
  ];
  const rows = trips.map((t) => [
    t.code,
    t.userName,
    t.userPhone ?? "",
    t.userGffCode ?? "",
    t.userBffCode ?? "",
    jenis(t),
    STATUS_LABEL[t.status] ?? t.status,
    t.purpose,
    t.segments.map((s) => `${s.originCity}>${s.destCity}`).join(" | "),
    t.hotel ? `${t.hotel.hotelName} (${t.hotel.city})` : "",
    t.createdAt.slice(0, 10),
  ]);
  return toCsv(headers, rows);
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
