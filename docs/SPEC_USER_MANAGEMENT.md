# Technical Specification & Functional Requirements

## Admin User Management System — TravelSys

**Document status:** Draft v1.0
**Owner:** Engineering
**Scope:** Admin-only capability to create and manage accounts for all roles.
**Related docs:** `TRAVEL_BOOKING_PROJECT.md`, `IMPLEMENTATION_PLAN.md`
**Related code:** `supabase/migrations/*.sql`, `lib/supabase/*`, `types/index.ts`

---

## 1. Overview

### 1.1 Purpose

This document specifies the User Management System that allows a user with the
`admin` role to provision and manage accounts for every role in TravelSys
(`admin`, `user`, `officer`, `travel_agent`). It defines functional
requirements, data model changes, API/server-action contracts, security model,
UI/UX, validation rules, and acceptance criteria.

### 1.2 Background

The application currently supports Supabase Auth login and a `profiles` table
(1:1 with `auth.users`) carrying `role`, `department`, and `is_active`. New
users are provisioned only through the Supabase Dashboard. There is no in-app
administration surface. This feature closes that gap by giving admins a
self-service console.

### 1.3 Goals

- Admins create accounts (email + initial password or invite) with an assigned role.
- Admins list, search, filter, view, edit, deactivate/reactivate, and reset passwords for accounts.
- All privileged operations execute server-side using the Supabase **service_role** key, never exposed to the browser.
- The system enforces least privilege via RLS and server-side authorization guards.

### 1.4 Non-Goals

- Self-service public sign-up (registration remains admin-driven only).
- Bulk CSV import/export (deferred; see §12 Future Work).
- Fine-grained per-permission ACLs beyond the four fixed roles.
- Officer PIN/passphrase management (tracked separately in `TRAVEL_BOOKING_PROJECT.md`).
- Hard deletion of accounts with historical trip data (soft deactivate only).

---

## 2. Roles & Actors

| Actor | Description | Access to User Management |
|---|---|---|
| `admin` | System administrator | Full CRUD on all accounts (except cannot delete/deactivate self) |
| `officer` | Approver | None (no access to this module) |
| `travel_agent` | Booking agent | None |
| `user` | Requester | None |

Managed (target) roles an admin can assign: `admin`, `user`, `officer`, `travel_agent`.

---

## 3. Functional Requirements

Requirement IDs use the `FR-UM-x` convention. Priority: **M** = Must, **S** = Should, **C** = Could.

### 3.1 Account Creation

| ID | Priority | Requirement |
|---|---|---|
| FR-UM-01 | M | Admin can create a new account by providing: full name, email, role, and optional department. |
| FR-UM-02 | M | Admin chooses a provisioning mode: (a) set an initial password, or (b) send an email invitation link for the user to set their own password. |
| FR-UM-03 | M | Email must be unique across all accounts; the system rejects duplicates with a clear error. |
| FR-UM-04 | M | On creation, a matching `profiles` row is created with the chosen role, name, department, and `is_active = true`. |
| FR-UM-05 | S | If "set initial password" is used, admin can toggle "require password change on first login". |
| FR-UM-06 | S | Admin can create another `admin` account (no restriction on target role), subject to §7 authorization. |
| FR-UM-07 | C | The account creation form validates password strength when a password is entered manually. |

### 3.2 Account Listing, Search & Filter

| ID | Priority | Requirement |
|---|---|---|
| FR-UM-08 | M | Admin can view a paginated list of all accounts showing name, email, role, department, status (active/inactive), created date. |
| FR-UM-09 | M | Admin can search accounts by name or email (case-insensitive, partial match). |
| FR-UM-10 | M | Admin can filter by role and by status (active/inactive/all). |
| FR-UM-11 | S | List supports sorting by name, role, created date. |
| FR-UM-12 | S | List displays an aggregate summary (counts per role, active vs inactive). |

### 3.3 Account Detail & Edit

