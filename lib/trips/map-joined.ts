import type {
  FlightSegmentRow,
  HotelReservationRow,
  TripRequestRow,
} from "@/lib/supabase/types";
import type { TripRequest } from "@/types";

export type TripJoined = TripRequestRow & {
  flight_segments: FlightSegmentRow[] | null;
  hotel_reservations: HotelReservationRow[] | null;
  profiles: {
    name: string;
    phone: string | null;
    gff_code: string | null;
    bff_code: string | null;
  } | null;
};

export const TRIP_JOIN_SELECT =
  "*, flight_segments(*), hotel_reservations(*), profiles!trip_requests_user_id_fkey(name, phone, gff_code, bff_code)";

/** Map baris trip_requests (dengan join) menjadi domain TripRequest. */
export function mapJoinedTrip(row: TripJoined): TripRequest {
  const segments = (row.flight_segments ?? [])
    .slice()
    .sort((a, b) => a.segment_order - b.segment_order)
    .map((s) => ({
      id: s.id,
      airlineName: s.airline_name,
      flightCode: s.flight_code ?? undefined,
      originCity: s.origin_city,
      destCity: s.dest_city,
      departureDate: s.departure_date,
      departureTime: s.departure_time?.slice(0, 5) ?? "",
      arrivalTime: s.arrival_time?.slice(0, 5) ?? undefined,
      segmentOrder: s.segment_order,
      ticketNumber: s.ticket_number ?? undefined,
      bookingCode: s.booking_code ?? undefined,
    }));

  const h = row.hotel_reservations?.[0];

  return {
    id: row.id,
    code: row.code,
    userId: row.user_id,
    userName: row.profiles?.name ?? "—",
    userPhone: row.profiles?.phone ?? undefined,
    userGffCode: row.profiles?.gff_code ?? undefined,
    userBffCode: row.profiles?.bff_code ?? undefined,
    tripType: row.trip_type,
    dutyType: row.duty_type ?? undefined,
    leaveStart: row.leave_start ?? undefined,
    leaveEnd: row.leave_end ?? undefined,
    purpose: row.purpose,
    spkrLinks: row.spkr_links ?? [],
    needHotel: row.need_hotel,
    status: row.status,
    ticketLinks: row.ticket_links ?? [],
    rejectionNote: row.rejection_note ?? undefined,
    acknowledgedBy: row.acknowledged_by ?? undefined,
    acknowledgedAt: row.acknowledged_at ?? undefined,
    bookedBy: row.booked_by ?? undefined,
    bookedAt: row.booked_at ?? undefined,
    segments,
    hotel: h
      ? {
          id: h.id,
          hotelName: h.hotel_name,
          city: h.city,
          checkinDate: h.checkin_date,
          checkoutDate: h.checkout_date,
          bedType: h.bed_type ?? undefined,
          notes: h.notes ?? undefined,
          bookingRef: h.booking_ref ?? undefined,
          roomType: h.room_type ?? undefined,
        }
      : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
