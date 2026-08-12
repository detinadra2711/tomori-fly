// Domain types — mengacu pada schema di TRAVEL_BOOKING_PROJECT.md.

export type Role = "admin" | "user" | "officer" | "travel_agent";

export type TripType = "CUTI" | "DINAS" | "DINAS_LUAR";

export type DutyType = "ON_DUTY" | "OFF_DUTY";

export type RequestType = DutyType | "DINAS_LUAR" | "CUTI";

export type TripStatus =
  | "DRAFT"
  | "PENDING"
  | "ACKNOWLEDGED" // sudah diketahui Officer
  | "REJECTED" // dikembalikan oleh Travel Agent
  | "BOOKED"
  | "CANCELLED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
  phone?: string;
  gffCode?: string;
  bffCode?: string;
  isActive: boolean;
}

export type BedType = "TWIN_BED" | "QUEEN_BED" | "KING_BED";

export interface FlightSegment {
  id: string;
  airlineName: string;
  flightCode?: string; // kode penerbangan, opsional
  originCity: string;
  destCity: string;
  departureDate: string; // ISO date
  departureTime: string; // HH:mm
  arrivalTime?: string; // HH:mm
  segmentOrder: number;
  ticketNumber?: string;
  bookingCode?: string;
}

export interface HotelReservation {
  id: string;
  hotelName: string;
  city: string;
  checkinDate: string; // ISO date
  checkoutDate: string; // ISO date
  bedType?: BedType;
  notes?: string;
  bookingRef?: string;
  roomType?: string;
}

export interface TripRequest {
  id: string;
  code: string; // human-friendly code, e.g. TR-2026-001
  userId: string;
  userName: string;
  userPhone?: string;
  userGffCode?: string;
  userBffCode?: string;
  tripType: TripType;
  dutyType?: DutyType;
  leaveStart?: string;
  leaveEnd?: string;
  purpose: string;
  spkrLinks?: string[];
  needHotel: boolean;
  status: TripStatus;
  ticketLinks?: string[];
  rejectionNote?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  bookedBy?: string;
  bookedAt?: string;
  segments: FlightSegment[];
  hotel?: HotelReservation;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface Notification {
  id: string;
  userId: string;
  tripRequestId?: string;
  title: string;
  message: string;
  status?: TripStatus;
  isRead: boolean;
  createdAt: string;
}

export interface Airline {
  id: string;
  name: string;
  code?: string;
  isActive: boolean;
}

export interface City {
  id: string;
  name: string;
  isActive: boolean;
}
