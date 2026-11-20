# CredLock Security Intelligence API — Backend

REST API backend untuk **CredLock Security Intelligence**, dibangun dengan Node.js, Express 5, TypeScript, Zod, dan Supabase JS Client. Backend ini bertindak sebagai penyedia intelijen siber publik dan analitika keamanan terverifikasi untuk aplikasi CredLock PWA.

---

## 1. Arsitektur Backend & Database Connection

Backend ini menerapkan arsitektur berlapis (*layered modular architecture*) yang memisahkan konfigurasi aplikasi, koneksi database, middleware keamanan, perutean versi (*versioned routing*), dan penanganan error:

```
backend/credlock-api/
├── src/
│   ├── config/          # Validasi skema Zod (env.ts) & Supabase Client (supabase.ts)
│   ├── middleware/      # Keamanan (Helmet, CORS, Rate Limit), Error Handler, Logger
│   ├── routes/          # Perutean endpoint (/api/health, /api/health/db, /api/v1)
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
> **Aturan Keamanan Kunci Rahasia**:
> 1. `SUPABASE_SECRET_KEY` **hanya boleh berada di file `.env` server backend** (`backend/credlock-api/.env`).
> 2. **DILARANG KERAS** menggunakan `SUPABASE_SECRET_KEY` di kode frontend PWA atau menamainya dengan prefix `VITE_`.
> 3. Kunci rahasia ini memiliki izin istimewa yang melewati *Row Level Security* (RLS). Karena itu, seluruh handler API publik di masa mendatang **WAJIB** menerapkan penyaringan manual:
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

Output terminal saat server aktif:
```text
====================================================
 CredLock Security Intelligence API
 Environment : development
 Listening on: http://localhost:4000
 Health check: http://localhost:4000/api/health
====================================================
```

---

## 5. Endpoint Health & Readiness

### A. `GET /api/health` (Basic Liveness Probe)
Memeriksa status keaktifan proses server Express secara mandiri. **Tidak bergantung pada ketersediaan koneksi database**.

**Respon Sukses (HTTP 200):**
```json
{
  "success": true,
  "message": "CredLock API is running",
  "timestamp": "2026-11-20T12:00:00.000Z",
  "environment": "development"
}
```

### B. `GET /api/health/db` (Database Readiness Probe)
Memverifikasi konektivitas ke database Supabase PostgreSQL menggunakan kueri ringan (*lightweight probe*) pada tabel `breaches` (hanya memeriksa keberadaan 1 ID tanpa mengambil data penuh atau mengubah database).

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

**Respon Saat Database Tidak Tersedia (HTTP 503 Service Unavailable):**
```json
{
  "success": false,
  "error": {
    "code": "DATABASE_UNAVAILABLE",
    "message": "Database service is currently unreachable"
  },
  "database": {
    "status": "disconnected"
  },
  "timestamp": "2026-11-20T12:00:00.000Z"
}
```
*Catatan Keamanan: Tidak ada informasi sensitif, connection string, kunci rahasia, stack trace, atau detail internal error Supabase yang dibocorkan ke respon klien saat database gagal.*

---

## 6. Menjalankan Pengujian (Testing)

Pengujian unit dan integrasi HTTP menggunakan **Vitest** dan **Supertest** (seluruh dependensi database di-mock agar pengujian berjalan cepat, deterministik, dan bebas kebocoran kunci):

```bash
# Menjalankan seluruh test suite sekali jalan
npm test

# Menjalankan test dalam mode watch interaktif
npm run test:watch
```

Cakupan pengujian (17 test cases):
- Validasi skema Zod untuk format `SUPABASE_SECRET_KEY` dan `SUPABASE_URL`
- Inisialisasi dan isolasi Supabase client
- Endpoint database readiness `GET /api/health/db` status HTTP 200 saat terhubung
- Endpoint database readiness `GET /api/health/db` status HTTP 503 saat gagal & verifikasi ketiadaan kebocoran secret
- Endpoint liveness `GET /api/health` tetap berfungsi normal meski database offline
- Penanganan 404 pada rute tidak dikenal
- Header keamanan Helmet (`X-Content-Type-Options`, `X-Frame-Options`, dll)
- Batas ukuran payload request body (100 KB limit)

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
