import type {
  BedType,
  DutyType,
  Role,
  TripStatus,
  TripType,
} from "@/types";

export interface ProfileRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string | null;
  phone: string | null;
  gff_code: string | null;
  bff_code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TripRequestRow {
  id: string;
  code: string;
  user_id: string;
  trip_type: TripType;
  duty_type: DutyType | null;
  leave_start: string | null;
  leave_end: string | null;
  purpose: string;
  spkr_links: string[];
  need_hotel: boolean;
  status: TripStatus;
  ticket_links: string[];
  rejection_note: string | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  booked_by: string | null;
  booked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlightSegmentRow {
  id: string;
  trip_request_id: string;
  airline_name: string;
  flight_code: string | null;
  origin_city: string;
  dest_city: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string | null;
  segment_order: number;
  ticket_number: string | null;
  booking_code: string | null;
}

export interface HotelReservationRow {
  id: string;
  trip_request_id: string;
  hotel_name: string;
  city: string;
  checkin_date: string;
  checkout_date: string;
  bed_type: BedType | null;
  notes: string | null;
  booking_ref: string | null;
  room_type: string | null;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  trip_request_id: string | null;
  title: string;
  message: string;
  status: TripStatus | null;
  is_read: boolean;
  created_at: string;
}

export interface AirlineRow {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CityRow {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

type TableConfig<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: TableConfig<ProfileRow>;
      trip_requests: TableConfig<TripRequestRow>;
      flight_segments: TableConfig<FlightSegmentRow>;
      hotel_reservations: TableConfig<HotelReservationRow>;
      notifications: TableConfig<NotificationRow>;
      airlines: TableConfig<AirlineRow>;
      cities: TableConfig<CityRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: Role;
      trip_type: TripType;
      duty_type: DutyType;
      trip_status: TripStatus;
      bed_type: BedType;
    };
    CompositeTypes: Record<string, never>;
  };
}
