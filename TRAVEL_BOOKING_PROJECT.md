# Travel Booking & Hotel Reservation System

> Sistem web-based untuk pemesanan tiket penerbangan dan reservasi hotel internal perusahaan, dengan alur approval Officer dan eksekusi oleh Travel Agent.

---

## Daftar Isi

- [Overview Sistem](#overview-sistem)
- [Role & Hak Akses](#role--hak-akses)
- [Workflow Lengkap](#workflow-lengkap)
  - [Alur CUTI](#alur-cuti)
  - [Alur DINAS](#alur-dinas)
- [Fitur Per Role](#fitur-per-role)
- [Database Schema](#database-schema)
- [Tech Stack Rekomendasi](#tech-stack-rekomendasi)
- [Struktur Folder Project](#struktur-folder-project)
- [API Endpoints](#api-endpoints)
- [Business Rules](#business-rules)
- [Status Flow Pengajuan](#status-flow-pengajuan)
- [UI Pages / Routes](#ui-pages--routes)
- [To-Do & Progress](#to-do--progress)

---

## Overview Sistem

Sistem ini memungkinkan karyawan (User) untuk mengajukan permohonan perjalanan — baik CUTI maupun DINAS — secara digital. Pengajuan harus mendapat persetujuan Officer sebelum Travel Agent dapat melakukan booking aktual ke maskapai dan hotel.

**Prinsip utama:**
- Semua pengajuan wajib melalui approval Officer
- Officer menggunakan PIN/Passphrase terpisah dari password login
- Travel Agent hanya bisa booking setelah status pengajuan = `APPROVED`
- Lampiran SPKR (link Google Drive) wajib untuk pengajuan DINAS

---

## Role & Hak Akses

| Role | Deskripsi | Hak Akses |
|---|---|---|
| `admin` | Administrator sistem | Register user, kelola master data flight & hotel |
| `user` | Karyawan / Pemohon | Buat & pantau pengajuan perjalanan |
| `officer` | Pejabat penyetuju | Review & ACC pengajuan via PIN/Passphrase |
| `travel_agent` | Petugas booking | Booking flight & hotel setelah approved |

---

## Workflow Lengkap

### Alur CUTI

```
User login
  └─► Pilih jenis perjalanan: CUTI
        └─► Isi form:
              - Tanggal mulai cuti
              - Tanggal selesai cuti
              - Keterangan / keperluan
              - Link SPKR GDrive (opsional)
        └─► Submit → notifikasi ke Officer
              └─► Officer review
                    ├─► ACC (input PIN/Passphrase) → status: APPROVED
                    │     └─► Notifikasi ke User (tidak perlu booking)
                    └─► Tolak (isi alasan) → status: REJECTED
                          └─► Notifikasi ke User
```

> Catatan: Pengajuan CUTI **tidak memerlukan** pemilihan maskapai dan hotel. Tidak ada proses booking oleh Travel Agent.

---

### Alur DINAS

```
User login
  └─► Pilih jenis perjalanan: DINAS
        └─► Pilih tipe: ON DUTY / OFF DUTY
              └─► Isi detail penerbangan:
                    - Pilih maskapai (dropdown dari master data)
                    - Tanggal & jam berangkat
                    - Kota asal → Kota tujuan
                    [+ Tambah penerbangan? → ulangi untuk segment berikutnya]
              └─► Pilih hotel? (Ya / Tidak)
                    ├─► Ya: Pilih hotel (dropdown), tanggal check-in & check-out
                    └─► Tidak: lewati
              └─► Input link GDrive SPKR (WAJIB)
                    └─► Validasi: link harus terisi & format valid
              └─► Submit → notifikasi ke Officer
                    └─► Officer review pengajuan + cek SPKR
                          ├─► ACC (input PIN/Passphrase) → status: APPROVED
                          │     └─► Notifikasi ke Travel Agent
                          │           └─► Travel Agent booking flight & hotel
                          │                 └─► Update status: BOOKED
                          │                       └─► Kirim konfirmasi ke User
                          └─► Tolak (isi alasan) → status: REJECTED
                                └─► Notifikasi ke User
```

---

## Fitur Per Role

### Admin
- [ ] Login & manajemen sesi
- [ ] Register user baru (nama, email, role, department)
- [ ] Edit & nonaktifkan user
- [ ] CRUD master data maskapai (nama, kode, logo)
- [ ] CRUD master data hotel (nama, kota, bintang, kontak)
- [ ] Lihat semua pengajuan (read-only)
- [ ] Dashboard statistik pengajuan

### User
- [ ] Login & manajemen profil
- [ ] Buat pengajuan baru (CUTI / DINAS)
  - [ ] Form CUTI: tanggal & keterangan
  - [ ] Form DINAS: multi-segment flight + opsional hotel + SPKR
- [ ] Lihat daftar & status pengajuan milik sendiri
- [ ] Lihat detail pengajuan + histori status
- [ ] Batalkan pengajuan (hanya jika status masih `PENDING`)

### Officer
- [ ] Login dengan akun biasa
- [ ] Lihat daftar pengajuan yang menunggu approval
- [ ] Detail pengajuan: data flight, hotel, link SPKR
- [ ] ACC pengajuan → input PIN/Passphrase (terpisah dari password login)
- [ ] Tolak pengajuan → wajib isi alasan penolakan
- [ ] Riwayat pengajuan yang sudah diproses

### Travel Agent
- [ ] Login & manajemen sesi
- [ ] Lihat daftar pengajuan berstatus `APPROVED`
- [ ] Detail pengajuan: data penerbangan & hotel
- [ ] Update detail booking (no. tiket, no. booking hotel, dll.)
- [ ] Ubah status menjadi `BOOKED`
- [ ] Upload bukti booking (opsional: file atau link)
- [ ] Lihat riwayat booking

---

## Database Schema

### Tabel `users`
```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(100) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,         -- hashed
  role        ENUM('admin','user','officer','travel_agent') NOT NULL,
  department  VARCHAR(100),
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);
```

### Tabel `officer_pins`
```sql
CREATE TABLE officer_pins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  pin_hash    VARCHAR(255) NOT NULL,         -- PIN/passphrase terpisah dari password
  updated_at  TIMESTAMP DEFAULT NOW()
);
```

### Tabel `airlines` (master data)
```sql
CREATE TABLE airlines (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  code        VARCHAR(10),                   -- kode IATA, e.g. "GA", "JT"
  is_active   BOOLEAN DEFAULT true
);
```

### Tabel `hotels` (master data)
```sql
CREATE TABLE hotels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(150) NOT NULL,
  city        VARCHAR(100) NOT NULL,
  star        SMALLINT,                      -- 1–5
  address     TEXT,
  is_active   BOOLEAN DEFAULT true
);
```

### Tabel `trip_requests`
```sql
CREATE TABLE trip_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  trip_type       ENUM('CUTI','DINAS') NOT NULL,
  duty_type       ENUM('ON_DUTY','OFF_DUTY'),   -- null jika CUTI
  leave_start     DATE,                          -- untuk CUTI
  leave_end       DATE,                          -- untuk CUTI
  purpose         TEXT,                          -- keterangan perjalanan / cuti
  spkr_link       VARCHAR(500),                  -- link GDrive SPKR
  need_hotel      BOOLEAN DEFAULT false,
  status          ENUM('DRAFT','PENDING','APPROVED','REJECTED','BOOKED','CANCELLED') DEFAULT 'DRAFT',
  rejection_note  TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

### Tabel `flight_segments`
```sql
CREATE TABLE flight_segments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_request_id UUID REFERENCES trip_requests(id) ON DELETE CASCADE,
  airline_id      UUID REFERENCES airlines(id),
  origin_city     VARCHAR(100) NOT NULL,
  dest_city       VARCHAR(100) NOT NULL,
  departure_date  DATE NOT NULL,
  departure_time  TIME NOT NULL,
  segment_order   SMALLINT NOT NULL DEFAULT 1,  -- urutan penerbangan dalam 1 trip
  -- diisi oleh travel agent setelah booking:
  ticket_number   VARCHAR(100),
  booking_code    VARCHAR(50)
);
```

### Tabel `hotel_reservations`
```sql
CREATE TABLE hotel_reservations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_request_id UUID REFERENCES trip_requests(id) ON DELETE CASCADE,
  hotel_id        UUID REFERENCES hotels(id),
  checkin_date    DATE NOT NULL,
  checkout_date   DATE NOT NULL,
  -- diisi oleh travel agent setelah booking:
  booking_ref     VARCHAR(100),
  room_type       VARCHAR(100)
);
```

### Tabel `approvals`
```sql
CREATE TABLE approvals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_request_id UUID REFERENCES trip_requests(id),
  officer_id      UUID REFERENCES users(id),
  action          ENUM('APPROVED','REJECTED') NOT NULL,
  note            TEXT,
  approved_at     TIMESTAMP DEFAULT NOW()
);
```

### Tabel `notifications`
```sql
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  trip_request_id UUID REFERENCES trip_requests(id),
  message         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT false,
  created_at      TIMESTAMP DEFAULT NOW()
);
```

---

## Tech Stack Rekomendasi

### Frontend
```
Framework   : Next.js 14+ (App Router)
UI Library  : shadcn/ui + Tailwind CSS
State       : Zustand (client state) + React Query (server state)
Form        : React Hook Form + Zod (validasi)
Auth        : NextAuth.js
```

### Backend
```
Runtime     : Node.js
Framework   : Express.js atau Fastify
ORM         : Prisma
Validasi    : Zod
Auth        : JWT + bcrypt
```

### Database
```
Primary DB  : PostgreSQL
Cache       : Redis (untuk session & notifikasi realtime)
```

### Infrastruktur
```
Hosting     : Railway / Vercel (frontend) + Railway (backend)
Storage     : Tidak diperlukan (SPKR via link GDrive eksternal)
Email notif : Nodemailer / Resend (opsional)
```

### Alternatif (jika ingin fullstack ringan)
```
Framework   : Next.js fullstack (API Routes / Server Actions)
DB          : PostgreSQL via Neon (serverless)
ORM         : Prisma
Auth        : NextAuth.js + credentials provider
```

---

## Struktur Folder Project

```
travel-booking/
├── frontend/                        # atau /src jika fullstack Next.js
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── admin/
│   │   │   │   ├── users/
│   │   │   │   ├── airlines/
│   │   │   │   └── hotels/
│   │   │   ├── user/
│   │   │   │   ├── requests/
│   │   │   │   │   ├── new/
│   │   │   │   │   └── [id]/
│   │   │   │   └── dashboard/
│   │   │   ├── officer/
│   │   │   │   ├── pending/
│   │   │   │   └── history/
│   │   │   └── travel-agent/
│   │   │       ├── approved/
│   │   │       └── booked/
│   │   └── api/                     # API routes (jika Next.js fullstack)
│   │       ├── auth/
│   │       ├── trips/
│   │       ├── airlines/
│   │       ├── hotels/
│   │       ├── approvals/
│   │       └── notifications/
│   ├── components/
│   │   ├── ui/                      # shadcn components
│   │   ├── forms/
│   │   │   ├── TripRequestForm.tsx
│   │   │   ├── FlightSegmentForm.tsx
│   │   │   ├── HotelForm.tsx
│   │   │   └── OfficerPinModal.tsx
│   │   ├── tables/
│   │   └── layout/
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── db.ts                    # Prisma client
│   │   ├── validations/
│   │   └── utils.ts
│   └── types/
│       └── index.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── .env.example
├── .env.local
├── package.json
└── README.md
```

---

## API Endpoints

### Auth
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### Master Data (Admin only)
```
GET    /api/airlines
POST   /api/airlines
PUT    /api/airlines/:id
DELETE /api/airlines/:id

GET    /api/hotels
POST   /api/hotels
PUT    /api/hotels/:id
DELETE /api/hotels/:id
```

### Users (Admin only)
```
GET    /api/users
POST   /api/users
PUT    /api/users/:id
PATCH  /api/users/:id/deactivate
```

### Trip Requests
```
GET    /api/trips                    # list (filter by role & status)
POST   /api/trips                    # buat pengajuan baru
GET    /api/trips/:id                # detail pengajuan
PATCH  /api/trips/:id/cancel         # batalkan (user, status PENDING)
```

### Flight Segments
```
POST   /api/trips/:id/segments       # tambah segment penerbangan
PUT    /api/trips/:id/segments/:sid  # edit segment
DELETE /api/trips/:id/segments/:sid  # hapus segment
```

### Approvals (Officer only)
```
GET    /api/approvals/pending        # list pengajuan menunggu
POST   /api/approvals/:tripId/approve  # ACC dengan PIN
POST   /api/approvals/:tripId/reject   # Tolak dengan alasan
```

### Bookings (Travel Agent only)
```
GET    /api/bookings/approved        # list pengajuan siap diproses
PATCH  /api/bookings/:tripId         # update detail booking
PATCH  /api/bookings/:tripId/done    # tandai selesai (status BOOKED)
```

### Notifications
```
GET    /api/notifications            # notifikasi milik user login
PATCH  /api/notifications/read-all  # tandai semua sudah dibaca
```

---

## Business Rules

1. **Jenis perjalanan CUTI** → tidak boleh ada data flight segment & hotel reservation
2. **Jenis perjalanan DINAS** → wajib minimal 1 flight segment dan SPKR link terisi
3. **SPKR link** harus diisi sebelum status bisa berubah dari `DRAFT` ke `PENDING`
4. **Officer PIN/Passphrase** disimpan terpisah dari password akun (tabel `officer_pins`)
5. **Travel Agent** hanya dapat melihat dan memproses pengajuan berstatus `APPROVED`
6. **User** hanya dapat membatalkan pengajuan selama status masih `PENDING`
7. **Multi-segment flight**: minimal 1 segment, tidak ada batas maksimum
8. **Hotel bersifat opsional** untuk pengajuan DINAS; jika `need_hotel = false`, tabel `hotel_reservations` tidak diisi
9. **Notifikasi** dikirim ke user pada setiap perubahan status pengajuan
10. **Satu pengajuan = satu trip** — jika ada dua tujuan berbeda, buat dua pengajuan terpisah

---

## Status Flow Pengajuan

```
DRAFT ──► PENDING ──► APPROVED ──► BOOKED
                  │
                  └──► REJECTED

PENDING ──► CANCELLED  (oleh user)
```

| Status | Deskripsi |
|---|---|
| `DRAFT` | Form sedang diisi, belum disubmit |
| `PENDING` | Sudah disubmit, menunggu review Officer |
| `APPROVED` | Di-ACC Officer, menunggu diproses Travel Agent |
| `REJECTED` | Ditolak Officer, disertai alasan |
| `BOOKED` | Booking selesai dilakukan Travel Agent |
| `CANCELLED` | Dibatalkan oleh User (hanya dari status PENDING) |

---

## UI Pages / Routes

| Route | Role | Deskripsi |
|---|---|---|
| `/login` | Semua | Halaman login |
| `/dashboard` | Semua | Dashboard sesuai role |
| `/user/requests` | user | Daftar semua pengajuan saya |
| `/user/requests/new` | user | Form buat pengajuan baru |
| `/user/requests/[id]` | user | Detail & status pengajuan |
| `/officer/pending` | officer | Daftar pengajuan menunggu ACC |
| `/officer/history` | officer | Riwayat pengajuan yang sudah diproses |
| `/travel-agent/approved` | travel_agent | Pengajuan siap diproses |
| `/travel-agent/booked` | travel_agent | Riwayat booking selesai |
| `/admin/users` | admin | Manajemen user |
| `/admin/airlines` | admin | Master data maskapai |
| `/admin/hotels` | admin | Master data hotel |

---

## To-Do & Progress

### Phase 1 — Setup & Auth
- [ ] Init project (Next.js + Prisma + PostgreSQL)
- [ ] Setup Prisma schema & migrasi awal
- [ ] Implementasi autentikasi (NextAuth / JWT)
- [ ] Middleware proteksi route per role
- [ ] Setup Officer PIN (terpisah dari password)

### Phase 2 — Master Data (Admin)
- [ ] CRUD maskapai
- [ ] CRUD hotel
- [ ] CRUD & manajemen user

### Phase 3 — Form Pengajuan (User)
- [ ] Form pilih jenis: CUTI / DINAS
- [ ] Form CUTI (tanggal + keterangan)
- [ ] Form DINAS: flight segment (dengan tambah segment)
- [ ] Form DINAS: hotel (opsional, toggle)
- [ ] Input & validasi link SPKR GDrive
- [ ] Submit & perubahan status ke PENDING

### Phase 4 — Approval (Officer)
- [ ] Halaman daftar pengajuan pending
- [ ] Detail pengajuan (flight, hotel, SPKR)
- [ ] Modal input PIN/Passphrase untuk ACC
- [ ] Form alasan penolakan
- [ ] Notifikasi ke User setelah keputusan

### Phase 5 — Booking (Travel Agent)
- [ ] Daftar pengajuan approved
- [ ] Form update detail booking (no. tiket, kode booking)
- [ ] Tandai selesai → status BOOKED
- [ ] Notifikasi ke User

### Phase 6 — Notifikasi & Polish
- [ ] Sistem notifikasi in-app
- [ ] Email notifikasi (opsional)
- [ ] Dashboard statistik (Admin)
- [ ] Responsive mobile
- [ ] Testing & QA

---

*Dokumen ini dibuat sebagai panduan pengembangan awal. Update seiring progress project.*
