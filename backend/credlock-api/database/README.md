# CredLock Security Intelligence Database

Dokumentasi arsitektur, skema tabel, Row Level Security (RLS), hak akses SQL (grants), seed data, dan panduan instalasi & verifikasi database untuk **CredLock Security Intelligence API** menggunakan Supabase PostgreSQL.

---

## 1. Arsitektur Database

Database ini berjalan di atas instance **Supabase Managed PostgreSQL** yang berbagi project yang sama dengan Modul 1 (Sales-API), namun **terisolasi secara logis dan aman**:

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
|                                            (Isolated schemas, separate RLS & grants)    |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Deskripsi Tabel & Field

### A. Tabel `breaches`
Menyimpan katalog historis insiden kebocoran data terverifikasi di Indonesia dan global.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Pengenal unik catatan. |
| `title` | `TEXT` | `NOT NULL, CHECK (length(trim(title)) > 0)` | Judul insiden kebocoran. |
| `slug` | `TEXT` | `NOT NULL UNIQUE, CHECK (length(trim(slug)) > 0)` | URL identifier ramah SEO/API. |
| `domain` | `TEXT` | `NULLABLE` | Domain utama layanan terdampak. |
| `organization` | `TEXT` | `NULLABLE` | Nama organisasi/perusahaan pemilik platform. |
| `breach_date` | `DATE` | `NULLABLE` | Tanggal terjadinya insiden. |
| `added_date` | `DATE` | `NOT NULL DEFAULT CURRENT_DATE` | Tanggal insiden dicatat ke sistem. |
| `pwn_count` | `BIGINT` | `CHECK (pwn_count >= 0)` | Estimasi akun/kredensial yang bocor. |
| `description` | `TEXT` | `NOT NULL, CHECK (length(trim(description)) > 0)` | Uraian kronologi dan dampak kebocoran. |
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
| `title` | `TEXT` | `NOT NULL, CHECK (length(trim(title)) > 0)` | Judul playbook / panduan. |
| `slug` | `TEXT` | `NOT NULL UNIQUE, CHECK (length(trim(slug)) > 0)` | URL identifier ramah API. |
| `category` | `TEXT` | `CHECK (category IN ('password','auth','device','network','incident_response'))` | Kategori mitigasi. |
| `priority` | `TEXT` | `CHECK (priority IN ('low','medium','high','critical'))` | Urgensi rekomendasi. |
| `summary` | `TEXT` | `NOT NULL, CHECK (length(trim(summary)) > 0)` | Ringkasan singkat tindakan. |
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
| `title` | `TEXT` | `NOT NULL, CHECK (length(trim(title)) > 0)` | Judul artikel. |
| `slug` | `TEXT` | `NOT NULL UNIQUE, CHECK (length(trim(slug)) > 0)` | URL slug unik. |
| `category` | `TEXT` | `CHECK (category IN ('guide','analysis','news','explainer'))` | Format materi edukasi. |
| `summary` | `TEXT` | `NOT NULL, CHECK (length(trim(summary)) > 0)` | Ringkasan paragraf artikel. |
| `content` | `TEXT` | `NOT NULL, CHECK (length(trim(content)) > 0)` | Isi materi lengkap berformat Markdown. |
| `author_name` | `TEXT` | `NOT NULL, CHECK (length(trim(author_name)) > 0)` | Nama penulis / tim penyusun. |
| `read_time_minutes` | `INTEGER` | `NOT NULL CHECK (read_time_minutes > 0)` | Estimasi waktu baca (menit). |
| `tags` | `TEXT[]` | `NOT NULL DEFAULT '{}'` | Tag subjek bahasan. |
| `is_published` | `BOOLEAN` | `NOT NULL DEFAULT false` | Status publikasi artikel. |
| `published_at` | `TIMESTAMPTZ`| `NULLABLE` | Tanggal resmi rilis materi. |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT NOW()` | Waktu pembuatan baris. |
| `updated_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT NOW()` | Waktu pembaruan terakhir (auto-trigger). |

---

## 3. Keamanan Tingkat Ganda: SQL Grants & Row Level Security (RLS)

CredLock menerapkan prinsip **Defense-in-Depth** dengan memisahkan izin SQL tabel (*SQL Table Privileges*) dan penyaringan baris (*Row Level Security*):

### A. SQL Table Privileges (Layer 1)
```sql
REVOKE ALL ON TABLE breaches, recommendations, articles FROM anon, authenticated, public;
GRANT SELECT ON TABLE breaches, recommendations, articles TO anon, authenticated;
GRANT ALL ON TABLE breaches, recommendations, articles TO service_role, postgres;
```
- Peran publik (`anon`, `authenticated`, `public`) **hanya memiliki hak `SELECT`**. Operasi `INSERT`, `UPDATE`, `DELETE` dicabut total pada level skema database.
- Peran backend (`service_role`) dan administrator database (`postgres`) memiliki izin penuh.

### B. Row Level Security Policies (Layer 2)
Meskipun klien publik memiliki hak `SELECT`, baris data yang dapat dibaca dibatasi secara ketat oleh RLS:
- **`breaches`**: `(is_published = true AND is_verified = true)` — Publik hanya dapat melihat insiden yang sudah diverifikasi dan dipublikasikan.
- **`recommendations`**: `(is_published = true)` — Publik hanya dapat melihat panduan yang aktif dirilis.
- **`articles`**: `(is_published = true)` — Publik hanya dapat melihat artikel yang telah dipublikasikan.

---

## 4. Indeks & Trigger Otomatis

- **Indeks Performa & Filter**:
  - `idx_breaches_slug`, `idx_breaches_published_verified`, `idx_breaches_severity`, `idx_breaches_breach_date`, `idx_breaches_domain`.
  - `idx_recommendations_slug`, `idx_recommendations_published_priority`, `idx_recommendations_category`.
  - `idx_articles_slug`, `idx_articles_published`, `idx_articles_category`, `idx_articles_published_at`.
- **Trigger `trigger_*_updated_at`**:
  - Memanggil `update_updated_at_column()` untuk memperbarui kolom `updated_at` ke waktu UTC terkini saat baris diperbarui.

---

## 5. Ringkasan Data Awal (Seed Data)

File seed `001_initial_seed.sql` memuat data valid siap pakai:

1. **5 Insiden Kebocoran Nyata Terverifikasi**:
   - `tokopedia-2020` (91.000.000 akun, ZDNet / Catalin Cimpanu)
   - `bukalapak-2019` (13.000.000 akun, The Hacker News / Gnosticplayers)
   - `canva-2019` (137.000.000 akun, ZDNet / Catalin Cimpanu)
   - `dropbox-2012` (68.680.741 akun, Krebs on Security / Leakbase / Motherboard)
   - `adobe-2013` (152.989.505 akun, Krebs on Security / Alex Holden)
2. **8 Rekomendasi Keamanan Praktis**:
   - Autentikasi Dua Faktor (2FA/MFA)
   - Penggunaan Password Manager Terpercaya
   - Penghentian Daur Ulang Password (Password Reuse)
   - Pengamanan Email Utama
   - Kewaspadaan Phishing & Rekayasa Sosial
   - Pembaruan Perangkat Lunak & Sistem Operasi
   - Enkripsi Wi-Fi Publik
   - Prosedur Tanggap Darurat Kredensial
3. **6 Artikel Edukasi Keamanan Mendalam**:
   - Anatomi Password Kuat & Entropi Matematis ($R = N^L$)
   - Memahami Konsep K-Anonymity pada Pengecekan Kebocoran
   - Bahaya Credential Stuffing & Botnet
   - Filosofi Arsitektur Zero-Knowledge
   - Protokol Tanggap Darurat 15 Menit Pertama
   - Evolusi Algoritma Hashing (MD5, Bcrypt, PBKDF2, Argon2)

---

## 6. Panduan Eksekusi di Supabase SQL Editor

### Urutan Eksekusi
1. Jalankan **Migration Skema**: `backend/credlock-api/database/migrations/001_initial_schema.sql`
2. Jalankan **Seed Data**: `backend/credlock-api/database/seeds/001_initial_seed.sql`

Kedua file telah dibungkus dalam blok transaksi `BEGIN; ... COMMIT;` sehingga jika terjadi kesalahan sintaks atau interupsi, perubahan akan otomatis di-rollback tanpa meninggalkan tabel setengah jadi.

---

## 7. Kueri Verifikasi Database (Jalankan di Supabase SQL Editor)

Jalankan kueri-kueri berikut secara terpisah untuk memverifikasi seluruh komponen telah terpasang dengan sukses:

### 1. Verifikasi Keberadaan Tabel
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('breaches', 'recommendations', 'articles')
ORDER BY table_name;
```
*Expected Result: 3 baris (`articles`, `breaches`, `recommendations`).*

