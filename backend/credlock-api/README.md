# CredLock Security Intelligence API — Backend

REST API backend untuk **CredLock Security Intelligence**, dibangun dengan Node.js, Express 5, TypeScript, dan Zod. Backend ini bertindak sebagai penyedia intelijen siber publik dan analitika keamanan terverifikasi untuk aplikasi CredLock PWA.

---

## 1. Arsitektur Backend

Backend ini menerapkan arsitektur berlapis (*layered modular architecture*) yang memisahkan konfigurasi aplikasi, middleware keamanan, perutean versi (*versioned routing*), dan penanganan error:

```
backend/credlock-api/
├── src/
│   ├── config/          # Validasi skema environment dengan Zod (env.ts)
│   ├── middleware/      # Keamanan (Helmet, CORS, Rate Limit), Error Handler, Logger
│   ├── routes/          # Perutean endpoint (/api/health, /api/v1)
│   ├── utils/           # Helper amplop respon JSON standar
│   ├── app.ts           # Inisialisasi Express & konfigurasi middleware
│   └── server.ts        # Entry point startup HTTP listener
├── tests/               # Pengujian unit & integrasi HTTP (Vitest + Supertest)
├── database/            # Migrasi SQL & Seed Supabase PostgreSQL
├── .env.example         # Template konfigurasi environment
├── package.json
└── tsconfig.json
```

- **Pemisahan `app.ts` & `server.ts`**: Memungkinkan pengujian HTTP menggunakan Supertest tanpa harus membuka port soket jaringan sungguhan (*port-free testing*).
- **Zero-Knowledge Invariant**: Backend ini murni bertindak sebagai penyedia data publik dan analitika. Tidak ada endpoint yang menerima password, hash password, atau master key pengguna.

---

## 2. Instalasi Dependensi

Untuk menginstal dependensi backend, navigasikan ke folder `backend/credlock-api/`:

```bash
cd backend/credlock-api
npm install
```

---

## 3. Konfigurasi Environment

Salin file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Variabel yang didukung:

| Variabel | Deskripsi | Default |
| :--- | :--- | :--- |
| `NODE_ENV` | Mode lingkungan (`development`, `production`, `test`) | `development` |
| `PORT` | Port server backend Express | `4000` |
| `FRONTEND_URL`| Origin URL frontend PWA untuk whitelist CORS | `http://localhost:5173` |

> Port default **4000** dipilih agar tidak terjadi bentrok dengan:
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

## 5. Endpoint Tersedia (Phase 3.1)

### `GET /api/health`
Memeriksa status keaktifan layanan API (*liveness probe*).

**Respon Sukses (HTTP 200):**
```json
{
  "success": true,
  "message": "CredLock API is running",
  "timestamp": "2026-11-20T12:00:00.000Z",
  "environment": "development"
}
```

### Menguji dengan `curl`
```bash
# Pengujian lokal via terminal
curl -i http://localhost:4000/api/health
```

---

## 6. Menjalankan Pengujian (Testing)

Pengujian unit dan integrasi HTTP menggunakan **Vitest** dan **Supertest**:

```bash
# Menjalankan seluruh test suite sekali jalan
npm test

# Menjalankan test dalam mode watch interaktif
npm run test:watch
```

Cakupan pengujian otomatis meliputi:
- Health endpoint status HTTP 200
- Validitas format tanggal ISO dinamis pada timestamp
- Struktur amplop JSON respon
- Penanganan 404 pada rute tidak dikenal
- Penanganan error aman tanpa kebocoran *stack trace* di lingkungan produksi
- Header keamanan Helmet (`X-Content-Type-Options`, `X-Frame-Options`, dll)
- Batas ukuran payload request body

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