| ID | Priority | Requirement |
|---|---|---|
| FR-UM-13 | M | Admin can open an account detail view showing all profile fields and account metadata (created/updated timestamps, last sign-in if available). |
| FR-UM-14 | M | Admin can edit name, department, and role of any account. |
| FR-UM-15 | M | Changing an account's email is supported and updates both `auth.users` and `profiles` atomically (server-side). |
| FR-UM-16 | M | An admin cannot change **their own** role (prevents accidental self-lockout). |
| FR-UM-17 | S | Edits are validated the same way as creation (email format/uniqueness, required fields). |

### 3.4 Activation / Deactivation

| ID | Priority | Requirement |
|---|---|---|
| FR-UM-18 | M | Admin can deactivate an account, setting `is_active = false`. Deactivated users are blocked from signing in and from authenticated sessions. |
| FR-UM-19 | M | Admin can reactivate a deactivated account. |
| FR-UM-20 | M | An admin cannot deactivate their own account. |
| FR-UM-21 | S | The system prevents deactivating the **last remaining active admin** (guarantees at least one admin always exists). |
| FR-UM-22 | S | Deactivation immediately revokes active sessions (best-effort via server-side sign-out / token invalidation). |

### 3.5 Password Management

| ID | Priority | Requirement |
|---|---|---|
| FR-UM-23 | M | Admin can trigger a password reset for any account: either send a reset email or set a new temporary password. |
| FR-UM-24 | S | When a temporary password is set, admin may require a change on next login. |
| FR-UM-25 | C | Admin can resend the original invitation email if the account has never signed in. |

### 3.6 Auditability

| ID | Priority | Requirement |
|---|---|---|
| FR-UM-26 | S | Every privileged action (create, edit, role change, activate/deactivate, password reset) is recorded in an audit log with actor, target, action, timestamp, and before/after snapshot for role/status changes. |
| FR-UM-27 | C | Admin can view the audit log filtered by target account or actor. |

### 3.7 Feedback & Errors

| ID | Priority | Requirement |
|---|---|---|
| FR-UM-28 | M | All actions produce clear success/failure feedback; validation errors are field-specific where possible. |
| FR-UM-29 | M | Unauthorized access attempts to any user-management route or action are denied and redirected. |

---

## 4. System Architecture

### 4.1 Stack Alignment

- **Framework:** Next.js 16 (App Router), React 19, TypeScript.
- **Auth & DB:** Supabase Auth + Postgres with Row-Level Security (RLS).
- **Styling:** Tailwind v4 dark-slate design system (existing tokens).
- **Data access:** Server Components + **Server Actions** for all privileged writes.

### 4.2 Trust Boundary & Key Usage

```
Browser (publishable/anon key)                Server (service_role key)
  - Admin UI (React)                             - Server Actions / Route Handlers
  - Reads via RLS-protected queries    ────►     - Supabase Admin API (auth.admin.*)
  - NEVER holds service_role key                 - Authorization guard (must be admin)
                                                 - Writes to auth.users + profiles
```

**Critical constraint:** Creating auth users, changing emails/passwords, and
deleting/inviting users require the Supabase **service_role** key. This key
**must only** be used in server-side code (Server Actions / Route Handlers) and
stored in a server-only environment variable. It must never be imported into a
`"use client"` module or exposed via `NEXT_PUBLIC_*`.

### 4.3 New Environment Variable

| Variable | Location | Description |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only (`.env.local`, deployment secrets) | Service role key for Admin API. Never `NEXT_PUBLIC_`. Add to `.env.example` as a placeholder only. |

### 4.4 New Server Module (proposed)

- `lib/supabase/admin.ts` — creates a service-role Supabase client. Guarded by a runtime check that it is only ever called on the server (throws if `typeof window !== "undefined"`).
- `lib/admin/guard.ts` — `assertAdmin()` helper that loads the current profile via the standard server client and throws/redirects unless `role === 'admin' && is_active`.
- `app/(dashboard)/admin/actions.ts` — Server Actions: `createAccount`, `updateAccount`, `setAccountActive`, `resetPassword`, `changeRole`.

