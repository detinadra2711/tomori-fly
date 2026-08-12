-- ============================================================================
-- TravelSys — FIX: RLS helper functions harus dapat dieksekusi oleh role
-- 'authenticated', karena dipanggil LANGSUNG di dalam policy yang dievaluasi
-- sebagai user 'authenticated'.
--
-- Migrasi 0002/0003 melakukan `revoke execute ... from authenticated`, yang
-- menyebabkan "permission denied for function" saat policy profiles dievaluasi,
-- sehingga SELECT profil gagal dan aplikasi jatuh ke fallback role 'user'.
--
-- Fungsi bersifat SECURITY DEFINER (jalan dengan privilege pemilik dan bypass
-- RLS internal), jadi memberi EXECUTE ke 'authenticated' aman: user tetap tidak
-- bisa membaca baris orang lain lewat fungsi ini (fungsi hanya memakai
-- auth.uid() milik pemanggil).
--
-- Jalankan SETELAH 0002_rls.sql dan 0003_user_admin.sql.
-- ============================================================================

-- Role authenticated perlu USAGE pada schema private agar bisa memanggil fungsi.
grant usage on schema private to authenticated;

grant execute on function private.current_role() to authenticated;
grant execute on function private.has_role(public.user_role) to authenticated;
grant execute on function private.can_access_trip(uuid) to authenticated;
grant execute on function private.can_modify_trip(uuid) to authenticated;
