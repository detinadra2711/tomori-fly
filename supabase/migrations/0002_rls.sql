-- ============================================================================
-- TravelSys — RLS policies, role helpers, dan signup trigger
-- Jalankan SETELAH 0001_init.sql.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helper: ambil role user saat ini (security definer, cached via (select ...))
-- Disimpan di schema private agar tidak diekspos PostgREST.
-- ---------------------------------------------------------------------------
create or replace function private.current_role()
returns public.user_role
language sql
security definer
set search_path = ''
stable
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

-- Dipanggil langsung di dalam RLS policy, jadi 'authenticated' HARUS bisa execute.
-- SECURITY DEFINER menjaga keamanan (hanya memakai auth.uid() pemanggil).
revoke execute on function private.current_role() from public, anon;
grant execute on function private.current_role() to authenticated;

create or replace function private.has_role(target public.user_role)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = target
  );
$$;

revoke execute on function private.has_role(public.user_role) from public, anon;
grant execute on function private.has_role(public.user_role) to authenticated;

-- ---------------------------------------------------------------------------
-- Signup trigger: buat baris profiles otomatis saat user auth dibuat.
-- Metadata name/role/department diambil dari raw_user_meta_data.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email, role, department)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'user'),
    new.raw_user_meta_data ->> 'department'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.trip_requests enable row level security;
alter table public.flight_segments enable row level security;
alter table public.hotel_reservations enable row level security;

-- ---------------------------------------------------------------------------
-- profiles policies
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select_self_or_staff on public.profiles;
create policy profiles_select_self_or_staff on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select private.current_role()) in ('admin', 'officer', 'travel_agent')
  );

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all to authenticated
  using ((select private.has_role('admin')))
  with check ((select private.has_role('admin')));

-- ---------------------------------------------------------------------------
-- trip_requests policies
--   - owner: full akses ke miliknya
--   - officer/travel_agent/admin: read semua
--   - officer: boleh update status (approve/reject)
--   - travel_agent: boleh update (booking)
-- ---------------------------------------------------------------------------
drop policy if exists trip_requests_owner_select on public.trip_requests;
create policy trip_requests_owner_select on public.trip_requests
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select private.current_role()) in ('admin', 'officer', 'travel_agent')
  );

drop policy if exists trip_requests_owner_insert on public.trip_requests;
create policy trip_requests_owner_insert on public.trip_requests
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists trip_requests_owner_update on public.trip_requests;
create policy trip_requests_owner_update on public.trip_requests
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists trip_requests_owner_delete on public.trip_requests;
create policy trip_requests_owner_delete on public.trip_requests
  for delete to authenticated
  using (user_id = (select auth.uid()) and status = 'DRAFT');

drop policy if exists trip_requests_staff_update on public.trip_requests;
create policy trip_requests_staff_update on public.trip_requests
  for update to authenticated
  using ((select private.current_role()) in ('admin', 'officer', 'travel_agent'))
  with check ((select private.current_role()) in ('admin', 'officer', 'travel_agent'));

-- ---------------------------------------------------------------------------
-- Helper: cek kepemilikan/akses trip (untuk child tables)
-- ---------------------------------------------------------------------------
create or replace function private.can_access_trip(trip uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.trip_requests t
    where t.id = trip
      and (
        t.user_id = (select auth.uid())
        or (select role from public.profiles where id = (select auth.uid())) in ('admin', 'officer', 'travel_agent')
      )
  );
$$;

revoke execute on function private.can_access_trip(uuid) from public, anon;
grant execute on function private.can_access_trip(uuid) to authenticated;

create or replace function private.can_modify_trip(trip uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.trip_requests t
    where t.id = trip
      and (
        t.user_id = (select auth.uid())
        or (select role from public.profiles where id = (select auth.uid())) in ('admin', 'officer', 'travel_agent')
      )
  );
$$;

revoke execute on function private.can_modify_trip(uuid) from public, anon;
grant execute on function private.can_modify_trip(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- flight_segments policies
-- ---------------------------------------------------------------------------
drop policy if exists flight_segments_select on public.flight_segments;
create policy flight_segments_select on public.flight_segments
  for select to authenticated
  using ((select private.can_access_trip(trip_request_id)));

drop policy if exists flight_segments_write on public.flight_segments;
create policy flight_segments_write on public.flight_segments
  for all to authenticated
  using ((select private.can_modify_trip(trip_request_id)))
  with check ((select private.can_modify_trip(trip_request_id)));

-- ---------------------------------------------------------------------------
-- hotel_reservations policies
-- ---------------------------------------------------------------------------
drop policy if exists hotel_reservations_select on public.hotel_reservations;
create policy hotel_reservations_select on public.hotel_reservations
  for select to authenticated
  using ((select private.can_access_trip(trip_request_id)));

drop policy if exists hotel_reservations_write on public.hotel_reservations;
create policy hotel_reservations_write on public.hotel_reservations
  for all to authenticated
  using ((select private.can_modify_trip(trip_request_id)))
  with check ((select private.can_modify_trip(trip_request_id)));
