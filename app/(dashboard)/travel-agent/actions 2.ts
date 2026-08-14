"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { isHttpUrl } from "@/lib/validation/url";
import type { User } from "@/types";

export type AgentResult = { ok: true } | { ok: false; error: string };

export interface SegmentBooking {
  id: string;
  ticketNumber?: string;
  bookingCode?: string;
}

export interface HotelBooking {
  bookingRef?: string;
  roomType?: string;
}

async function requireAgent(): Promise<User | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "travel_agent" || !user.isActive) return null;
  return user;
}

function revalidate(id: string) {
  revalidatePath("/travel-agent/bookings");
  revalidatePath(`/travel-agent/bookings/${id}`);
}

/**
 * Simpan detail booking (nomor tiket & kode booking per segmen, ref & tipe
 * kamar hotel) tanpa mengubah status. Bisa disimpan bertahap.
 */
export async function saveBooking(
  tripId: string,
  segments: SegmentBooking[],
  hotel?: HotelBooking,
  ticketLinks?: string[]
): Promise<AgentResult> {
  const user = await requireAgent();
  if (!user) return { ok: false, error: "Akses ditolak." };

  const supabase = await createClient();

  const { data: trip } = await supabase
    .from("trip_requests")
    .select("status")
    .eq("id", tripId)
    .maybeSingle();
  if (!trip) return { ok: false, error: "Pengajuan tidak ditemukan." };
  if (trip.status !== "ACKNOWLEDGED") {
    return {
      ok: false,
      error: "Hanya pengajuan berstatus Diketahui yang dapat diproses.",
    };
  }

  if (ticketLinks) {
    const clean = sanitizeLinks(ticketLinks);
    const invalid = clean.find((l) => !isHttpUrl(l));
    if (invalid) return { ok: false, error: "Ada link tiket yang tidak valid." };
    const { error } = await supabase
      .from("trip_requests")
      .update({ ticket_links: clean })
      .eq("id", tripId);
    if (error) return { ok: false, error: "Gagal menyimpan link tiket." };
  }

  for (const seg of segments) {
    const { error } = await supabase
      .from("flight_segments")
      .update({
        ticket_number: seg.ticketNumber?.trim() || null,
        booking_code: seg.bookingCode?.trim() || null,
      })
      .eq("id", seg.id)
      .eq("trip_request_id", tripId);
    if (error) return { ok: false, error: "Gagal menyimpan detail penerbangan." };
  }

  if (hotel) {
    const { error } = await supabase
      .from("hotel_reservations")
      .update({
        booking_ref: hotel.bookingRef?.trim() || null,
        room_type: hotel.roomType?.trim() || null,
      })
      .eq("trip_request_id", tripId);
    if (error) return { ok: false, error: "Gagal menyimpan detail hotel." };
  }

  revalidate(tripId);
  return { ok: true };
}

/**
 * Tandai pengajuan selesai dibooking. Menyimpan detail terlebih dahulu bila
 * disertakan, lalu memindahkan status ACKNOWLEDGED -> BOOKED.
 */
export async function markBooked(
  tripId: string,
  segments: SegmentBooking[],
  hotel?: HotelBooking,
  ticketLinks?: string[]
): Promise<AgentResult> {
  const user = await requireAgent();
  if (!user) return { ok: false, error: "Akses ditolak." };

  const links = sanitizeLinks(ticketLinks ?? []);
  if (links.length === 0) {
    return {
      ok: false,
      error: "Minimal 1 link file tiket wajib disediakan sebelum menyelesaikan booking.",
    };
  }

  const saved = await saveBooking(tripId, segments, hotel, links);
  if (!saved.ok) return saved;

  const supabase = await createClient();
  const { error } = await supabase
    .from("trip_requests")
    .update({
      status: "BOOKED",
      booked_by: user.id,
      booked_at: new Date().toISOString(),
    })
    .eq("id", tripId)
    .eq("status", "ACKNOWLEDGED");
  if (error) return { ok: false, error: "Gagal menandai booking selesai." };

  revalidate(tripId);
  return { ok: true };
}

/**
 * Kembalikan pengajuan ke pemohon (REJECTED) dengan alasan wajib.
 */
export async function returnRequest(
  tripId: string,
  note: string
): Promise<AgentResult> {
  const user = await requireAgent();
  if (!user) return { ok: false, error: "Akses ditolak." };

  if (!note.trim()) {
    return { ok: false, error: "Alasan pengembalian wajib diisi." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("trip_requests")
    .update({ status: "REJECTED", rejection_note: note.trim() })
    .eq("id", tripId)
    .eq("status", "ACKNOWLEDGED");
  if (error) return { ok: false, error: "Gagal mengembalikan pengajuan." };

  revalidate(tripId);
  return { ok: true };
}

function sanitizeLinks(links: string[]): string[] {
  return links.map((l) => l.trim()).filter(Boolean);
}

