# Rencana Implementasi — Iterasi 1

> Travel Booking System dengan gaya visual dark-slate "floating cards" (adaptasi mockup smart home) diterapkan ke konten travel booking (referensi: `TRAVEL_BOOKING_PROJECT.md`).

## Keputusan yang Sudah Disepakati

| Aspek | Keputusan |
|---|---|
| Arsitektur | Next.js 14 Fullstack (App Router) -> berubah menjadi Next.js 16 |
| Styling | Tailwind CSS + shadcn/ui |
| Package manager | pnpm |
| Data | Mock data dulu (in-memory / TS module), DB Prisma menyusul |
| Gaya visual | Dark slate floating cards ala mockup, diterapkan ke SEMUA halaman |
| Scope iterasi 1 | Fondasi project + Design System + Login + 1 Dashboard (role User) |

---

## Design System (dari deskripsi mockup)

### Palet Warna (CSS variables / Tailwind theme)
| Token | Hex | Penggunaan |
|---|---|---|
| `bg-base` | `#2A2D35` | Background utama (near-black slate) |
| `panel` | `#3D4A5C` | Panel utama besar |
| `card` | `#4A5568` | Card perangkat/konten |
| `panel-detail` | `#4A5E78` | Side/detail panel |
| `accent-green` | `#22C55E` | Status aktif / APPROVED / BOOKED |
| `accent-orange` | `#F97316` | Peringatan / PENDING |
| `accent-blue` | `#3B82F6` | Info / DRAFT |
| `accent-red` | `#EF4444` | REJECTED (ditambah, tidak ada di mockup tapi perlu utk status) |
| `slate-muted` | `#94A3B8` | Text sekunder |
| `text-primary` | `#FFFFFF` | Text primer |

### Tipografi
- Greeting headline: sans-serif ~36–40px, weight **regular** (tidak bold), kesan hangat/casual.
- Label: 12–14px medium putih.
- Sub-label: 11–12px muted gray regular.
- Angka besar (focal, mis. jumlah pengajuan): ~72px weight thin/light.
- Font: `Inter` (via `next/font`) sebagai sans-serif bersih.

### Bentuk & Kedalaman
- Border-radius besar: `~16px` (`rounded-2xl`) untuk card, `~24px` untuk panel.
- **Tanpa border/garis** — kedalaman murni dari perbedaan warna background + soft shadow halus.
- Layout multi-panel floating: panel utama + side/detail panel + floating widget terpisah (kesan layered/depth).

---

## Struktur Folder (iterasi 1)

```
travelsys/
├── app/
│   ├── layout.tsx                 # root layout, font Inter, bg-base
│   ├── globals.css                # Tailwind + CSS vars palet
│   ├── page.tsx                   # redirect -> /login
│   ├── (auth)/
│   │   └── login/page.tsx         # halaman login (mock auth)
│   └── (dashboard)/
│       ├── layout.tsx             # shell: sidebar/topbar floating
│       └── user/
│           └── dashboard/page.tsx # dashboard User ala mockup
├── components/
│   ├── ui/                        # shadcn (button, input, dll)
│   ├── shell/
│   │   ├── Sidebar.tsx            # nav floating
│   │   └── Topbar.tsx             # greeting + notif bell + avatar
│   ├── cards/
│   │   ├── Panel.tsx              # panel besar rounded
│   │   ├── StatCard.tsx           # card angka besar
│   │   ├── RequestCard.tsx        # card ringkas pengajuan (device-card style)
│   │   └── FloatingWidget.tsx     # widget melayang (mis. quick action)
│   └── status/
│       └── StatusBadge.tsx        # badge status pengajuan berwarna
├── lib/
│   ├── mock/
│   │   ├── user.ts                # mock user login (Isabella dsb)
│   │   └── trips.ts               # mock daftar pengajuan
│   ├── auth-mock.ts               # simulasi login sederhana (cookie/localStorage)
│   └── utils.ts                   # cn() helper
├── types/
│   └── index.ts                   # TripRequest, User, Status enums, dll (dari schema dokumen)
├── tailwind.config.ts
├── tsconfig.json
├── next.config.mjs
├── postcss.config.mjs
├── package.json
└── .gitignore
```

