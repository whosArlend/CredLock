# CredLock Security Intelligence API — Backend

REST API backend untuk **CredLock Security Intelligence**, dibangun dengan Node.js, Express 5, TypeScript, Zod, dan Supabase JS Client. Backend ini bertindak sebagai penyedia intelijen siber publik dan analitika keamanan terverifikasi untuk aplikasi CredLock PWA.

---

## 1. Arsitektur Backend & Database Connection

Backend ini menerapkan arsitektur berlapis (*layered modular architecture*) yang memisahkan konfigurasi aplikasi, repositori akses data, layanan bisnis (*service*), pengontrol HTTP (*controller*), dan perutean versi (*versioned routing*):

```
backend/credlock-api/
├── src/
│   ├── config/          # Validasi skema Zod (env.ts) & Supabase Client (supabase.ts)
│   ├── controllers/     # HTTP Request/Response Controllers
│   │   └── dashboardController.ts
│   ├── services/        # Business Logic & Data Aggregations
│   │   └── dashboardService.ts
│   ├── repositories/    # Database Queries & Visibility Filtering
│   │   └── dashboardRepository.ts
│   ├── types/           # TypeScript DTOs & Interfaces
│   │   └── dashboard.ts
│   ├── middleware/      # Keamanan (Helmet, CORS, Rate Limit), Error Handler, Logger
│   ├── routes/          # Perutean endpoint (/api/health, /api/health/db, /api/v1)
│   │   └── v1/
│   │       └── dashboard.ts
│   ├── utils/           # Helper amplop respon JSON standar
│   ├── app.ts           # Inisialisasi Express & konfigurasi middleware
│   └── server.ts        # Entry point startup HTTP listener
├── tests/               # Pengujian unit & integrasi HTTP (Vitest + Supertest)
├── database/            # Migrasi SQL & Seed Supabase PostgreSQL
├── .env.example         # Template konfigurasi environment
├── package.json
└── tsconfig.json
```

### Keamanan Kunci Rahasia Supabase (`SUPABASE_SECRET_KEY`)
Proyek ini mendukung format kunci API terbaru Supabase:
- **`SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_...`)**: Digunakan untuk akses publik/browser (tidak digunakan untuk backend privileged).
- **`SUPABASE_SECRET_KEY` (`sb_secret_...`)**: Kunci rahasia server-side dengan izin administratif penuh.

> [!WARNING]
> **Aturan Keamanan Kunci Rahasia & Bypass RLS**:
> 1. `SUPABASE_SECRET_KEY` **hanya boleh berada di file `.env` server backend** (`backend/credlock-api/.env`).
> 2. **DILARANG KERAS** menggunakan `SUPABASE_SECRET_KEY` di kode frontend PWA atau menamainya dengan prefix `VITE_`.
> 3. Kunci rahasia ini memiliki izin istimewa yang melewati *Row Level Security* (RLS). Karena itu, seluruh kueri database publik di lapisan repositori **WAJIB** menerapkan aturan visibilitas eksplisit:
>    - `breaches`: wajib memfilter `.eq('is_published', true).eq('is_verified', true)`
>    - `recommendations`: wajib memfilter `.eq('is_published', true)`
>    - `articles`: wajib memfilter `.eq('is_published', true)`
> 4. Backend dilarang mencatat (`console.log`) atau mengembalikan nilai kunci ini melalui respon endpoint API.

---

## 2. Instalasi Dependensi

Navigasikan ke folder `backend/credlock-api/`:

```bash
cd backend/credlock-api
npm install
```

---

## 3. Konfigurasi Environment Lokal

Salin file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Isi konfigurasi pada file `.env` lokal Anda:

```env
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:5173

SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SECRET_KEY=your-supabase-secret-key-here
```

| Variabel | Deskripsi | Wajib | Default |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Mode lingkungan (`development`, `production`, `test`) | Tidak | `development` |
| `PORT` | Port server backend Express | Tidak | `4000` |
| `FRONTEND_URL`| Origin URL frontend PWA untuk whitelist CORS | Tidak | `http://localhost:5173` |
| `SUPABASE_URL` | URL Endpoint Supabase Project Anda | Ya (DB Ops) | - |
| `SUPABASE_SECRET_KEY` | Secret Key server-side Supabase (`sb_secret_...`) | Ya (DB Ops) | - |

> Port default **4000** memastikan tidak terjadi konflik dengan:
> - **Sales-API Modul 1**: Port `3000`
> - **CredLock PWA (Vite)**: Port `5173`

---

## 4. Menjalankan Server Pengembangan (Development)

Menjalankan server dalam mode *hot-reload* menggunakan `tsx watch`:

```bash
npm run dev
```

---

## 5. Dokumentasi API Endpoints

### A. Health & Readiness Endpoints

#### `GET /api/health` (Basic Liveness Probe)
Memeriksa status keaktifan proses server Express secara mandiri tanpa tergantung database.

**Respon Sukses (HTTP 200):**
```json
{
  "success": true,
  "message": "CredLock API is running",
  "timestamp": "2026-11-20T12:00:00.000Z",
  "environment": "development"
}
```

#### `GET /api/health/db` (Database Readiness Probe)
Memverifikasi konektivitas ke database Supabase PostgreSQL menggunakan kueri ringan (*lightweight probe*) pada tabel `breaches` (membaca 1 ID tanpa mengubah data).

