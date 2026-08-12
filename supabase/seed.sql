-- ============================================================================
-- TravelSys — seed data demo
-- Jalankan SETELAH 0001_init.sql dan 0002_rls.sql.
--
-- CATATAN: user auth harus dibuat lebih dulu. Ada dua cara:
--   (A) Dashboard Supabase > Authentication > Add user (email + password),
--       lalu isi "User Metadata" (raw_user_meta_data) misalnya:
--         { "name": "Isabella", "role": "user", "department": "Finance" }
--       Trigger on_auth_user_created akan otomatis membuat baris profiles.
--   (B) Pakai Admin API / service_role dari server (jangan di client).
--
-- Setelah user 'isabella@company.com' ada, seed di bawah mengisi contoh trip.
-- ============================================================================

do $$
declare
  isabella uuid;
begin
  select id into isabella from public.profiles where email = 'isabella@company.com';

  if isabella is null then
    raise notice 'User isabella@company.com belum ada. Buat dulu via Auth, lalu jalankan ulang seed ini.';
    return;
  end if;

  -- Bersihkan contoh lama milik user demo agar seed idempotent
  delete from public.trip_requests where user_id = isabella and code like 'TR-SEED-%';

  -- 1) DINAS ON DUTY — PENDING, dengan hotel
  with t as (
    insert into public.trip_requests (code, user_id, trip_type, duty_type, purpose, spkr_links, need_hotel, status)
    values ('TR-SEED-001', isabella, 'DINAS', 'ON_DUTY', 'ON DUTY', array['https://drive.google.com/spkr-001'], true, 'PENDING')
    returning id
  )
  insert into public.flight_segments (trip_request_id, airline_name, flight_code, origin_city, dest_city, departure_date, departure_time, arrival_time, segment_order)
  select id, 'Garuda Indonesia', 'GA-402', 'Jakarta (CGK)', 'Surabaya (SUB)', '2026-08-12', '07:30', '09:00', 1 from t;

  insert into public.hotel_reservations (trip_request_id, hotel_name, city, checkin_date, checkout_date, bed_type, notes)
  select id, 'Grand Mercure', 'Surabaya', '2026-08-12', '2026-08-15', 'KING_BED', 'Dekat kantor cabang' from public.trip_requests where code = 'TR-SEED-001';

  -- 2) DINAS LUAR — ACKNOWLEDGED (diketahui Officer), multi-segment
  with t as (
    insert into public.trip_requests (code, user_id, trip_type, purpose, spkr_links, need_hotel, status)
    values ('TR-SEED-002', isabella, 'DINAS_LUAR', 'DINAS LUAR', array['https://drive.google.com/spkr-002'], false, 'ACKNOWLEDGED')
    returning id
  )
  insert into public.flight_segments (trip_request_id, airline_name, origin_city, dest_city, departure_date, departure_time, arrival_time, segment_order)
  select id, 'Batik Air', 'Jakarta (CGK)', 'Makasar (UPG)', '2026-08-20', '10:15', '13:30', 1 from t;

  -- 3) CUTI — DRAFT
  insert into public.trip_requests (code, user_id, trip_type, leave_start, leave_end, purpose, status)
  values ('TR-SEED-003', isabella, 'CUTI', '2026-10-10', '2026-10-11', 'CUTI', 'DRAFT');

  raise notice 'Seed selesai untuk isabella@company.com';
end $$;
