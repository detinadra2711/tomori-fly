# TravelSys — Project Documentation

> Sistem internal untuk pengajuan perjalanan/cuti, proses Mengetahui oleh Officer, booking Travel Agent, administrasi akun, dan profil pengguna.

| Item | Value |
|---|---|
| Version | 0.1.0 |
| Framework | Next.js 16.2.12 App Router |
| UI | React 19.2.4 + Tailwind CSS 4 |
| Database/Auth | Supabase PostgreSQL + Auth + RLS |
| Package manager | pnpm 10 |

## Table of Contents

- [Overview](#overview)
- [Roles and Access](#roles-and-access)
- [Business Workflow](#business-workflow)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Supabase Migrations](#supabase-migrations)
- [Database Model](#database-model)
- [Security and RLS](#security-and-rls)
- [Routes](#routes)
- [Features by Role](#features-by-role)
- [Status Rules and Guards](#status-rules-and-guards)
- [Profile and Passphrase](#profile-and-passphrase)
- [Server Actions and Data Access](#server-actions-and-data-access)
- [UI Design System](#ui-design-system)
- [Validation Rules](#validation-rules)
- [Testing](#testing)
- [Deployment and Operations](#deployment-and-operations)
- [Known Limitations](#known-limitations)

## Overview

TravelSys mengelola pengajuan perjalanan karyawan dari pembuatan hingga booking penerbangan dan hotel.

Jenis pengajuan:

- **CUTI** — tidak membutuhkan penerbangan atau hotel.
- **ON DUTY** — perjalanan dinas pada masa penugasan.
- **OFF DUTY** — perjalanan terkait dinas di luar masa penugasan.
- **DINAS LUAR** — perjalanan dinas eksternal.

Untuk selain CUTI, user mengisi segmen penerbangan, hotel opsional, dan link SPKR Google Drive. Officer kemudian menandai pengajuan sebagai **Diketahui**. Officer bukan approver dan tidak dapat menolak. Setelah diketahui, Travel Agent memproses booking atau mengembalikan pengajuan dengan catatan wajib.

## Roles and Access

| Role | Tanggung jawab | Ajukan | Mengetahui | Booking | Kelola akun |
|---|---|---:|---:|---:|---:|
| `user` | Karyawan/pemohon | Ya | Tidak | Tidak | Tidak |
| `officer` | Memantau dan mengetahui | Ya | Ya | Tidak | Tidak |
| `travel_agent` | Pihak eksternal pemesanan | Tidak | Tidak | Ya | Tidak |
| `admin` | Administrator sistem | Ya | Lihat modul | Lihat modul | Ya |

Travel Agent hanya memiliki menu **Booking**. Route `/user/*` mengalihkan Travel Agent ke `/travel-agent/bookings`.

## Business Workflow

```text
DRAFT --submit--> PENDING --passphrase + Mengetahui--> ACKNOWLEDGED
                                               |
                         +-- ticket link + booking --> BOOKED
                         +-- return note -----------> REJECTED

REJECTED --perbaiki + submit ulang--> PENDING
PENDING  --cancel oleh user---------> CANCELLED
```

| Status | Deskripsi |
|---|---|
| `DRAFT` | Disimpan, belum dikirim. |
| `PENDING` | Menunggu Officer mengetahui. |
| `ACKNOWLEDGED` | Officer sudah mengetahui; siap dibooking. |
| `REJECTED` | Dikembalikan Travel Agent dengan catatan. |
| `BOOKED` | Booking selesai. |
| `CANCELLED` | Dibatalkan user saat masih `PENDING`. |

`APPROVED` adalah status lama dan sudah diganti menjadi `ACKNOWLEDGED`.

## Technology Stack

- Next.js 16.2.12, React 19.2.4, TypeScript 5.
- Tailwind CSS 4.
- Supabase Auth, PostgreSQL, `@supabase/ssr`, `@supabase/supabase-js`.
- `bcryptjs` untuk hash passphrase Officer.
- `lucide-react` untuk icon.
- `clsx`, `tailwind-merge`, `class-variance-authority` untuk UI utilities.

```bash
pnpm dev
pnpm lint
pnpm exec tsc --noEmit
pnpm build
pnpm start
```

## Architecture

```text
Browser
  +-- Client Components + Supabase browser client (publishable key)

Next.js server
  +-- Server Components: session/profile/data reads
  +-- Server Actions: mutations and role guards
  +-- Server Supabase client: session cookies + RLS
  +-- Admin Supabase client: service_role, server-only

Supabase
  +-- Auth identities and sessions
  +-- PostgreSQL application data
  +-- RLS policies
  +-- Database triggers for workflow invariants
```

`middleware.ts` refreshes Supabase cookies and redirects unauthenticated users to `/login`. Route-group layouts enforce role access again on the server.

## Project Structure

```text
app/
├── (auth)/login/
├── (dashboard)/admin/
├── (dashboard)/officer/
├── (dashboard)/profile/
├── (dashboard)/travel-agent/
└── (dashboard)/user/
components/
├── cards/
├── forms/
├── shell/
├── status/
└── ui/
lib/
├── admin/
├── officer/
├── profile/
├── supabase/
├── travel-agent/
├── trips/
├── validation/
├── format.ts
└── trip-store.ts
supabase/
├── migrations/
└── seed.sql
types/index.ts
middleware.ts
```

## Local Setup

Prerequisites: Node.js 20+ (22+ recommended), pnpm 10+, and a Supabase project.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

## Environment Variables

Create `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx
```

| Variable | Browser visible | Purpose |
|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Publishable browser/session key. |
| `SUPABASE_SERVICE_ROLE_KEY` | **No** | Admin Auth API and Officer passphrase operations. |

Never prefix the service-role key with `NEXT_PUBLIC_`. Never commit `.env.local`. Keep placeholders only in `.env.example`. Rotate any key that has been exposed or committed.

## Supabase Migrations

Run these files in Supabase Dashboard → SQL Editor in exact order:

| File | Purpose |
|---|---|
| `0001_init.sql` | Base enums, profiles, requests, flights, hotels, indexes. |
| `0002_rls.sql` | RLS policies, role helpers, profile trigger. |
| `0003_user_admin.sql` | Admin audit table and last-admin guard. |
| `0004_fix_rls_helpers.sql` | Grants required by RLS helper functions. |
| `0005_officer_acknowledge.sql` | Rename `APPROVED` to `ACKNOWLEDGED`; Officer rules. |
| `0006_travel_agent.sql` | Agent transitions, booking attribution, resubmission. |
| `0007_profile_fields.sql` | Phone, GFF, Cabin Crew fields. |
| `0008_passphrase_ticket_links.sql` | Officer passphrases and ticket-file links. |

### Initial administrator

Create an Auth user, verify its `profiles` row, then run:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@company.com';
```

`supabase/seed.sql` inserts sample travel data for an existing `isabella@company.com` profile. It does not create the Auth user.

## Database Model

### Main tables

| Table | Purpose |
|---|---|
| `auth.users` | Supabase-managed identities and credentials. |
| `public.profiles` | Application profile, role, and personal data. |
| `public.trip_requests` | Main request and workflow state. |
| `public.flight_segments` | One or more flights per request. |
| `public.hotel_reservations` | One optional hotel reservation per request. |
| `public.officer_pins` | bcrypt hash for Officer passphrase. |
| `public.user_admin_audit` | Admin account-management audit records. |

### `profiles`

```text
id, name, email, role, department, phone, gff_code, bff_code,
is_active, created_at, updated_at
```

Profile rules:

| Field | User | Officer | Travel Agent | Admin |
|---|---:|---:|---:|---:|
| Name | Self-edit | Self-edit | Self-edit | Self-edit + manage all |
| Phone | Self-edit | Self-edit | Self-edit | Self-edit + manage all |
| GFF | Required | Hidden | Hidden | Optional |
| Cabin Crew | Required | Hidden | Hidden | Optional |
| Email/role | Admin-managed | Admin-managed | Admin-managed | Admin-managed |

### `trip_requests`

```text
id, code, user_id, trip_type, duty_type, leave_start, leave_end,
purpose, spkr_links, need_hotel, status, ticket_links, rejection_note,
acknowledged_by, acknowledged_at, booked_by, booked_at,
created_at, updated_at
```

### `flight_segments`

```text
trip_request_id, airline_name, flight_code, origin_city, dest_city,
departure_date, departure_time, arrival_time, segment_order,
ticket_number, booking_code
```

### `hotel_reservations`

```text
trip_request_id, hotel_name, city, checkin_date, checkout_date,
bed_type, notes, booking_ref, room_type
```

## Security and RLS

Security uses multiple layers:

1. Middleware redirects anonymous visitors to `/login`.
2. Route layouts enforce role access.
3. Server Actions verify the current role.
4. RLS restricts table access in Supabase.
5. Database triggers enforce workflow transitions and invariants.
6. Service-role operations run only in server-side code.

Important rules:

- User can access their own profile and requests.
- Officer can read submitted requests and only change `PENDING → ACKNOWLEDGED`.
- Travel Agent can process acknowledged requests and booking data.
- Admin can manage profiles and administrative data.
- Anonymous users cannot read/write application data.
- `officer_pins` has no authenticated write policy; hashes are written through server-side admin code.

Server-only service-role modules:

- `lib/supabase/admin.ts`
- `app/(dashboard)/admin/actions.ts`
- `lib/officer/passphrase.ts`
- `app/(dashboard)/officer/actions.ts`
- `app/(dashboard)/travel-agent/actions.ts`

## Routes

| Route | Authorized roles | Purpose |
|---|---|---|
| `/login` | Public | Email/password login. |
| `/profile` | All authenticated roles | Profile, password, Officer passphrase. |
| `/user/dashboard` | User, Officer, Admin | User dashboard. |
| `/user/requests` | User, Officer, Admin | Request list/filter. |
| `/user/requests/new` | User, Officer, Admin | Create request. |
| `/user/requests/[id]` | Request owner | Request detail. |
| `/user/requests/[id]/edit` | Request owner | Edit Draft/Returned request. |
| `/officer/requests` | Officer, Admin | Officer monitor. |
| `/officer/requests/[id]` | Officer, Admin | Inspect and acknowledge. |
| `/travel-agent/bookings` | Travel Agent, Admin | Booking queue/history. |
| `/travel-agent/bookings/[id]` | Travel Agent, Admin | Booking detail/actions. |
| `/admin/users` | Admin | Account list/search/filter. |
| `/admin/users/new` | Admin | Create/invite account. |
| `/admin/users/[id]` | Admin | Account detail/actions. |
| `/admin/users/[id]/edit` | Admin | Edit account. |

## Features by Role

### User

1. Select ON DUTY, OFF DUTY, DINAS LUAR, or CUTI.
2. For non-CUTI requests, enter departure date, airline, optional flight code, origin, destination, departure time, and arrival time.
3. Add optional hotel name, city, dates, bed type, and notes.
4. Add SPKR Google Drive links; the first link is required for non-CUTI submission.
5. Save as Draft or submit.
6. View applicant profile data, status timeline, SPKR, and ticket links.
7. Cancel while `PENDING`.
8. Correct and resubmit `REJECTED` requests.

### Officer

1. Set a separate passphrase in `/profile`.
2. Open `/officer/requests`.
3. Inspect applicant, flight, hotel, and SPKR details.
4. Enter passphrase and click **Mengetahui**.
5. Status becomes `ACKNOWLEDGED`.
6. Officer cannot reject or alter request contents.

### Travel Agent

1. Open the Booking-only navigation.
2. Process only `ACKNOWLEDGED` requests.
3. Read applicant name, phone, GFF, and Cabin Crew for booking.
4. Enter ticket number and booking code per flight segment.
5. Enter hotel booking reference and room type when applicable.
6. Add at least one ticket-file URL; add more links for hotel/related files.
7. Save details, mark `BOOKED`, or return with a required reason.
8. Applicant can correct and resubmit returned requests.

### Admin

- Create accounts with an initial password or email invitation.
- Search/filter accounts by name, email, role, and activation status.
- Edit name, email, department, and role.
- Activate/deactivate accounts with self-protection and last-admin rules.
- Send password resets or set temporary passwords.
- Inspect account information and audit records stored in the database.

## Status Rules and Guards

| Actor | Allowed transition |
|---|---|
| User | `DRAFT → PENDING` |
| User | `PENDING → CANCELLED` |
| User | `REJECTED → PENDING` |
| Officer | `PENDING → ACKNOWLEDGED`, with passphrase |
| Travel Agent | `ACKNOWLEDGED → BOOKED` or `ACKNOWLEDGED → REJECTED` |

Additional guards:

- Travel Agent cannot set `BOOKED` without one or more `ticket_links`.
- Travel Agent must provide `rejection_note` for `REJECTED`.
- Officer cannot modify request content.
- Travel Agent cannot modify request content.
- Admin cannot deactivate or change the role of their own account.
- The last active admin cannot be removed or demoted.
- User cannot cancel after acknowledgement.

## Profile and Passphrase

### Profile fields

- All roles: full name and phone number.
- User/Admin: GFF and Cabin Crew fields are visible.
- User: GFF and Cabin Crew are required.
- Officer/Travel Agent: GFF and Cabin Crew are hidden.
- Email, role, and activation status are Admin-managed.

### Officer passphrase

- Separate from login password.
- Set or changed by Officer from `/profile`.
- Stored as a bcrypt hash in `officer_pins`.
- Verified only in a server action when Officer clicks **Mengetahui**.
- A missing or invalid passphrase prevents acknowledgement.

## Server Actions and Data Access

### Supabase clients

| Module | Purpose |
|---|---|
| `lib/supabase/client.ts` | Browser Supabase client. |
| `lib/supabase/server.ts` | Cookie-aware server Supabase client. |
| `lib/supabase/admin.ts` | Service-role client for server-only privileged actions. |
| `lib/supabase/auth.ts` | Current profile/session lookup. |
| `lib/supabase/middleware.ts` | Session refresh and anonymous redirect logic. |

### Main action modules

| Module | Actions |
|---|---|
| `app/(dashboard)/admin/actions.ts` | Create/update account, activation, password reset, audit logging. |
| `app/(dashboard)/officer/actions.ts` | Set passphrase, acknowledge trip. |
| `app/(dashboard)/travel-agent/actions.ts` | Save booking, mark booked, return request. |
| `app/(dashboard)/profile/actions.ts` | Update own profile, change own password. |
| `lib/trip-store.ts` | Create/update/submit/cancel user requests. |

### Shared utilities

- `lib/trips/map-joined.ts` maps Supabase joined trip rows into `TripRequest` domain objects.
- `lib/validation/url.ts` validates Google Drive and HTTP(S) URLs.
- `lib/format.ts` provides Indonesian date/date-time formatting.
- `lib/profile/fields.ts` determines profile fields by role.

## UI Design System

The interface uses a dark floating-card style.

### Colors

| Token | Color | Use |
|---|---|---|
| Base | `#2A2D35` | Application background |
| Panel | `#3D4A5C` | Main panel |
| Card | `#4A5568` | Content card |
| Detail panel | `#4A5E78` | Side panel |
| Green | `#22C55E` | Active, acknowledged, booked |
| Orange | `#F97316` | Pending/warning |
| Blue | `#3B82F6` | Informational/draft |
| Red | `#EF4444` | Returned/error |
| Muted | `#94A3B8` | Secondary text |

### Component conventions

- Large rounded panels: `24px` radius.
- Cards: `16px` radius.
- Depth comes from background contrast and soft shadows rather than hard borders.
- Reusable UI primitives: `Button`, `Input`, `Panel`, `StatusBadge`, `RequestCard`, `StatCard`.
- Responsive sidebar becomes bottom navigation on mobile.

## Validation Rules

### Travel request

- CUTI requires a valid leave start/end range.
- Non-CUTI requires at least one complete flight segment.
- Origin and destination cannot be the same.
- SPKR first link must be a valid Google Drive/docs URL when submitting non-CUTI.
- Optional extra SPKR links must also be valid when supplied.
- Hotel checkout cannot precede check-in.

### Profile

- Name and phone are required.
- Phone accepts 6–20 characters containing digits, `+`, parentheses, hyphen, or spaces.
- User role requires both GFF and Cabin Crew values.

### Credentials

- Password: minimum 8 characters, includes letters and numbers.
- Officer passphrase: minimum 6 characters and separate from login password by workflow design.

### Booking

- At least one HTTP/HTTPS ticket file link is required before `BOOKED`.
- Return action requires a non-empty reason.

## Testing

### Current verification commands

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Expected result: lint clean, TypeScript clean, and production build succeeds with all routes generated.

### Manual end-to-end scenario

1. Log in as User and complete profile data.
2. Create a non-CUTI request with SPKR link and submit it.
3. Log in as Officer, set passphrase, open request, and mark it **Diketahui**.
4. Log in as Travel Agent, enter ticket details and at least one ticket link, then mark `BOOKED`.
5. Verify User can view booked status and ticket links.
6. Repeat a request and use Travel Agent **Kembalikan** action with a note.
7. Verify User can edit and resubmit returned request.

### Recommended future automated tests

- Unit tests for URL, date, and field validation.
- Integration tests for status transitions.
- Integration tests for RLS/role restrictions.
- End-to-end tests for User → Officer → Travel Agent workflow.

## Deployment and Operations

### Production configuration

Configure the same environment variables as local development in the deployment platform. Keep `SUPABASE_SERVICE_ROLE_KEY` in server-only deployment secrets.

### Supabase operational checks

- Confirm all migrations 0001 through 0008 are applied.
- Confirm RLS is enabled for application tables.
- Confirm at least one active `admin` profile exists.
- Configure Supabase SMTP before relying on invitation/password-reset emails.
- Rotate any exposed service-role key.

### Session behavior

- Middleware refreshes Supabase session cookies.
- Login redirects authenticated users to `/user/dashboard`.
- Logout clears the Supabase browser session and returns to `/login`.

## Known Limitations

- There is no automated test framework installed yet.
- Email invitations and reset messages depend on Supabase SMTP configuration.
- Notification table/workflow is not implemented as an in-app notification UI.
- Admin audit data is stored, but a dedicated audit-log UI is not implemented.
- `middleware.ts` works in Next.js 16 but Next.js emits a deprecation warning encouraging a future `proxy.ts` migration.
- Pagination is not implemented for large request/account datasets.
- Current Supabase client data types are application-maintained rather than generated from Supabase CLI schema types.

---

## Related Documents

- `TRAVEL_BOOKING_PROJECT.md` — original product and schema reference.
- `IMPLEMENTATION_PLAN.md` — initial implementation plan.
- `docs/SPEC_USER_MANAGEMENT.md` — detailed technical specification for Admin User Management.