---

## 5. Data Model

### 5.1 Existing (unchanged)

`public.profiles` already provides: `id (uuid, FK auth.users)`, `name`, `email`,
`role (user_role enum)`, `department`, `is_active`, `created_at`, `updated_at`.

### 5.2 New: Audit Log Table (for FR-UM-26/27)

```sql
create type public.admin_action as enum (
  'CREATE', 'UPDATE', 'ROLE_CHANGE', 'ACTIVATE', 'DEACTIVATE', 'PASSWORD_RESET'
);

create table if not exists public.user_admin_audit (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid not null references public.profiles (id) on delete set null,
  target_id     uuid references public.profiles (id) on delete set null,
  action        public.admin_action not null,
  details       jsonb not null default '{}'::jsonb,  -- { before, after }
  created_at    timestamptz not null default now()
);

create index if not exists user_admin_audit_target_id_idx on public.user_admin_audit (target_id);
create index if not exists user_admin_audit_actor_id_idx  on public.user_admin_audit (actor_id);
create index if not exists user_admin_audit_created_at_idx on public.user_admin_audit (created_at desc);
```

FK columns are indexed per the schema best practice (index all foreign keys).

### 5.3 Constraints & Invariants

- **INV-1:** At least one active `admin` account must always exist (enforced in application logic and, optionally, a DB trigger — see §7.4).
- **INV-2:** `profiles.email` mirrors `auth.users.email`; both are updated together server-side.
- **INV-3:** `is_active = false` blocks authentication (enforced at sign-in guard and middleware).

---

## 6. Security Model (RLS & Authorization)

### 6.1 Existing RLS (already in place)

`profiles` has `profiles_admin_all` policy granting admins full row access via
`private.has_role('admin')`, and `profiles_select_self_or_staff` for reads.
These are reused; **reads and profile-only writes** by admins already pass RLS.

### 6.2 Privileged Auth Operations

Operations that touch `auth.users` (create user, change email/password, invite,
delete, force sign-out) are **not** governed by RLS — they use the Supabase
Admin API and therefore run with the service_role key inside Server Actions.
Every such action MUST first call `assertAdmin()`.

### 6.3 Audit Table RLS

```sql
alter table public.user_admin_audit enable row level security;

-- Only admins may read the audit log.
create policy user_admin_audit_admin_select on public.user_admin_audit
  for select to authenticated
  using ((select private.has_role('admin')));

-- Inserts happen from the service-role server context (bypasses RLS);
-- no client insert policy is granted.
```

### 6.4 Defense in Depth

1. **Middleware:** unauthenticated → `/login`.
2. **Route guard:** `admin` layout (`app/(dashboard)/admin/layout.tsx`) calls `assertAdmin()`; non-admins are redirected to their role home.
3. **Server Action guard:** every action re-checks `assertAdmin()` (never trust the client).
4. **RLS:** database-level backstop for profile reads/writes.
5. **Key isolation:** service_role key server-only.

---

## 7. Business Rules

- **BR-1 (Self-protection):** An admin cannot deactivate, delete, or change the role of their own account (FR-UM-16, FR-UM-20).
- **BR-2 (Last admin):** The system must reject any operation that would leave zero active admins (FR-UM-21, INV-1).
- **BR-3 (Email uniqueness):** Email must be unique; creation/edit fails on conflict (FR-UM-03).
- **BR-4 (Inactive = no access):** Deactivated accounts cannot authenticate; existing sessions are invalidated best-effort (FR-UM-18, FR-UM-22).
- **BR-5 (Provisioning integrity):** If `auth.users` creation succeeds but `profiles` creation fails (or vice versa), the operation is rolled back / compensated so no orphaned records remain (see §9.3).
- **BR-6 (Role assignment):** Only the four defined roles are assignable; any other value is rejected.

### 7.4 Optional Last-Admin DB Guard

```sql
-- Prevents demoting/deactivating the final active admin at the DB layer.
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
```

---

