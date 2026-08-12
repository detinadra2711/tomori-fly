-- ============================================================================
-- TravelSys — Master Data: airlines & cities
--
-- Menghapus hardcoding daftar maskapai & kota dari kode aplikasi.
--   - Semua user login boleh MEMBACA (untuk mengisi dropdown form).
--   - Hanya admin yang boleh menulis (insert/update/delete).
--   - Nilai awal di-seed dari daftar hardcoded sebelumnya.
--
-- Jalankan SETELAH 0010_notify_on_insert.sql.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- airlines
-- ---------------------------------------------------------------------------
create table if not exists public.airlines (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  code        text,              -- kode IATA opsional, mis. GA, JT
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists airlines_active_idx on public.airlines (is_active);

-- ---------------------------------------------------------------------------
-- cities
-- ---------------------------------------------------------------------------
create table if not exists public.cities (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,   -- label tampil, mis. "Jakarta (CGK)"
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists cities_active_idx on public.cities (is_active);

-- ---------------------------------------------------------------------------
-- RLS: baca untuk semua authenticated, tulis untuk admin saja
-- ---------------------------------------------------------------------------
alter table public.airlines enable row level security;
alter table public.cities enable row level security;

drop policy if exists airlines_select_all on public.airlines;
create policy airlines_select_all on public.airlines
  for select to authenticated using (true);

drop policy if exists airlines_admin_write on public.airlines;
create policy airlines_admin_write on public.airlines
  for all to authenticated
  using ((select private.has_role('admin')))
  with check ((select private.has_role('admin')));

drop policy if exists cities_select_all on public.cities;
create policy cities_select_all on public.cities
  for select to authenticated using (true);

drop policy if exists cities_admin_write on public.cities;
create policy cities_admin_write on public.cities
  for all to authenticated
  using ((select private.has_role('admin')))
  with check ((select private.has_role('admin')));

-- ---------------------------------------------------------------------------
-- Seed nilai awal (idempotent via unique name)
-- ---------------------------------------------------------------------------
insert into public.airlines (name, code) values
  ('Garuda Indonesia', 'GA'),
  ('Batik Air', 'ID'),
  ('Lion Air', 'JT'),
  ('Citilink', 'QG'),
  ('AirAsia', 'QZ')
on conflict (name) do nothing;

insert into public.cities (name) values
  ('Jakarta (CGK)'),
  ('Palembang (PLM)'),
  ('Yogyakarta (YIA)'),
  ('Surabaya (SUB)'),
  ('Makasar (UPG)'),
  ('Luwuk (LUW)')
on conflict (name) do nothing;
