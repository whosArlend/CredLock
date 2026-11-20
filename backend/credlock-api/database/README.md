# CredLock Security Intelligence Database

Dokumentasi arsitektur, skema tabel, Row Level Security (RLS), seed data, dan panduan instalasi database untuk **CredLock Security Intelligence API** menggunakan Supabase PostgreSQL.

---

## 1. Arsitektur Database

Database ini berjalan di atas instance **Supabase Managed PostgreSQL** yang berbagi project yang sama dengan Modul 1 (Sales-API), namun **terisolasi secara logis**:

- **Tabel Modul 1 (Sales-API)**: `categories`, `products`, `customers`, `transactions`.
- **Tabel CredLock (Security Intelligence)**: `breaches`, `recommendations`, `articles`.

Skema CredLock didesain murni sebagai penyedia intelijen siber dan materi edukasi. Tidak ada data kredensial, password, master hash, ataupun session pengguna yang disimpan di dalam database ini (*Zero-Knowledge Client Invariant*).

```
+-----------------------------------------------------------------------------------------+
|                                  Supabase PostgreSQL                                    |
|                                                                                         |
|  [Modul 1: Sales-API Tables]               [CredLock Security Intelligence Tables]       |
|  - categories                              - breaches                                   |
|  - products                                - recommendations                            |
|  - customers                               - articles                                   |
|  - transactions                                                                         |
|                                            (Isolated schemas, separate RLS policies)    |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Deskripsi Tabel & Field

### A. Tabel `breaches`
Menyimpan katalog historis insiden kebocoran data terverifikasi di Indonesia dan global.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Pengenal unik catatan. |
| `title` | `TEXT` | `NOT NULL` | Judul insiden kebocoran. |
| `slug` | `TEXT` | `NOT NULL UNIQUE` | URL identifier ramah SEO/API. |
| `domain` | `TEXT` | `NULLABLE` | Domain utama layanan terdampak. |
| `organization` | `TEXT` | `NULLABLE` | Nama organisasi/perusahaan pemilik platform. |
| `breach_date` | `DATE` | `NULLABLE` | Tanggal terjadinya insiden. |
| `added_date` | `DATE` | `NOT NULL DEFAULT CURRENT_DATE` | Tanggal insiden dicatat ke sistem. |
| `pwn_count` | `BIGINT` | `CHECK (pwn_count >= 0)` | Estimasi akun/kredensial yang bocor. |
| `description` | `TEXT` | `NOT NULL` | Uraian kronologi dan dampak kebocoran. |
| `data_classes` | `TEXT[]` | `NOT NULL DEFAULT '{}'` | Jenis data yang terekspos (email, password, dll). |
| `severity` | `TEXT` | `CHECK (severity IN ('low','medium','high','critical'))` | Tingkat keparahan insiden. |
| `is_verified` | `BOOLEAN` | `NOT NULL DEFAULT false` | Status verifikasi kebenaran insiden. |
| `is_published` | `BOOLEAN` | `NOT NULL DEFAULT true` | Status publikasi ke endpoint API publik. |
| `source_url` | `TEXT` | `NULLABLE` | Tautan laporan investigasi/berita resmi. |
| `logo_url` | `TEXT` | `NULLABLE` | Tautan icon/logo entitas. |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT NOW()` | Waktu pembuatan baris. |
| `updated_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT NOW()` | Waktu pembaruan terakhir (auto-trigger). |