## 8. Server Action Contracts

All actions are `"use server"`, run `assertAdmin()` first, write the audit log
on success, and return a typed result. Inputs validated with Zod (or equivalent).

### 8.1 `createAccount`

```ts
type CreateAccountInput = {
  name: string;
  email: string;
  role: "admin" | "user" | "officer" | "travel_agent";
  department?: string;
  provisioning:
    | { mode: "password"; password: string; requireChange?: boolean }
    | { mode: "invite" };
};

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: string };
```

Behavior:
1. `assertAdmin()`.
2. Validate input (email format, role enum, password strength if provided).
3. `mode: "password"` → `auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name, role, department } })`.
   `mode: "invite"` → `auth.admin.inviteUserByEmail(email, { data: { name, role, department } })`.
4. Signup trigger creates the `profiles` row from metadata; verify it exists, else insert explicitly (idempotent, matches `handle_new_user`).
5. Write audit `CREATE`.

### 8.2 `updateAccount`

```ts
type UpdateAccountInput = {
  id: string;
  name?: string;
  department?: string | null;
  email?: string;         // triggers auth.admin.updateUserById email change
  role?: Role;            // subject to BR-1, BR-2
};
```

### 8.3 `setAccountActive`

```ts
type SetActiveInput = { id: string; isActive: boolean };
// Rejects self-deactivation (BR-1) and last-admin (BR-2).
// On deactivate: update profiles.is_active=false; best-effort auth.admin.signOut / ban.
```

### 8.4 `resetPassword`

```ts
type ResetPasswordInput =
  | { id: string; mode: "email" }               // send reset email
  | { id: string; mode: "temporary"; password: string; requireChange?: boolean };
```

### 8.5 `changeRole`

```ts
type ChangeRoleInput = { id: string; role: Role };
// Convenience wrapper over updateAccount with BR-1/BR-2 enforced.
```

---

## 9. Error Handling & Edge Cases

### 9.1 Validation Errors
Return `{ ok: false, error, field }` so the UI can highlight the offending
field (e.g., `field: "email"` for duplicates).

### 9.2 Supabase Admin API Errors
Map known errors to friendly Indonesian-language messages consistent with the
rest of the app (e.g., "Email sudah terdaftar." for duplicate email).

### 9.3 Partial Failure (BR-5)
If `auth.admin.createUser` succeeds but the `profiles` row cannot be
created/verified, the action attempts a compensating `auth.admin.deleteUser`
and returns an error, ensuring no orphaned auth user remains.

### 9.4 Concurrency
Last-admin and email-uniqueness checks are enforced at the DB layer
(unique constraint + trigger) so concurrent requests cannot violate invariants.

---

## 10. UI / UX Specification

Consistent with the existing dark-slate "floating cards" design system.

### 10.1 Navigation
- Add an **Admin** section to the sidebar, visible only when `role === 'admin'`.
- Entry: `Users` (icon `Users` from lucide-react) → `/admin/users`.

### 10.2 Routes

| Route | Purpose |
|---|---|
| `/admin/users` | List + search/filter + summary panel + "New account" button |
| `/admin/users/new` | Create account form |
| `/admin/users/[id]` | Account detail + actions (edit, activate/deactivate, reset password) |
| `/admin/users/[id]/edit` | Edit account form |

### 10.3 List Page
- Main `Panel` with search input, role filter, status filter.
- Row cards (reusing card styling): name, email, `StatusBadge`-style role/status chips, action affordance.
- Right-side `Panel tone="detail"` summary: total accounts, counts per role, active/inactive.

### 10.4 Create/Edit Form
- Sectioned form (mirrors `TripFormFields` pattern): Identitas (name, email, department), Peran (role selector as card buttons), Kredensial (provisioning mode: set password vs invite; password field with strength meter when manual).
- Primary action: "Buat Akun" / "Simpan Perubahan"; secondary: cancel.
- Inline field-level validation and a top-level error banner.

