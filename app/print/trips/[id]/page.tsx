import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getTripServer } from "@/lib/trips/get-trip";
import { formatDateLong, formatDate } from "@/lib/format";
import { PrintTrigger } from "@/components/shell/PrintTrigger";
import type { TripRequest } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  PENDING: "Menunggu Diketahui",
  ACKNOWLEDGED: "Diketahui",
  REJECTED: "Dikembalikan",
  BOOKED: "Terbooking",
  CANCELLED: "Dibatalkan",
};

function jenis(trip: TripRequest): string {
  if (trip.tripType === "CUTI") return "CUTI";
  if (trip.tripType === "DINAS_LUAR") return "DINAS LUAR";
  return trip.dutyType?.replace("_", " ") ?? "DINAS";
}

export default async function TripPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const trip = await getTripServer(id);
  if (!trip) notFound();

  const isDinas = trip.tripType !== "CUTI";

  return (
    <main className="mx-auto max-w-3xl bg-white p-8 text-slate-900 print:p-0">
      <div className="mb-6 flex items-start justify-between border-b border-slate-300 pb-4">
        <div>
          <h1 className="text-2xl font-semibold">Detail Perjalanan</h1>
          <p className="mt-1 text-sm text-slate-500">TravelSys · {STATUS_LABEL[trip.status] ?? trip.status}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm">{trip.code}</p>
          <PrintTrigger />
        </div>
      </div>

      <Section title="Informasi Pemohon">
        <Grid>
          <Item label="Nama" value={trip.userName} />
          <Item label="No. HP" value={trip.userPhone ?? "-"} />
          <Item label="Kode GFF" value={trip.userGffCode ?? "-"} />
          <Item label="Kode Cabin Crew" value={trip.userBffCode ?? "-"} />
        </Grid>
      </Section>

      <Section title="Informasi Pengajuan">
        <Grid>
          <Item label="Jenis" value={jenis(trip)} />
          <Item label="Status" value={STATUS_LABEL[trip.status] ?? trip.status} />
          <Item label="Keperluan" value={trip.purpose} />
          <Item label="Dibuat" value={formatDateLong(trip.createdAt)} />
        </Grid>
      </Section>

      {!isDinas ? (
        <Section title="Periode Cuti">
          <p className="text-sm">{formatDateLong(trip.leaveStart)} — {formatDateLong(trip.leaveEnd)}</p>
        </Section>
      ) : (
        <>
          <Section title="Penerbangan">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-300 text-left text-xs uppercase text-slate-500">
                  <th className="py-2 pr-3">Rute</th>
                  <th className="py-2 pr-3">Maskapai</th>
                  <th className="py-2 pr-3">Tanggal</th>
                  <th className="py-2 pr-3">Jam</th>
                  <th className="py-2">Tiket</th>
                </tr>
              </thead>
              <tbody>
                {trip.segments.map((s) => (
                  <tr key={s.id} className="border-b border-slate-200 align-top">
                    <td className="py-2 pr-3">{s.originCity} → {s.destCity}</td>
                    <td className="py-2 pr-3">{s.airlineName}{s.flightCode ? ` (${s.flightCode})` : ""}</td>
                    <td className="py-2 pr-3">{formatDate(s.departureDate)}</td>
                    <td className="py-2 pr-3">{s.departureTime}{s.arrivalTime ? `–${s.arrivalTime}` : ""}</td>
                    <td className="py-2">{s.ticketNumber ?? "-"}{s.bookingCode ? ` / ${s.bookingCode}` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          {trip.hotel ? (
            <Section title="Hotel">
              <Grid>
                <Item label="Hotel" value={trip.hotel.hotelName} />
                <Item label="Kota" value={trip.hotel.city} />
                <Item label="Check-in" value={formatDate(trip.hotel.checkinDate)} />
                <Item label="Check-out" value={formatDate(trip.hotel.checkoutDate)} />
                <Item label="Ref. Booking" value={trip.hotel.bookingRef ?? "-"} />
                <Item label="Tipe Kamar" value={trip.hotel.roomType ?? "-"} />
              </Grid>
            </Section>
          ) : null}
        </>
      )}

      <p className="mt-10 text-xs text-slate-400">
        Dicetak {formatDateLong(new Date().toISOString())} · Dokumen ini dihasilkan otomatis oleh TravelSys.
      </p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>;
}
function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