### B. Tabel `recommendations`
Menyimpan panduan keamanan terstruktur, langkah mitigasi darurat, dan playbooks.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Pengenal unik rekomendasi. |
| `title` | `TEXT` | `NOT NULL` | Judul playbook / panduan. |
| `slug` | `TEXT` | `NOT NULL UNIQUE` | URL identifier ramah API. |
| `category` | `TEXT` | `CHECK (category IN ('password','auth','device','network','incident_response'))` | Kategori mitigasi. |
| `priority` | `TEXT` | `CHECK (priority IN ('low','medium','high','critical'))` | Urgensi rekomendasi. |
| `summary` | `TEXT` | `NOT NULL` | Ringkasan singkat tindakan. |
| `action_steps` | `JSONB` | `NOT NULL DEFAULT '[]'::jsonb` | Daftar langkah instruksi terstruktur. |
| `target_audience` | `TEXT` | `NULLABLE` | Sasaran target pengguna. |
| `tags` | `TEXT[]` | `NOT NULL DEFAULT '{}'` | Tag pencarian terkait. |
| `is_published` | `BOOLEAN` | `NOT NULL DEFAULT false` | Status publikasi. |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT NOW()` | Waktu pembuatan baris. |
| `updated_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT NOW()` | Waktu pembaruan terakhir (auto-trigger). |

### C. Tabel `articles`
Menyimpan artikel edukasi keamanan siber dan analisis teknis berformat Markdown.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Pengenal unik artikel. |
| `title` | `TEXT` | `NOT NULL` | Judul artikel. |
| `slug` | `TEXT` | `NOT NULL UNIQUE` | URL slug unik. |
| `category` | `TEXT` | `CHECK (category IN ('guide','analysis','news','explainer'))` | Format materi edukasi. |
| `summary` | `TEXT` | `NOT NULL` | Ringkasan paragraf artikel. |
| `content` | `TEXT` | `NOT NULL` | Isi materi lengkap berformat Markdown. |
| `author_name` | `TEXT` | `NOT NULL` | Nama penulis / tim penyusun. |
| `read_time_minutes` | `INTEGER` | `NOT NULL CHECK (read_time_minutes > 0)` | Estimasi waktu baca (menit). |
| `tags` | `TEXT[]` | `NOT NULL DEFAULT '{}'` | Tag subjek bahasan. |
| `is_published` | `BOOLEAN` | `NOT NULL DEFAULT false` | Status publikasi artikel. |
| `published_at` | `TIMESTAMPTZ`| `NULLABLE` | Tanggal resmi rilis materi. |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT NOW()` | Waktu pembuatan baris. |
| `updated_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT NOW()` | Waktu pembaruan terakhir (auto-trigger). |

---

## 3. Row Level Security (RLS) & Kebijakan Akses

Seluruh tabel CredLock menerapkan Row Level Security (RLS) secara ketat:

1. **Akses Publik (Anon & Authenticated Roles)**:
   - `breaches`: Hanya dapat membaca baris yang `is_published = true AND is_verified = true`.
   - `recommendations`: Hanya dapat membaca baris yang `is_published = true`.
   - `articles`: Hanya dapat membaca baris yang `is_published = true`.
2. **Operasi Tulis (INSERT, UPDATE, DELETE)**:
   - Tidak ada policy publik yang dibuat. Di PostgreSQL, ketiadaan matching policy berarti **DENY ALL** secara otomatis bagi anonim.
   - Operasi penulisan hanya dapat dilakukan melalui backend API CredLock menggunakan kredensial **Service Role Key** Supabase (yang berjalan di lingkungan server terisolasi dengan atribut `BYPASSRLS`).
3. **Isolasi Penuh**:
   - Skrip migrasi tidak mengubah, menghapus, atau mereferensikan policy tabel Sales-API Modul 1.

---

## 4. Indeks & Trigger Otomatis

- **Indeks Pencarian & Filter**:
  - `slug` pada ketiga tabel diindeks secara unik untuk pencarian instan $O(1)$.
  - Filter publikasi: `(is_published, is_verified)` pada `breaches`, `(is_published, priority)` pada `recommendations`, dan `(is_published)` pada `articles`.
  - Filter kategori & keparahan: `severity`, `category`, `breach_date`, dan `published_at`.
- **Trigger `update_updated_at_column()`**:
  - Secara otomatis memperbarui kolom `updated_at` menjadi waktu UTC terkini setiap kali ada operasi `UPDATE` pada baris tabel terkait.

