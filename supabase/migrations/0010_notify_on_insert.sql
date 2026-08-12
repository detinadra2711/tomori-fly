-- ============================================================================
-- TravelSys — Perbaikan notifikasi
--
-- Masalah: pengajuan baru dibuat LANGSUNG dengan status 'PENDING' (INSERT),
-- sedangkan trigger 0009 hanya AFTER UPDATE. Akibatnya Officer tidak menerima
-- notifikasi untuk pengajuan baru.
--
-- Perbaikan: fungsi menangani INSERT maupun UPDATE. Pada INSERT, old_status
-- dianggap NULL sehingga setiap status awal yang relevan tetap memicu notifikasi.
--
-- Jalankan SETELAH 0009_notifications.sql.
-- ============================================================================

create or replace function public.notify_on_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  applicant_name text;
  old_status     public.trip_status := null;
begin
  if tg_op = 'UPDATE' then
    old_status := old.status;
    -- Tidak ada perubahan status -> tidak ada notifikasi.
    if new.status is not distinct from old_status then
      return new;
    end if;
  end if;

  select name into applicant_name from public.profiles where id = new.user_id;
  applicant_name := coalesce(applicant_name, 'Pemohon');

  if new.status = 'PENDING' then
    insert into public.notifications (user_id, trip_request_id, title, message, status)
    select p.id, new.id, 'Pengajuan menunggu diketahui',
           applicant_name || ' mengirim pengajuan ' || new.code || '.',
           new.status
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
            'Pengajuan ' || new.code || ' telah selesai dibooking. Link tiket tersedia.',
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

-- Recreate trigger untuk INSERT dan UPDATE.
drop trigger if exists trip_requests_notify on public.trip_requests;
create trigger trip_requests_notify
  after insert or update on public.trip_requests
  for each row execute function public.notify_on_status_change();
