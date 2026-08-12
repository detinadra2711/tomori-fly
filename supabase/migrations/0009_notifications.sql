-- ============================================================================
-- TravelSys — Notifikasi in-app
--
--   1. Tabel notifications (per penerima).
--   2. RLS: penerima hanya bisa membaca & menandai notifikasinya sendiri.
--   3. Trigger: otomatis membuat notifikasi setiap kali status trip_requests
--      berubah, dengan penerima sesuai alur:
--        DRAFT      -> PENDING       : semua Officer aktif
--        PENDING    -> ACKNOWLEDGED  : pemohon + semua Travel Agent aktif
--        ACKNOWLEDGED -> BOOKED      : pemohon
--        ACKNOWLEDGED -> REJECTED    : pemohon
--        PENDING    -> CANCELLED     : semua Officer aktif
--        REJECTED   -> PENDING       : semua Officer aktif (submit ulang)
--
-- Jalankan SETELAH 0008_passphrase_ticket_links.sql.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Tabel notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  trip_request_id uuid references public.trip_requests (id) on delete cascade,
  title           text not null,
  message         text not null,
  status          public.trip_status,
  is_read         boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists notifications_trip_request_id_idx on public.notifications (trip_request_id);
create index if not exists notifications_created_at_idx on public.notifications (created_at desc);
-- Index parsial untuk hitung badge "belum dibaca" secara efisien.
create index if not exists notifications_unread_idx
  on public.notifications (user_id) where is_read = false;

-- ---------------------------------------------------------------------------
-- 2) RLS: hanya penerima yang boleh baca / menandai sudah dibaca.
-- ---------------------------------------------------------------------------
alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Tidak ada policy INSERT untuk authenticated:
-- notifikasi hanya dibuat oleh trigger (security definer).

-- ---------------------------------------------------------------------------
-- 3) Trigger fan-out saat status berubah
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  applicant_name text;
  label          text;
  body           text;
begin
  -- Hanya bereaksi pada perubahan status.
  if new.status is not distinct from old.status then
    return new;
  end if;

  select name into applicant_name from public.profiles where id = new.user_id;
  applicant_name := coalesce(applicant_name, 'Pemohon');

  if new.status = 'PENDING' then
    label := 'Pengajuan menunggu diketahui';
    body  := applicant_name || ' mengirim pengajuan ' || new.code || '.';
    insert into public.notifications (user_id, trip_request_id, title, message, status)
    select p.id, new.id, label, body, new.status
    from public.profiles p
    where p.role = 'officer' and p.is_active;

  elsif new.status = 'ACKNOWLEDGED' then
    insert into public.notifications (user_id, trip_request_id, title, message, status)
    values (new.user_id, new.id, 'Pengajuan telah diketahui',
            'Pengajuan ' || new.code || ' telah diketahui Officer dan diteruskan ke Travel Agent.',
            new.status);

    insert into public.notifications (user_id, trip_request_id, title, message, status)
    select p.id, new.id, 'Pengajuan siap diproses',
           'Pengajuan ' || new.code || ' dari ' || applicant_name || ' siap dibooking.',
           new.status
    from public.profiles p
    where p.role = 'travel_agent' and p.is_active;

  elsif new.status = 'BOOKED' then
    insert into public.notifications (user_id, trip_request_id, title, message, status)
    values (new.user_id, new.id, 'Booking selesai',
            'Pengajuan ' || new.code || ' telah selesai dibooking.',
            new.status);

  elsif new.status = 'REJECTED' then
    insert into public.notifications (user_id, trip_request_id, title, message, status)
    values (new.user_id, new.id, 'Pengajuan dikembalikan',
            'Pengajuan ' || new.code || ' dikembalikan: ' ||
            coalesce(nullif(btrim(new.rejection_note), ''), 'tanpa catatan'),
            new.status);

  elsif new.status = 'CANCELLED' then
    insert into public.notifications (user_id, trip_request_id, title, message, status)
    select p.id, new.id, 'Pengajuan dibatalkan',
           applicant_name || ' membatalkan pengajuan ' || new.code || '.',
           new.status
    from public.profiles p
    where p.role = 'officer' and p.is_active;
  end if;

  return new;
end;
$$;

drop trigger if exists trip_requests_notify on public.trip_requests;
create trigger trip_requests_notify
  after update on public.trip_requests
  for each row execute function public.notify_on_status_change();