---

## 5. Ringkasan Data Awal (Seed Data)

File seed `001_initial_seed.sql` memuat data valid siap pakai:

1. **5 Insiden Kebocoran Nyata Terverifikasi**:
   - `tokopedia-2020` (~91 juta akun, sumber: ZDNet)
   - `bukalapak-2019` (~13 juta akun, sumber: The Hacker News)
   - `canva-2019` (~137 juta akun, sumber: ZDNet)
   - `dropbox-2012` (~68,6 juta akun, sumber: Krebs on Security)
   - `adobe-2013` (~153 juta akun, sumber: Krebs on Security)
2. **8 Rekomendasi Keamanan Praktis**:
   - Autentikasi Dua Faktor (2FA/MFA)
   - Penggunaan Password Manager
   - Pencegahan Daur Ulang Password
   - Pengamanan Email Utama
   - Kewaspadaan Phishing & Rekayasa Sosial
   - Pembaruan Perangkat Lunak
   - Enkripsi Wi-Fi Publik
   - Prosedur Tanggap Darurat Kredensial
3. **6 Artikel Edukasi Keamanan Mendalam**:
   - Anatomi Password Kuat & Entropi Matematika
   - Cara Kerja Protokol K-Anonymity pada Pemeriksaan Kebocoran
   - Analisis Serangan Credential Stuffing & Botnet
   - Filosofi Arsitektur Zero-Knowledge
   - Protokol Tanggap Darurat 15 Menit Pertama
   - Evolusi Algoritma Hashing (MD5, Bcrypt, PBKDF2, Argon2)

---

## 6. Panduan Eksekusi di Supabase SQL Editor

Untuk mengaplikasikan skema dan data awal ke dalam database Supabase:

### Urutan Eksekusi
1. Jalankan **Migration Skema**: `backend/credlock-api/database/migrations/001_initial_schema.sql`
2. Jalankan **Seed Data**: `backend/credlock-api/database/seeds/001_initial_seed.sql`

### Langkah-Langkah Manual:
1. Buka dashboard proyek Supabase Anda di browser.
2. Masuk ke menu **SQL Editor** pada navigasi sisi kiri.
3. Klik **New query**.
4. Salin seluruh isi dari file `backend/credlock-api/database/migrations/001_initial_schema.sql` dan tempel ke dalam editor.
5. Klik **Run** (atau tekan `Ctrl + Enter`). Pastikan muncul pesan sukses: `Success. No rows returned`.
6. Buat query baru, salin seluruh isi dari file `backend/credlock-api/database/seeds/001_initial_seed.sql`, lalu klik **Run**.

---

## 7. Panduan Verifikasi Instalasi

Setelah kedua file dieksekusi, jalankan kueri SQL berikut di SQL Editor untuk memverifikasi bahwa seluruh data telah terpasang dengan benar:

```sql
-- 1. Verifikasi jumlah data yang terpasang
SELECT 'breaches' AS table_name, count(*) AS total_rows FROM breaches
UNION ALL
SELECT 'recommendations', count(*) FROM recommendations
UNION ALL
SELECT 'articles', count(*) FROM articles;
```
*Hasil yang diharapkan:*
- `breaches`: 5
- `recommendations`: 8
- `articles`: 6

```sql
-- 2. Verifikasi efektivitas Row Level Security (RLS)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('breaches', 'recommendations', 'articles');
```
*Hasil yang diharapkan:*
Ketiga tabel memiliki kolom `rowsecurity = true`.

---

## 8. Panduan Rollback (Jika Diperlukan)

Jika perlu membatalkan migrasi atau membersihkan tabel CredLock tanpa menyentuh tabel Sales-API:

```sql
-- Rollback CredLock tables safely:
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS recommendations CASCADE;
DROP TABLE IF EXISTS breaches CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```
*(Tabel `categories`, `products`, `customers`, dan `transactions` milik Sales-API tetap aman dan tidak akan terpengaruh).*