---

## Langkah Implementasi

### A. Scaffold Project
1. Inisialisasi Next.js 14 (App Router, TS, Tailwind, ESLint) via `create-next-app` dengan pnpm, di dalam folder saat ini.
2. Setup shadcn/ui (init + tambah komponen: button, input, label, avatar, dropdown-menu, badge, dialog).
3. Konfigurasi font Inter via `next/font`.

### B. Design System
4. Definisikan CSS variables palet di `globals.css` + petakan ke `tailwind.config.ts` (colors: base, panel, card, panel-detail, accent-*, slate-muted).
5. Set body background `bg-base`, teks putih, radius default besar.
6. Buat komponen dasar: `Panel`, `StatCard`, `RequestCard`, `FloatingWidget`, `StatusBadge`.
   - `StatusBadge` memetakan status → warna:
     - DRAFT → blue, PENDING → orange, APPROVED → green, BOOKED → green (solid), REJECTED → red, CANCELLED → slate-muted.

### C. Types & Mock Data
7. `types/index.ts`: tipe `User`, `Role`, `TripStatus`, `TripType`, `DutyType`, `TripRequest`, `FlightSegment`, `HotelReservation` (mengacu schema di dokumen).
8. `lib/mock/user.ts`: user contoh (nama "Isabella" untuk greeting demo, role `user`).
9. `lib/mock/trips.ts`: beberapa pengajuan contoh dengan variasi status.

### D. Auth (Mock)
10. `lib/auth-mock.ts`: fungsi login sederhana (cocokkan email dari mock, simpan sesi di cookie/localStorage). Tanpa backend nyata.
11. Halaman `/login`: layout floating card di tengah, form email+password, tombol utama aksen, styling dark slate. Submit → set sesi mock → redirect ke `/user/dashboard`.

### E. Dashboard Shell + User Dashboard
12. `(dashboard)/layout.tsx`: shell dengan **sidebar floating** (menu: Dashboard, Pengajuan Saya, Pengajuan Baru — link placeholder) + **topbar** (greeting "Hi [Nama]", notif bell, avatar/logout).
13. `user/dashboard/page.tsx` ala mockup:
    - Greeting headline besar "Hi Isabella".
    - **Panel utama** = grid "RequestCard" (tiap card = 1 pengajuan: judul + sub-info + StatusBadge + mini action), meniru grid device cards.
    - **StatCard** dengan angka besar thin (mis. total pengajuan / pending).
    - **FloatingWidget** kanan-atas (mis. tombol "Buat Pengajuan" quick action / ringkasan) yang melayang terpisah.
    - **Side/detail panel** (opsional interaktif): klik sebuah RequestCard → tampil detail panel kanan (`panel-detail`), meniru AC detail panel.

### F. Verifikasi
14. `pnpm dev` — pastikan halaman login & dashboard render tanpa error.
15. `pnpm build` — pastikan build lulus (type-check + lint).
16. Cek responsif dasar (grid card menyesuaikan lebar).

---

## Di Luar Scope Iterasi 1 (menyusul)
- Halaman role Admin, Officer, Travel Agent.
- Form pengajuan CUTI/DINAS (multi-segment flight, hotel, SPKR).
- Prisma schema + PostgreSQL + migrasi.
- NextAuth (auth nyata) + Officer PIN.
- API routes / Server Actions nyata, notifikasi.

---

## Kriteria Selesai (iterasi 1)
- Project Next.js jalan (`pnpm dev` & `pnpm build` sukses).
- Design system dark-slate + komponen card/badge tersedia & konsisten.
- Halaman `/login` bergaya mockup, login mock berhasil redirect.
- `/user/dashboard` tampil dengan greeting, grid RequestCard, StatCard angka besar, floating widget, dan detail panel interaktif — semuanya bergaya floating dark slate sesuai mockup.
