-- ============================================================================
-- TravelSys — initial schema (Supabase / Postgres)
-- Jalankan di Supabase SQL Editor (Dashboard > SQL Editor > New query).
-- Idempotent sedapat mungkin agar aman dijalankan ulang saat dev.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Private schema untuk helper security-definer (tidak diekspos ke PostgREST)
-- ---------------------------------------------------------------------------
create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('admin', 'user', 'officer', 'travel_agent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.trip_type as enum ('CUTI', 'DINAS', 'DINAS_LUAR');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.duty_type as enum ('ON_DUTY', 'OFF_DUTY');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.trip_status as enum ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'BOOKED', 'CANCELLED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.bed_type as enum ('TWIN_BED', 'QUEEN_BED', 'KING_BED');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles — 1:1 dengan auth.users
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null,
  email       text not null,
  role        public.user_role not null default 'user',
  department  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- trip_requests
-- ---------------------------------------------------------------------------
create table if not exists public.trip_requests (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  trip_type       public.trip_type not null,
  duty_type       public.duty_type,
  leave_start     date,
  leave_end       date,
  purpose         text not null default '',
  spkr_links      text[] not null default '{}',
  need_hotel      boolean not null default false,
  status          public.trip_status not null default 'DRAFT',
  rejection_note  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- CUTI tidak memakai duty_type; DINAS/DINAS_LUAR memakainya
  constraint trip_requests_leave_range check (leave_end is null or leave_start is null or leave_end >= leave_start)
);

create index if not exists trip_requests_user_id_idx on public.trip_requests (user_id);
create index if not exists trip_requests_status_idx on public.trip_requests (status);
create index if not exists trip_requests_created_at_idx on public.trip_requests (created_at desc);

drop trigger if exists trip_requests_set_updated_at on public.trip_requests;
create trigger trip_requests_set_updated_at
  before update on public.trip_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- flight_segments
-- ---------------------------------------------------------------------------
create table if not exists public.flight_segments (
  id                uuid primary key default gen_random_uuid(),
  trip_request_id   uuid not null references public.trip_requests (id) on delete cascade,
  airline_name      text not null,
  flight_code       text,
  origin_city       text not null,
  dest_city         text not null,
  departure_date    date not null,
  departure_time    time not null,
  arrival_time      time,
  segment_order     smallint not null default 1,
  ticket_number     text,
  booking_code      text,
  constraint flight_segments_distinct_city check (origin_city <> dest_city)
);

create index if not exists flight_segments_trip_request_id_idx on public.flight_segments (trip_request_id);

-- ---------------------------------------------------------------------------
-- hotel_reservations (0..1 per trip)
-- ---------------------------------------------------------------------------
create table if not exists public.hotel_reservations (
  id                uuid primary key default gen_random_uuid(),
  trip_request_id   uuid not null unique references public.trip_requests (id) on delete cascade,
  hotel_name        text not null,
  city              text not null,
  checkin_date      date not null,
  checkout_date     date not null,
  bed_type          public.bed_type,
  notes             text,
  booking_ref       text,
  room_type         text,
  constraint hotel_reservations_date_range check (checkout_date >= checkin_date)
);

create index if not exists hotel_reservations_trip_request_id_idx on public.hotel_reservations (trip_request_id);
