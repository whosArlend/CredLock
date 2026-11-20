# CredLock Security Intelligence API — Backend

REST API backend untuk **CredLock Security Intelligence**, dibangun dengan Node.js, Express 5, TypeScript, Zod, dan Supabase JS Client. Backend ini bertindak sebagai penyedia intelijen siber publik dan analitika keamanan terverifikasi untuk aplikasi CredLock PWA.

---

## 1. Arsitektur Backend & Database Connection

Backend ini menerapkan arsitektur berlapis (*layered modular architecture*) yang memisahkan konfigurasi aplikasi, repositori akses data, layanan bisnis (*service*), pengontrol HTTP (*controller*), validator skema Zod, dan perutean versi (*versioned routing*):

```
backend/credlock-api/
├── src/
│   ├── config/          # Validasi skema Zod (env.ts) & Supabase Client (supabase.ts)
│   ├── controllers/     # HTTP Request/Response Controllers
│   │   ├── dashboardController.ts
│   │   └── breachController.ts
│   ├── services/        # Business Logic, Data Formatting & Calculations
│   │   ├── dashboardService.ts
│   │   └── breachService.ts
│   ├── repositories/    # Database Queries & Strict Visibility Filtering
│   │   ├── dashboardRepository.ts
│   │   └── breachRepository.ts
│   ├── validators/      # Zod Query & Param Validators
│   │   └── breachValidator.ts
│   ├── types/           # TypeScript DTOs & Interfaces
│   │   ├── dashboard.ts
│   │   └── breach.ts
│   ├── middleware/      # Keamanan (Helmet, CORS, Rate Limit), Error Handler, Logger
│   ├── routes/          # Perutean endpoint (/api/health, /api/health/db, /api/v1)
│   │   └── v1/
│   │       ├── dashboard.ts
│   │       ├── breaches.ts
│   │       └── index.ts
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
Mengambil ringkasan statistik keamanan siber, klasifikasi insiden kebocoran berdasarkan keparahan (*severity*), dan daftar insiden terbaru.

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
    "recentBreaches": [ ... ]
  },
  "timestamp": "2026-11-20T12:00:00.000Z"
}
```

---

### C. Breach Intelligence Endpoints (Phase 3.3B)

#### 1. `GET /api/v1/breaches` (Daftar Insiden Terpaginasi)
Mengambil katalog insiden kebocoran terverifikasi dan dipublikasikan dengan dukungan pencarian, penyaringan keparahan, pengurutan, dan paginasi level database.

**Query Parameters:**

| Parameter | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `page` | Integer | `1` | Nomor halaman (minimal 1) |
| `limit` | Integer | `10` | Jumlah data per halaman (1 hingga 50) |
| `search` | String | - | Pencarian pada judul, organisasi, atau domain |
| `severity`| Enum | - | Filter keparahan: `critical`, `high`, `medium`, `low` |
| `sort` | Enum | `added_date`| Kolom urutan: `added_date`, `breach_date`, `pwn_count`, `title` |
| `order` | Enum | `desc` | Arah urutan: `asc`, `desc` |

**Contoh Respon Sukses (HTTP 200) — *Nilai Ilustratif*:**
```json
{
  "success": true,
  "data": [
    {
      "id": "d6aa41f0-ef6d-448f-bcb5-373c2e05f3e1",
      "title": "Example E-Commerce Breach (2020)",
      "slug": "example-ecommerce-2020",
      "domain": "example.com",
      "organization": "Example Corp",
      "breach_date": "2020-03-01",
      "added_date": "2020-05-02",
      "pwn_count": 91000000,
      "data_classes": ["Email addresses", "Password hashes"],
      "severity": "critical",
      "logo_url": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "timestamp": "2026-11-20T12:00:00.000Z"
}
```

#### 2. `GET /api/v1/breaches/:slug` (Detail Insiden Kebocoran)
Mengambil informasi lengkap dari satu insiden kebocoran terverifikasi berdasarkan `slug`.

**Contoh Respon Sukses (HTTP 200) — *Nilai Ilustratif*:**
```json
{
  "success": true,
  "data": {
    "id": "d6aa41f0-ef6d-448f-bcb5-373c2e05f3e1",
    "title": "Example E-Commerce Breach (2020)",
    "slug": "example-ecommerce-2020",
    "domain": "example.com",
    "organization": "Example Corp",
    "breach_date": "2020-03-01",
    "added_date": "2020-05-02",
    "pwn_count": 91000000,
    "description": "Kronologi lengkap insiden kebocoran data...",
    "data_classes": ["Email addresses", "Password hashes"],
    "severity": "critical",
    "source_url": "https://zdnet.com/article/example",
    "logo_url": null
  },
  "timestamp": "2026-11-20T12:00:00.000Z"
}
```

**Respon Error Not Found (HTTP 404):**  
Jika `slug` tidak ditemukan, atau catatan terkait berstatus draf (*unpublished*) atau belum diverifikasi (*unverified*), API mengembalikan respon 404 identik guna mencegah *data existence enumeration*:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Breach with slug 'example-slug' not found"
  },
  "timestamp": "2026-11-20T12:00:00.000Z"
}
```

**Respon Parameter Tidak Valid (HTTP 400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Limit cannot exceed 50"
  },
  "timestamp": "2026-11-20T12:00:00.000Z"
}
```

### Menguji dengan `curl`
```bash
# Ambil daftar insiden dengan paginasi dan filter
curl -i "http://localhost:4000/api/v1/breaches?limit=5&sort=pwn_count&order=desc"

# Cari insiden berdasarkan kata kunci
curl -i "http://localhost:4000/api/v1/breaches?search=tokopedia"

# Ambil detail insiden berdasarkan slug
curl -i "http://localhost:4000/api/v1/breaches/tokopedia-2020"
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

Cakupan pengujian (42 test cases lintas 5 test suites):
- `tests/breaches.test.ts` (18 tests):
  - List paginasi default, kustomisasi limit/page, kalkulasi metadata
  - Pencarian multi-kolom (title, organization, domain)
  - Penyaringan keparahan (`severity`)
  - Pengurutan multi-level (`sort` & `order`)
  - Validasi query parameter HTTP 400 (halaman < 1, limit > 50, sort column di luar allowlist, severity invalid)
  - Aturan visibilitas publik: data draf/unverified tidak pernah masuk hasil atau total count
  - Ketiadaan kolom audit internal pada respon list maupun detail
  - Detail endpoint HTTP 200 untuk slug valid dan HTTP 404 identik untuk record yang tidak ada / draf / unverified
- `tests/dashboard.test.ts` (7 tests): Aggregasi dashboard summary, breakdown severity, limit 5 recent breaches
- `tests/health.test.ts` (6 tests): Basic liveness probe dan database readiness probe
- `tests/supabase.test.ts` (7 tests): Validasi skema Zod environment untuk `SUPABASE_SECRET_KEY`
- `tests/security.test.ts` (4 tests): Header Helmet, rate limiting, payload size limits, 404 handler

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
