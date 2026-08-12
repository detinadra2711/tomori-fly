-- ============================================================================
-- TravelSys — Admin User Management (audit log + last-admin guard)
-- Jalankan SETELAH 0001_init.sql dan 0002_rls.sql.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Audit action enum + tabel
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.admin_action as enum (
    'CREATE', 'UPDATE', 'ROLE_CHANGE', 'ACTIVATE', 'DEACTIVATE', 'PASSWORD_RESET'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.user_admin_audit (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles (id) on delete set null,
  target_id   uuid references public.profiles (id) on delete set null,
  action      public.admin_action not null,
  details     jsonb not null default '{}'::jsonb,  -- { before, after, ... }
  created_at  timestamptz not null default now()
);

create index if not exists user_admin_audit_target_id_idx on public.user_admin_audit (target_id);
create index if not exists user_admin_audit_actor_id_idx on public.user_admin_audit (actor_id);
create index if not exists user_admin_audit_created_at_idx on public.user_admin_audit (created_at desc);

-- ---------------------------------------------------------------------------
-- RLS: hanya admin yang boleh membaca audit; insert lewat service_role.
-- ---------------------------------------------------------------------------
alter table public.user_admin_audit enable row level security;

drop policy if exists user_admin_audit_admin_select on public.user_admin_audit;
create policy user_admin_audit_admin_select on public.user_admin_audit
  for select to authenticated
  using ((select private.has_role('admin')));

-- ---------------------------------------------------------------------------
-- Guard: cegah menghapus admin aktif terakhir (INV-1 / BR-2)
-- ---------------------------------------------------------------------------
create or replace function public.guard_last_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (old.role = 'admin' and old.is_active)
     and (new.role <> 'admin' or new.is_active = false) then
    if (select count(*) from public.profiles
        where role = 'admin' and is_active and id <> old.id) = 0 then
      raise exception 'Cannot remove the last active admin';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_last_admin on public.profiles;
create trigger profiles_guard_last_admin
  before update on public.profiles
  for each row execute function public.guard_last_admin();
