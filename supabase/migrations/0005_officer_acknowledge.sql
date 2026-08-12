-- ============================================================================
-- TravelSys — Officer sebagai pihak "Mengetahui" (bukan approver)
--
-- Perubahan:
--   1. Enum trip_status: APPROVED -> ACKNOWLEDGED (istilah "Diketahui").
--   2. Kolom jejak: acknowledged_by / acknowledged_at pada trip_requests.
--   3. Officer TIDAK dapat menolak. Penolakan menjadi wewenang travel_agent.
--   4. RLS diperketat: officer hanya boleh mengubah PENDING -> ACKNOWLEDGED.
--
-- Jalankan SETELAH 0004_fix_rls_helpers.sql.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Rename nilai enum APPROVED -> ACKNOWLEDGED
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'trip_status' and e.enumlabel = 'APPROVED'
  ) then
    alter type public.trip_status rename value 'APPROVED' to 'ACKNOWLEDGED';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2) Jejak "mengetahui"
-- ---------------------------------------------------------------------------
alter table public.trip_requests
  add column if not exists acknowledged_by uuid references public.profiles (id) on delete set null,
  add column if not exists acknowledged_at timestamptz;

create index if not exists trip_requests_acknowledged_by_idx
  on public.trip_requests (acknowledged_by);

-- ---------------------------------------------------------------------------
-- 3) Helper: apakah user saat ini officer?
-- ---------------------------------------------------------------------------
create or replace function private.is_officer()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'officer' and is_active
  );
$$;

revoke execute on function private.is_officer() from public, anon;
grant execute on function private.is_officer() to authenticated;

-- ---------------------------------------------------------------------------
-- 4) RLS trip_requests: pisahkan hak officer vs travel_agent/admin
--    Officer  : hanya boleh membaca semua + menandai PENDING -> ACKNOWLEDGED.
--    Agent/Adm: boleh update untuk booking / menolak.
-- ---------------------------------------------------------------------------
drop policy if exists trip_requests_staff_update on public.trip_requests;

-- Officer: update terbatas. Guard transisi status ada di trigger (lihat 5).
drop policy if exists trip_requests_officer_update on public.trip_requests;
create policy trip_requests_officer_update on public.trip_requests
  for update to authenticated
  using ((select private.is_officer()))
  with check ((select private.is_officer()));

-- Travel agent & admin: update penuh (booking, tolak, dsb).
drop policy if exists trip_requests_agent_update on public.trip_requests;
create policy trip_requests_agent_update on public.trip_requests
  for update to authenticated
  using ((select private.current_role()) in ('admin', 'travel_agent'))
  with check ((select private.current_role()) in ('admin', 'travel_agent'));

-- ---------------------------------------------------------------------------
-- 5) Trigger guard: officer hanya boleh PENDING -> ACKNOWLEDGED,
--    dan tidak boleh menolak (REJECTED) atau mengubah isi pengajuan.
-- ---------------------------------------------------------------------------
create or replace function public.guard_officer_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role public.user_role;
begin
  select role into actor_role from public.profiles where id = (select auth.uid());

  if actor_role = 'officer' then
    -- Officer tidak boleh menolak.
    if new.status = 'REJECTED' then
      raise exception 'Officer tidak dapat menolak pengajuan';
    end if;

    -- Hanya transisi PENDING -> ACKNOWLEDGED yang diizinkan.
    if not (old.status = 'PENDING' and new.status = 'ACKNOWLEDGED') then
      raise exception 'Officer hanya dapat menandai pengajuan PENDING sebagai diketahui';
    end if;

    -- Officer tidak boleh mengubah isi pengajuan.
    if new.trip_type is distinct from old.trip_type
       or new.duty_type is distinct from old.duty_type
       or new.leave_start is distinct from old.leave_start
       or new.leave_end is distinct from old.leave_end
       or new.spkr_links is distinct from old.spkr_links
       or new.need_hotel is distinct from old.need_hotel
       or new.user_id is distinct from old.user_id then
      raise exception 'Officer tidak dapat mengubah isi pengajuan';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trip_requests_guard_officer on public.trip_requests;
create trigger trip_requests_guard_officer
  before update on public.trip_requests
  for each row execute function public.guard_officer_update();
