-- ============================================================================
-- TravelSys — Travel Agent (booking) + guard transisi status
--
-- Aturan:
--   Travel Agent hanya boleh memproses pengajuan yang sudah ACKNOWLEDGED:
--     ACKNOWLEDGED -> BOOKED     (booking selesai)
--     ACKNOWLEDGED -> REJECTED   (dikembalikan; wajib rejection_note)
--   User boleh submit ulang pengajuan yang dikembalikan:
--     REJECTED -> PENDING        (oleh pemilik)
--   Jejak booking: booked_by / booked_at.
--
-- Jalankan SETELAH 0005_officer_acknowledge.sql.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Jejak booking
-- ---------------------------------------------------------------------------
alter table public.trip_requests
  add column if not exists booked_by uuid references public.profiles (id) on delete set null,
  add column if not exists booked_at timestamptz;

create index if not exists trip_requests_booked_by_idx
  on public.trip_requests (booked_by);

-- ---------------------------------------------------------------------------
-- Helper: apakah user saat ini travel_agent aktif?
-- ---------------------------------------------------------------------------
create or replace function private.is_agent()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'travel_agent' and is_active
  );
$$;

revoke execute on function private.is_agent() from public, anon;
grant execute on function private.is_agent() to authenticated;

-- ---------------------------------------------------------------------------
-- Guard transisi status untuk travel_agent
-- ---------------------------------------------------------------------------
create or replace function public.guard_agent_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role public.user_role;
begin
  select role into actor_role from public.profiles where id = (select auth.uid());

  if actor_role = 'travel_agent' then
    -- Perubahan status hanya dari ACKNOWLEDGED, dan hanya ke BOOKED/REJECTED.
    if new.status is distinct from old.status then
      if old.status <> 'ACKNOWLEDGED' or new.status not in ('BOOKED', 'REJECTED') then
        raise exception 'Travel agent hanya dapat memproses pengajuan berstatus Diketahui menjadi Terbooking atau Dikembalikan';
      end if;
      if new.status = 'REJECTED' and coalesce(btrim(new.rejection_note), '') = '' then
        raise exception 'Alasan pengembalian wajib diisi';
      end if;
    end if;

    -- Travel agent tidak boleh mengubah isi pengajuan inti.
    if new.trip_type is distinct from old.trip_type
       or new.duty_type is distinct from old.duty_type
       or new.leave_start is distinct from old.leave_start
       or new.leave_end is distinct from old.leave_end
       or new.spkr_links is distinct from old.spkr_links
       or new.need_hotel is distinct from old.need_hotel
       or new.user_id is distinct from old.user_id
       or new.purpose is distinct from old.purpose then
      raise exception 'Travel agent tidak dapat mengubah isi pengajuan';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trip_requests_guard_agent on public.trip_requests;
create trigger trip_requests_guard_agent
  before update on public.trip_requests
  for each row execute function public.guard_agent_update();

-- ---------------------------------------------------------------------------
-- Guard resubmit oleh pemilik: REJECTED -> PENDING diizinkan.
-- (Owner update policy sudah ada; tambahkan pembersihan catatan pada resubmit
--  ditangani di aplikasi. Di sini hanya memastikan owner tidak melompati status.)
-- ---------------------------------------------------------------------------
create or replace function public.guard_owner_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role public.user_role;
begin
  select role into actor_role from public.profiles where id = (select auth.uid());

  -- Berlaku hanya bila yang mengubah adalah pemilik & bukan staff.
  if actor_role = 'user' and new.user_id = (select auth.uid()) then
    if new.status is distinct from old.status then
      -- Transisi yang diizinkan untuk pemilik:
      --   DRAFT -> PENDING        (submit)
      --   PENDING -> CANCELLED    (batalkan)
      --   REJECTED -> PENDING     (perbaiki & submit ulang)
      if not (
        (old.status = 'DRAFT' and new.status = 'PENDING') or
        (old.status = 'PENDING' and new.status = 'CANCELLED') or
        (old.status = 'REJECTED' and new.status = 'PENDING')
      ) then
        raise exception 'Transisi status tidak diizinkan untuk pemohon';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trip_requests_guard_owner_status on public.trip_requests;
create trigger trip_requests_guard_owner_status
  before update on public.trip_requests
  for each row execute function public.guard_owner_status();
