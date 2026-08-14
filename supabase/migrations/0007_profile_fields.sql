-- ============================================================================
-- TravelSys — Kolom profil tambahan (dilengkapi user sendiri)
--   phone     : nomor HP (semua role)
--   gff_code  : Kode GFF (User & Admin; wajib untuk User di aplikasi)
--   bff_code  : Kode Cabin Crew (User & Admin)
--
-- Jalankan SETELAH 0006_travel_agent.sql.
-- ============================================================================

alter table public.profiles
  add column if not exists phone text,
  add column if not exists gff_code text,
  add column if not exists bff_code text;