### 10.5 Detail Page
- Profile summary panel + metadata (created/updated, last sign-in).
- Action panel: Edit, Deactivate/Reactivate (with confirmation dialog), Reset Password (mode chooser).
- Destructive/irreversible actions require an explicit confirmation step.

### 10.6 States
- Loading skeletons/spinners consistent with existing pages.
- Empty state for no results.
- Disabled controls for self-targeting actions (BR-1) with tooltip explaining why.

---

## 11. Acceptance Criteria (per key requirement)

- **AC-01 (Create):** Given an admin on `/admin/users/new`, when they submit a valid name/email/role with a password, then a new account is created, a `profiles` row exists with the chosen role, and they are redirected to the new account's detail page. (FR-UM-01/04)
- **AC-02 (Invite):** Given invite mode, when submitted, then an invitation email is sent and the account appears as "belum login" until first sign-in. (FR-UM-02)
- **AC-03 (Duplicate email):** Given an email already in use, when creating, then the form shows a field-level "Email sudah terdaftar." error and no account is created. (FR-UM-03)
- **AC-04 (Filter/search):** Given accounts of mixed roles/status, when filtering by role and searching by name, then only matching rows are shown. (FR-UM-09/10)
- **AC-05 (Role change):** Given a non-self target, when an admin changes the role, then the profile updates and an audit `ROLE_CHANGE` is recorded. (FR-UM-14, FR-UM-26)
- **AC-06 (Self-protection):** Given an admin viewing their own account, then role change and deactivate controls are disabled and server actions reject the operation. (FR-UM-16/20, BR-1)
- **AC-07 (Last admin):** Given exactly one active admin, when attempting to deactivate or demote them, then the operation is rejected with a clear message. (FR-UM-21, BR-2)
- **AC-08 (Deactivate blocks login):** Given a deactivated account, when the user attempts to sign in, then access is denied. (FR-UM-18, BR-4)
- **AC-09 (Password reset):** Given any account, when an admin sends a reset email or sets a temporary password, then the corresponding auth action succeeds and is audited. (FR-UM-23/26)
- **AC-10 (Authorization):** Given a non-admin, when they navigate to any `/admin/*` route or invoke an admin server action directly, then they are denied/redirected. (FR-UM-29)
- **AC-11 (Key isolation):** The service_role key never appears in any client bundle (verified by build inspection / absence of `NEXT_PUBLIC_` prefix).

---

## 12. Testing Strategy

- **Unit:** input validation (Zod schemas), business-rule guards (self-protection, last-admin), error mapping.
- **Integration:** server actions against a Supabase test project — create/update/deactivate/reset flows, partial-failure compensation.
- **RLS/policy tests:** verify non-admins cannot read/write `profiles` or `user_admin_audit`; verify admins can.
- **E2E:** admin creates → user logs in; admin deactivates → login blocked; last-admin rejection.
- **Security review:** confirm service_role key is server-only; confirm all actions re-check `assertAdmin()`.

---

## 13. Rollout & Migration

1. Add migration `0003_user_admin.sql` (audit enum/table + RLS + optional last-admin trigger).
2. Add `SUPABASE_SERVICE_ROLE_KEY` to server env / deployment secrets.
3. Ship server module (`lib/supabase/admin.ts`, guard, actions) behind the admin route group.
4. Ensure at least one active admin exists before enabling last-admin guard.
5. Progressive: read-only listing first, then create, then edit/deactivate/reset.

---

## 14. Future Work (Out of Scope)

- Bulk CSV import/export of accounts.
- Officer PIN/passphrase provisioning integration.
- SSO / SAML, MFA enrollment management.
- Granular permission sets beyond fixed roles.
- Email template customization for invites/resets.

---

## 15. Open Questions

1. Should invited-but-never-logged-in accounts auto-expire after N days?
2. Is a hard-delete (with cascade of trip data) ever required, or is deactivate always sufficient?
3. Should role changes force re-authentication of the affected user's active sessions?
4. Do we need per-department scoping of admins (e.g., department admins) in a later phase?