### 2. Verifikasi Jumlah Data (Row Counts)
```sql
SELECT 'breaches' AS table_name, count(*) AS total_rows FROM breaches
UNION ALL
SELECT 'recommendations', count(*) FROM recommendations
UNION ALL
SELECT 'articles', count(*) FROM articles;
```
*Expected Result: `breaches`: 5, `recommendations`: 8, `articles`: 6.*

### 3. Verifikasi Status RLS
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('breaches', 'recommendations', 'articles')
ORDER BY tablename;
```
*Expected Result: Ketiga tabel memiliki `rowsecurity = true`.*

### 4. Verifikasi Kebijakan RLS (Policies)
```sql
SELECT policyname, tablename, cmd, roles, qual 
FROM pg_policies 
WHERE tablename IN ('breaches', 'recommendations', 'articles')
ORDER BY tablename;
```
*Expected Result: 3 policies SELECT untuk peran `{anon,authenticated}`.*

### 5. Verifikasi Hak Akses Tabel (SQL Grants)
```sql
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name IN ('breaches', 'recommendations', 'articles')
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;
```
*Expected Result: Hanya hak `SELECT` yang terdaftar untuk `anon` dan `authenticated`.*

### 6. Verifikasi Indeks Terpasang
```sql
SELECT tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('breaches', 'recommendations', 'articles')
ORDER BY tablename, indexname;
```
*Expected Result: 14 indeks (termasuk 3 indeks bawaan Primary Key + 11 indeks custom).*

### 7. Verifikasi Trigger `updated_at`
```sql
SELECT trigger_name, event_manipulation, event_object_table, action_timing
FROM information_schema.triggers 
WHERE event_object_table IN ('breaches', 'recommendations', 'articles')
ORDER BY event_object_table;
```
*Expected Result: 3 trigger `BEFORE UPDATE` aktif.*

---

## 8. Panduan Rollback Aman

Jika ingin membersihkan tabel CredLock tanpa memengaruhi tabel Sales-API:

```sql
BEGIN;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS recommendations CASCADE;
DROP TABLE IF EXISTS breaches CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
COMMIT;
```
