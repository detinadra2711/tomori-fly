-- ============================================================================
-- TravelSys — Passphrase Officer + Link tiket Travel Agent
--
--   1. officer_pins  : hash passphrase Officer (terpisah dari password login).
--                      Di-set sendiri oleh Officer via halaman profil.
--   2. trip_requests.ticket_links : array URL file tiket (pesawat/hotel),
--                      diisi Travel Agent. Minimal 1 sebelum status BOOKED.
--
-- Jalankan SETELAH 0007_profile_fields.sql.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) officer_pins (hash bcrypt)
-- ---------------------------------------------------------------------------
create table if not exists public.officer_pins (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  pin_hash    text not null,
  updated_at  timestamptz not null default now()
);

alter table public.officer_pins enable row level security;

-- Officer boleh tahu APAKAH dirinya sudah punya passphrase (baca baris sendiri),
-- namun hash tidak akan pernah dikirim ke UI (server action hanya membaca untuk verifikasi).
drop policy if exists officer_pins_select_self on public.officer_pins;
create policy officer_pins_select_self on public.officer_pins
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Insert/update/hapus hash dilakukan lewat server action (service context).
-- Tidak ada policy write untuk authenticated agar hash tak bisa ditulis dari client biasa.

-- ---------------------------------------------------------------------------
-- 2) ticket_links pada trip_requests
-- ---------------------------------------------------------------------------
alter table public.trip_requests
  add column if not exists ticket_links text[] not null default '{}';

-- ---------------------------------------------------------------------------
-- 3) Guard: Travel Agent tidak boleh BOOKED tanpa minimal 1 link tiket.
--    Ditegakkan di aplikasi juga, ini lapis DB.
-- ---------------------------------------------------------------------------
create or replace function public.guard_booking_requires_ticket()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'BOOKED' and old.status is distinct from 'BOOKED' then
    if coalesce(array_length(new.ticket_links, 1), 0) = 0 then
      raise exception 'Booking tidak dapat diselesaikan tanpa link tiket';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trip_requests_guard_ticket on public.trip_requests;
create trigger trip_requests_guard_ticket
  before update on public.trip_requests
  for each row execute function public.guard_booking_requires_ticket();