**Respon Saat Terhubung (HTTP 200):**
```json
{
  "success": true,
  "message": "Database is connected and healthy",
  "database": {
    "status": "connected",
    "latencyMs": 28
  },
  "timestamp": "2026-11-20T12:00:00.000Z"
}
```

---

### B. Dashboard Summary Endpoint (Phase 3.3A)

#### `GET /api/v1/dashboard/summary`
Mengambil dan mengagregasi ringkasan statistik keamanan siber, klasifikasi insiden kebocoran berdasarkan keparahan (*severity*), dan daftar insiden terbaru untuk widget dashboard CredLock PWA.

**Metode HTTP**: `GET`  
**Path**: `/api/v1/dashboard/summary`  
**Autentikasi**: Publik (Read-Only)

**Aturan Visibilitas Data**:
- Hanya insiden kebocoran yang berstatus **`is_published = true AND is_verified = true`** yang dihitung dan ditampilkan.
- Rekomendasi hanya menghitung baris yang berstatus **`is_published = true`**.
- Artikel hanya menghitung baris yang berstatus **`is_published = true`**.
- Data draf (*unpublished*) atau belum terverifikasi (*unverified*) tidak dapat masuk ke dalam ringkasan statistik.

**Definisi Kolom Respon**:
- `statistics.totalBreaches`: Total jumlah insiden kebocoran terverifikasi yang dipublikasikan.
- `statistics.totalExposedAccounts`: Akumulasi jumlah akun/kredensial yang terekspos lintas insiden (agregasi `pwn_count`). Bukan jumlah pengguna unik individu.
- `statistics.totalRecommendations`: Total rekomendasi keamanan publik yang tersedia.
- `statistics.totalArticles`: Total artikel edukasi keamanan siber publik yang tersedia.
- `breachesBySeverity`: Pengelompokan insiden berdasarkan tingkat dampak (`critical`, `high`, `medium`, `low`). Keempat kategori ini dijamin selalu ada dalam respon (bernilai 0 jika tidak ada catatan).
- `recentBreaches`: Maksimal 5 insiden kebocoran terbaru yang diurutkan berdasarkan `added_date` menurun. Hanya memuat kolom publik: `id`, `title`, `slug`, `organization`, `domain`, `breach_date`, `added_date`, `pwn_count`, `severity`.

**Contoh Respon Sukses (HTTP 200) — *Nilai Ilustratif*:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalBreaches": 12,
      "totalExposedAccounts": 450000000,
      "totalRecommendations": 8,
      "totalArticles": 6
    },
    "breachesBySeverity": {
      "critical": 4,
      "high": 5,
      "medium": 2,
      "low": 1
    },
    "recentBreaches": [
      {
        "id": "e3b0c442-98fc-1c14-9afbf4c8996fb924",
        "title": "Example Tech Data Breach (2024)",
        "slug": "example-tech-2024",
        "organization": "Example Corp",
        "domain": "example.com",
        "breach_date": "2024-02-15",
        "added_date": "2024-03-01",
        "pwn_count": 50000000,
        "severity": "critical"
      }
    ]
  },
  "timestamp": "2026-11-20T12:00:00.000Z"
}
```

**Perilaku Penanganan Error (HTTP 500 / 503)**:
Jika kueri database mengalami kegagalan:
```json
{
  "success": false,
  "error": {
    "code": "DATABASE_QUERY_ERROR",
    "message": "Failed to retrieve breach aggregate statistics"
  },
  "timestamp": "2026-11-20T12:00:00.000Z"
}
```
*Jaminan Keamanan: Respon error tidak membocorkan struktur SQL, kunci rahasia, URL Supabase, nama basis data internal, ataupun stack trace.*

### Menguji dengan `curl`
```bash
# Uji Dashboard Summary
curl -i http://localhost:4000/api/v1/dashboard/summary
```

---

## 6. Menjalankan Pengujian (Testing)

Pengujian unit dan integrasi HTTP menggunakan **Vitest** dan **Supertest** (seluruh dependensi database di-mock agar pengujian berjalan cepat, deterministik, dan bebas kebocoran kunci):

```bash
# Menjalankan seluruh test suite sekali jalan
npm test

# Menjalankan test dalam mode watch interaktif
npm run test:watch
```

Cakupan pengujian (24 test cases lintas 4 test suites):
- `tests/dashboard.test.ts`:
  - Status HTTP 200 dan kelengkapan struktur DTO dashboard summary
  - Agregasi statistik akurat dari dataset mock
  - Keberadaan seluruh 4 kategori severity breakdown (`critical`, `high`, `medium`, `low`)
  - Pembatasan recent breaches maksimal 5 catatan dan verifikasi ketiadaan *internal leaks*
  - Verifikasi filter visibilitas (`is_published`, `is_verified`) diterapkan pada kueri
  - Penanganan dataset kosong (*empty database*) dengan nilai 0 dan array kosong
  - Penanganan nilai `pwn_count` null, string non-numerik, dan angka masif (> miliaran) tanpa *precision loss*
  - Respon error aman saat terjadi kegagalan database
- `tests/health.test.ts`: Basic liveness dan database readiness probe
- `tests/supabase.test.ts`: Validasi skema Zod environment untuk `SUPABASE_SECRET_KEY`
- `tests/security.test.ts`: Header Helmet, rate limiting, payload size limits, 404 handler

---

## 7. Build Produksi dan Menjalankan

```bash
# 1. Typechecking
npm run typecheck

# 2. Kompilasi TypeScript ke JavaScript (dist/)
npm run build

# 3. Menjalankan server hasil build
npm start
```
