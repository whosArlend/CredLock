-- ============================================================================
-- Seed Data: 001_initial_seed.sql
-- Project: CredLock Security Intelligence API
-- Database: Supabase PostgreSQL
-- Description: Inserts initial verified breach incidents, practical security
--              recommendations, and educational cybersecurity articles.
-- Safety: Uses ON CONFLICT (slug) DO NOTHING to allow idempotent re-execution.
-- ============================================================================

-- ============================================================================
-- 1. SEED: breaches (5 Verified Incidents with Documented Sources)
-- ============================================================================

INSERT INTO breaches (
    title,
    slug,
    domain,
    organization,
    breach_date,
    added_date,
    pwn_count,
    description,
    data_classes,
    severity,
    is_verified,
    is_published,
    source_url
) VALUES
(
    'Tokopedia Data Breach (2020)',
    'tokopedia-2020',
    'tokopedia.com',
    'PT Tokopedia',
    '2020-03-01',
    '2020-05-02',
    91000000,
    'Pada Maret 2020, basis data pengguna platform e-commerce Tokopedia bocor dan diperjualbelikan di forum dark web oleh kelompok peretas ShinyHunters. Data yang terekspos mencakup nama lengkap, alamat email, nomor telepon, dan hash password (terenkripsi salt). Tokopedia mengonfirmasi insiden tersebut dan mengimbau pengguna untuk segera mengganti password serta mengaktifkan verifikasi dua langkah (OTP).',
    ARRAY['Email addresses', 'Names', 'Phone numbers', 'Password hashes', 'Dates of birth'],
    'critical',
    true,
    true,
    'https://www.zdnet.com/article/hacker-leaks-91-million-records-from-indonesian-e-commerce-giant-tokopedia/'
),
(
    'Bukalapak Data Breach (2019)',
    'bukalapak-2019',
    'bukalapak.com',
    'PT Bukalapak.com',
    '2019-03-01',
    '2019-03-17',
    13000000,
    'Pada awal 2019, peretas dengan alias Gnosticplayers mengklaim telah mengekstrak dan menjual data sekitar 13 juta pengguna Bukalapak di pasar dark web Dream Market. Insiden ini melibatkan kebocoran nama pengguna, email, dan hash password, meskipun pihak Bukalapak menyatakan bahwa data transaksi dan keuangan pengguna tidak tersentuh.',
    ARRAY['Email addresses', 'Usernames', 'Password hashes', 'Names'],
    'high',
    true,
    true,
    'https://thehackernews.com/2019/03/indonesian-bukalapak-hacked.html'
),
(
    'Canva Security Breach (2019)',
    'canva-2019',
    'canva.com',
    'Canva Pty Ltd',
    '2019-05-24',
    '2019-05-24',
    137000000,
    'Pada Mei 2019, platform desain grafis Canva mengalami pembobolan keamanan oleh pelaku ancaman siber Gnosticplayers. Sebanyak 137 juta akun terdampak, di mana penyerang berhasil mengakses email, nama pengguna, nama asli, dan password yang di-hash dengan algoritma bcrypt. Canva merespons dengan mereset token sesi dan menyarankan perubahan kredensial.',
    ARRAY['Email addresses', 'Usernames', 'Names', 'Geographic locations', 'Password hashes'],
    'critical',
    true,
    true,
    'https://www.zdnet.com/article/canva-security-incident-post-mortem/'
),
(
    'Dropbox Credential Spill (2012 / Disclosed 2016)',
    'dropbox-2012',
    'dropbox.com',
    'Dropbox, Inc.',
    '2012-07-01',
    '2016-08-31',
    68680741,
    'Pada Juli 2012, Dropbox mengalami kebocoran data akibat penggunaan ulang password seorang karyawan dari kompromi LinkedIn sebelumnya. Basis data lengkap yang mencakup lebih dari 68 juta akun pengguna baru diverifikasi secara publik pada Agustus 2016. Seluruh password disimpan dalam bentuk salted hashes (bcrypt dan SHA-1).',
    ARRAY['Email addresses', 'Password hashes'],
    'high',
    true,
    true,
    'https://krebsonsecurity.com/2016/08/dropbox-confirming-2012-leak-resets-passwords/'
),
(
    'Adobe Systems Security Breach (2013)',
    'adobe-2013',
    'adobe.com',
    'Adobe Systems Inc.',
    '2013-10-04',
    '2013-10-04',
    153000000,
    'Pada Oktober 2013, sistem server Adobe disusupi oleh penyerang yang berhasil mencuri data sekitar 153 juta akun. Password pengguna disimpan menggunakan enkripsi simetris 3DES mode ECB (bukan salt-and-hash modern) dan petunjuk password (password hints) disimpan dalam teks biasa tanpa enkripsi, memungkinkan peneliti keamanan mendekripsi jutaan password dengan mudah.',
    ARRAY['Email addresses', 'Password hints', 'Password hashes', 'Usernames'],
    'critical',
    true,
    true,
    'https://krebsonsecurity.com/2013/11/source-code-more-data-from-adobe-breach-discovered/'
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 2. SEED: recommendations (8 Curated Practical Security Playbooks)
-- ============================================================================

INSERT INTO recommendations (
    title,
    slug,
    category,
    priority,
    summary,
    action_steps,
    target_audience,
    tags,
    is_published
) VALUES
(
    'Aktifkan Autentikasi Dua Faktor (2FA / MFA)',
    'aktifkan-autentikasi-dua-faktor',
    'auth',
    'critical',
    'Autentikasi dua faktor menambahkan lapisan pertahanan esensial selain password, mencegah peretasan akun hingga 99% meskipun password Anda telah bocor.',
    '[
        "Unduh aplikasi autentikator mandiri seperti Aegis Authenticator, Ente Auth, atau Google Authenticator.",
        "Buka pengaturan keamanan pada akun penting Anda (Email, Perbankan, E-commerce, Media Sosial).",
        "Pindai kode QR 2FA menggunakan aplikasi autentikator dan simpan kode pemulihan cadangan (recovery codes) di tempat aman.",
        "Hindari menggunakan SMS OTP jika aplikasi autentikator atau kunci keamanan hardware (FIDO2) tersedia."
    ]'::jsonb,
    'Semua pengguna internet',
    ARRAY['2fa', 'mfa', 'authenticator', 'security-hygiene'],
    true
),
(
    'Gunakan Password Manager Terpercaya',
    'gunakan-password-manager-terpercaya',
    'password',
    'critical',
    'Mengingat puluhan password yang unik dan kompleks secara manual hampir mustahil. Password manager mengamankan seluruh kredensial dalam brankas terenkripsi dengan satu Master Password.',
    '[
        "Pilih password manager bereputasi dengan arsitektur zero-knowledge (contoh: Bitwarden, 1Password, atau KeePassXC).",
        "Buat Master Password yang panjang dan mudah diingat menggunakan metode passphrase (minimal 4 kata acak).",
        "Pindahkan seluruh password tersimpan dari browser web ke dalam vault password manager.",
        "Aktifkan autofill terverifikasi untuk melindungi diri dari situs phishing palsu."
    ]'::jsonb,
    'Pengguna dengan banyak akun online',
    ARRAY['passwords', 'vault', 'zero-knowledge', 'bitwarden'],
    true
),
(
    'Hentikan Penggunaan Ulang Password (Password Reuse)',
    'hentikan-penggunaan-ulang-password',
    'password',
    'high',
    'Menggunakan password yang sama di beberapa situs web membuka celah fatal bagi serangan Credential Stuffing saat salah satu layanan mengalami kebocoran data.',
    '[
        "Identifikasi akun-akun yang masih memakai password duplikat menggunakan audit CredLock atau password manager.",
        "Ganti password akun prioritas tinggi (terutama email dan perbankan) dengan password unik acak.",
        "Gunakan fitur generator password CredLock untuk membuat string berentropi tinggi (minimal 16 karakter).",
        "Pastikan tidak ada dua layanan yang memiliki kata sandi yang sama persis."
    ]'::jsonb,
    'Semua pengguna internet',
    ARRAY['passwords', 'credential-stuffing', 'hygiene'],
    true
),
(
    'Amankan Email Utama Sebagai Pusat Pemulihan Akun',
    'amankan-email-utama',
    'auth',
    'critical',
    'Akun email adalah gerbang utama menuju seluruh identitas digital Anda karena tautan reset password untuk semua layanan lainnya dikirim ke kotak masuk ini.',
    '[
        "Terapkan password terkuat Anda pada akun email utama (minimal 20 karakter atau passphrase 5 kata).",
        "Wajib aktifkan 2FA berbasis aplikasi atau hardware security key pada penyedia email.",
        "Periksa daftar perangkat yang sedang aktif login dan putuskan koneksi yang mencurigakan.",
        "Cek aturan forwarding email untuk memastikan tidak ada pengalihan otomatis ke alamat email asing."
    ]'::jsonb,
    'Semua pengguna',
    ARRAY['email-security', 'account-recovery', 'auth'],
    true
),
(
    'Waspada Terhadap Phishing dan Rekayasa Sosial',
    'waspada-phishing-dan-rekayasa-sosial',
    'incident_response',
    'high',
    'Mayoritas insiden peretasan diawali dari manipulasi psikologis (rekayasa sosial) melalui tautan palsu, email tipuan, atau pesan darurat palsu.',
    '[
        "Selalu periksa domain pengirim dan URL bilah alamat browser sebelum memasukkan kredensial login.",
        "Jangan pernah mengklik tautan verifikasi atau login dari pesan WhatsApp, Telegram, atau SMS yang tidak diminta.",
        "Waspadai pesan yang menciptakan rasa panik atau urgensi palsu (misal ancaman penutupan akun dalam 24 jam).",
        "Hubungi layanan pelanggan resmi melalui saluran terpisah jika ragu akan keaslian pesan konfirmasi."
    ]'::jsonb,
    'Semua pengguna internet',
    ARRAY['phishing', 'social-engineering', 'awareness'],
    true
),
(
    'Perbarui Perangkat Lunak dan Sistem Operasi Secara Rutin',
    'perbarui-perangkat-dan-aplikasi',
    'device',
    'medium',
    'Pembaruan perangkat lunak tidak hanya menghadirkan fitur baru, melainkan menambal kerentanan keamanan kritis yang telah dieksploitasi di alam liar (zero-day vulnerabilities).',
    '[
        "Aktifkan opsi pembaruan otomatis (automatic updates) pada sistem operasi (Windows, macOS, Android, iOS).",
        "Segera perbarui web browser (Chrome, Firefox, Safari) begitu versi baru tersedia.",
        "Hapus aplikasi atau plugin ekstensi browser yang sudah tidak digunakan untuk mengurangi attack surface.",
        "Lakukan restart perangkat secara berkala agar instalasi tambalan keamanan selesai secara sempurna."
    ]'::jsonb,
    'Pengguna desktop dan smartphone',
    ARRAY['patching', 'os-security', 'updates'],
    true
),
(
    'Enkripsi Koneksi di Jaringan Wi-Fi Publik',
    'enkripsi-koneksi-di-wifi-publik',
    'network',
    'medium',
    'Jaringan Wi-Fi terbuka di kafe, bandara, atau hotel rentan terhadap serangan Man-in-the-Middle (MitM) dan penyadapan paket data yang tidak terenkripsi.',
    '[
        "Hindari mengakses portal perbankan atau memasukkan kredensial sensitif saat terhubung ke Wi-Fi terbuka tanpa sandi.",
        "Gunakan VPN terpercaya yang menerapkan enkripsi kuat (WireGuard atau OpenVPN) jika terpaksa menggunakan Wi-Fi publik.",
        "Gunakan fitur DNS over HTTPS (DoH) atau DNS over TLS (DoT) seperti Cloudflare 1.1.1.1 untuk melindungi kueri alamat.",
        "Matikan opsi automatic Wi-Fi connection pada perangkat ponsel Anda."
    ]'::jsonb,
    'Pengguna mobile & remote worker',
    ARRAY['wifi', 'vpn', 'network-hygiene', 'encryption'],
    true
),
(
    'Lakukan Audit Akses dan Prosedur Tanggap Darurat Kredensial',
    'audit-akses-dan-tanggap-darurat',
    'incident_response',
    'high',
    'Ketika kredensial Anda terdeteksi dalam insiden kebocoran data, respons cepat dan terstruktur mencegah kerugian berantai pada aset digital Anda.',
    '[
        "Gunakan Breach Checker CredLock untuk memeriksa apakah password Anda sudah pernah terekspos.",
        "Jika password terdeteksi bocor, segera ganti password di layanan bersangkutan dan layanan lain yang memakai password serupa.",
        "Pilih opsi Keluar dari Semua Perangkat (Log out of all devices) pada menu keamanan akun.",
        "Tinjau riwayat transaksi keuangan atau aktivitas login terakhir untuk memverifikasi tidak ada transaksi siluman."
    ]'::jsonb,
    'Pengguna yang terindikasi mengalami kebocoran',
    ARRAY['incident-response', 'breach-check', 'emergency'],
    true
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 3. SEED: articles (6 Educational Security Guides & Technical Explainers)
-- ============================================================================

INSERT INTO articles (
    title,
    slug,
    category,
    summary,
    content,
    author_name,
    read_time_minutes,
    tags,
    is_published,
    published_at
) VALUES
(
    'Anatomi Password yang Kuat: Lebih dari Sekadar Karakter Acak',
    'anatomi-password-yang-kuat',
    'guide',
    'Pelajari bagaimana entropi, panjang karakter, dan kombinasi kata membentuk pertahanan matematis terhadap serangan brute-force modern.',
    '# Anatomi Password yang Kuat: Lebih dari Sekadar Karakter Acak

Banyak pengguna mengira bahwa mengganti huruf "a" dengan "@" atau "s" dengan "\$" sudah cukup membuat password menjadi aman. Namun, dalam kacamata analisis kriptografi modern, trik substitusi sederhana seperti itu sangat mudah ditebak oleh kamus serangan (*dictionary attacks*).

## Mengapa Panjang Karakter Mengalahkan Kompleksitas

Waktu komputasi yang dibutuhkan mesin penyerang untuk memecahkan password secara brute-force ditentukan oleh rumus ruang pencarian:

$$R = N^L$$

Di mana:
- $N$ adalah jumlah kemungkinan karakter (charset size).
- $L$ adalah panjang password (length).

Eksponen panjang ($L$) memiliki dampak eksponensial yang jauh lebih besar terhadap entropi matematis dibandingkan sekadar memperbesar ukuran set karakter ($N$). Password sepanjang 16 karakter yang hanya terdiri dari huruf kecil dan angka jauh lebih tahan terhadap serangan GPU modern dibandingkan password 8 karakter yang dipenuhi simbol rumit.

## Metode Passphrase: Solusi Praktis Manusiawi

Metode **passphrase** (menggabungkan 4 hingga 6 kata acak yang tidak berhubungan, misalnya: *kelinci-orbit-kopi-lentera*) menawarkan dua keuntungan mutlak:
1. **Entropi sangat tinggi**: Dengan kamus 7.776 kata acak (standar EFF Diceware), 4 kata menghasilkan $\sim 51$ bit entropi, sementara 5 kata menghasilkan $\sim 65$ bit entropi.
2. **Mudah dihafal manusia**: Otak manusia jauh lebih mudah mengingat gambaran kata bermakna daripada deretan simbol acak seperti `x7#P!9$q`.

## Ringkasan Praktik Terbaik

- Buat password minimal 14 hingga 16 karakter untuk akun standar.
- Buat password minimal 20 karakter atau gunakan passphrase untuk akun master dan email utama.
- Jangan gunakan informasi personal seperti tanggal lahir, nama hewan peliharaan, atau nama kota kelahiran.',
    'Tim Keamanan CredLock',
    4,
    ARRAY['passwords', 'entropy', 'security-hygiene', 'guide'],
    true,
    TIMEZONE('utc'::TEXT, NOW()) - INTERVAL '5 days'
),
(
    'Memahami Konsep K-Anonymity pada Pengecekan Kebocoran Password',
    'memahami-k-anonymity-pwned-passwords',
    'explainer',
    'Bagaimana CredLock dapat memverifikasi apakah password Anda bocor di internet tanpa pernah mengetahui atau mengirimkan password Anda ke server?',
    '# Memahami Konsep K-Anonymity pada Pengecekan Kebocoran Password

Salah satu kekhawatiran terbesar saat menggunakan alat pemeriksa kebocoran password online adalah: *"Apakah situs pemeriksa tersebut justru merekam password yang saya masukkan?"*

Di CredLock, kami memegang teguh prinsip **Zero-Knowledge Architecture**. Kami memanfaatkan protokol matematika elegan yang disebut **k-anonymity** melalui integrasi API *Have I Been Pwned* (HIBP).

## Cara Kerja K-Anonymity

Ketika Anda mengetik password pada fitur Breach Checker CredLock:

1. **Hashing Lokal Client-Side**:
   Browser Anda menghitung hash kriptografis SHA-1 dari password tersebut secara lokal menggunakan Web Crypto API. Password asli dalam bentuk teks polos (plaintext) tidak pernah meninggalkan memori browser.
   
   Contoh hash SHA-1 untuk kata sandi "password":
   `5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8`

2. **Truncation (Pemotongan Prefix)**:
   CredLock hanya mengambil **5 karakter pertama** dari hash tersebut (dikenal sebagai *hash prefix*):
   `5BAA6`

3. **Kueri Anonim ke API**:
   Hanya 5 karakter prefix (`5BAA6`) yang dikirimkan melalui jaringan internet ke database HIBP. Server HIBP tidak pernah menerima sisa 35 karakter hash, apalagi password asli Anda.

4. **Kumpulan Kandidat (Bucket of Hashes)**:
   Server HIBP merespons dengan mengembalikan daftar seluruh hash yang memiliki 5 karakter awal yang sama persis (biasanya sekitar 500 hingga 1.000 kecocokan) beserta frekuensi kebocorannya.

5. **Pencocokan Lokal**:
   Browser Anda membandingkan sisa 35 karakter hash Anda dengan daftar yang diterima. Jika ada kecocokan, jumlah kebocoran ditampilkan; jika tidak ada, password dinyatakan bersih.

Secara matematis, pihak luar atau penyedia API mustahil dapat merekonstruksi password Anda dari sekadar 5 karakter awal hash heksadesimal.',
    'Tim Riset Kriptografi CredLock',
    5,
    ARRAY['k-anonymity', 'hibp', 'cryptography', 'privacy'],
    true,
    TIMEZONE('utc'::TEXT, NOW()) - INTERVAL '4 days'
),
(
    'Bahaya Serangan Credential Stuffing dan Cara Mencegahnya',
    'bahaya-credential-stuffing-dan-pencegahannya',
    'analysis',
    'Analisis teknis mengenai bagaimana sindikat penjahat siber mengotomatisasi pengujian miliaran kombinasi email dan password hasil kebocoran data.',
    '# Bahaya Serangan Credential Stuffing dan Cara Mencegahnya

Setiap kali platform online besar mengalami insiden kebocoran data (seperti Tokopedia, Canva, atau LinkedIn), jutaan kombinasi email dan hash password beredar di pasar gelap internet. Namun, ancaman sesungguhnya sering kali bukan pada layanan yang bocor itu sendiri, melainkan pada layanan lain yang Anda gunakan.

Fenomena ini dieksploitasi melalui teknik serangan yang disebut **Credential Stuffing**.

## Apa Itu Credential Stuffing?

Credential Stuffing adalah jenis serangan siber di mana penyerang menggunakan botnet otomatis untuk mencoba ribuan hingga jutaan pasangan username/email dan password yang bocor dari suatu layanan ke ratusan layanan web lainnya (perbankan, e-commerce, cloud storage, streaming).

Penyerang mengeksploitasi satu kelemahan psikologis mendasar manusia: **daur ulang password (password reuse)**. Studi industri menunjukkan bahwa lebih dari 65% pengguna internet menggunakan kembali password yang sama di berbagai akun penting mereka.

## Mengapa Serangan Ini Sangat Efektif?

1. **Volume Sangat Masif**: Basis data kompilasi kredensial (seperti *Collection #1-5* atau *COMB*) menampung miliaran catatan kredensial siap pakai.
2. **Otomatisasi Bot Terdistribusi**: Penyerang merotasi ribuan alamat IP perumahan (residential proxies) dan memecahkan CAPTCHA secara otomatis untuk menghindari pemblokiran IP standar.
3. **Tingkat Keberhasilan Finansial**: Meskipun tingkat keberhasilan login hanya berkisar antara 0,1% hingga 1%, dari 10 juta percobaan, penyerang berhasil membobol 10.000 hingga 100.000 akun aktif.

## Garis Pertahanan Pengguna

- **Password Unik Mutlak**: Jangan pernah menggunakan password yang identik pada dua layanan yang berbeda.
- **Aktifkan MFA Berbasis TOTP**: Bahkan jika penyerang memiliki kombinasi email dan password Anda yang valid, ketiadaan kode 6 angka dari aplikasi autentikator Anda akan menghentikan serangan seketika.',
    'Analis Keamanan Siber CredLock',
    6,
    ARRAY['credential-stuffing', 'botnet', 'cybersecurity', 'analysis'],
    true,
    TIMEZONE('utc'::TEXT, NOW()) - INTERVAL '3 days'
),
(
    'Zero-Knowledge Architecture: Mengapa Privasi Klien adalah Kunci',
    'zero-knowledge-architecture-dalam-keamanan-klien',
    'explainer',
    'Mengenal filosofi arsitektur Zero-Knowledge dan bagaimana CredLock memproses data sensitif sepenuhnya di sisi peramban pengguna.',
    '# Zero-Knowledge Architecture: Mengapa Privasi Klien adalah Kunci

Di era modern di mana data pribadi sering dianggap sebagai "komoditas baru", banyak penyedia layanan teknologi menyimpan dan memproses informasi pengguna di server terpusat mereka. Namun, bagi aplikasi keamanan seperti CredLock, penyimpanan terpusat justru menjadi titik kegagalan tunggal (*Single Point of Failure*).

## Definisi Zero-Knowledge

Dalam konteks rekayasa perangkat lunak, **Zero-Knowledge Architecture** berarti bahwa arsitektur sistem dirancang sedemikian rupa sehingga server atau pengembang aplikasi tidak memiliki kunci, sarana, atau visibilitas apa pun untuk melihat data sensitif milik pengguna.

Jika basis data server disita, dibobol peretas, atau diteliti oleh administrator sistem internal, tidak ada data sensitif pengguna yang dapat dibaca.

## Bagaimana CredLock Menerapkannya

CredLock mengadopsi prinsip ini secara ketat pada setiap fitur:

1. **Password Analyzer**: Algoritma zxcvbn-ts dan penghitungan entropi dieksekusi 100% di dalam mesin JavaScript browser Anda. Tidak ada panggilan API jaringan saat Anda menganalisis kekuatan password.
2. **Password Generator**: Pengacakan karakter memanfaatkan `crypto.getRandomValues()` dari Web Crypto API pada perangkat lokal Anda.
3. **Local History Persistence**: Data riwayat tersimpan di dalam IndexedDB browser Anda. Password asli tidak pernah disimpan; yang disimpan hanyalah label waktu, metadata non-sensitif, dan skor kekuatan.',
    'Arsitek Sistem CredLock',
    5,
    ARRAY['zero-knowledge', 'privacy', 'architecture', 'client-side'],
    true,
    TIMEZONE('utc'::TEXT, NOW()) - INTERVAL '2 days'
),
(
    'Protokol Tanggap Darurat Saat Kredensial Akun Anda Bocor',
    'protokol-tanggap-darurat-saat-kredensial-bocor',
    'guide',
    'Panduan langkah demi langkah 15 menit pertama yang harus segera Anda lakukan saat menerima notifikasi insiden kebocoran data.',
    '# Protokol Tanggap Darurat Saat Kredensial Akun Anda Bocor

Menerima email pemberitahuan kebocoran data atau melihat akun Anda muncul di Breach Checker tentu menimbulkan kepanikan. Namun, respons yang tenang, cepat, dan sistematis dalam hitungan jam pertama dapat membatasi dampak kerugian secara signifikan.

Berikut adalah protokol tanggap darurat 5 langkah:

## Langkah 1: Isolasi dan Ubah Password Layanan Terdampak (Menit 0 - 5)

Masuk ke layanan bersangkutan dari browser yang bersih, lalu segera ubah password Anda menjadi string acak baru (minimal 16 karakter). Pastikan Anda tidak menggunakan password pengganti yang mirip dengan password lama.

## Langkah 2: Putuskan Semua Sesi Aktif (Menit 5 - 8)

Hampir semua platform modern menyediakan tombol **"Log Out of All Devices"** atau **"Sign Out Everywhere"** di pengaturan keamanan. Tindakan ini membatalkan seluruh token sesi (*session cookies*) yang mungkin telah digandakan oleh penyerang.

## Langkah 3: Amankan Akun Email Pemulihan (Menit 8 - 12)

Jika password yang bocor pernah Anda pakai pada akun email utama Anda, segera ubah password email Anda dan periksa aturan penyaringan (*forwarding rules*) untuk memastikan penyerang tidak memasang aturan penerusan email otomatis ke alamat mereka.

## Langkah 4: Tinjau dan Pasang Autentikasi Dua Faktor (Menit 12 - 15)

Aktifkan autentikasi dua faktor berbasis aplikasi (Google Authenticator atau Aegis). Hindari verifikasi SMS jika opsi aplikasi tersedia.

## Langkah 5: Pantau Transaksi Finansial

Jika data yang bocor mencakup nomor kartu kredit atau detail pembayaran, hubungi bank penerbit untuk membekukan kartu sementara atau meminta penerbitan kartu baru.',
    'Tim Keamanan CredLock',
    5,
    ARRAY['incident-response', 'emergency', 'guide', 'security-hygiene'],
    true,
    TIMEZONE('utc'::TEXT, NOW()) - INTERVAL '1 day'
),
(
    'Evolusi Algoritma Hashing: Dari MD5 ke PBKDF2 dan Argon2',
    'evolusi-algoritma-hashing-dari-md5-ke-argon2',
    'analysis',
    'Menelaah mengapa fungsi hash cepat seperti MD5 dan SHA-1 berbahaya untuk password, dan bagaimana algoritma lambat melindungi kredensial.',
    '# Evolusi Algoritma Hashing: Dari MD5 ke PBKDF2 dan Argon2

Fungsi hash kriptografis adalah pondasi utama dalam penyimpanan password yang aman. Namun, tidak semua fungsi hash diciptakan setara untuk tujuan keamanan kata sandi.

## Masalah dengan Fast Hashing (MD5 dan SHA-256)

Algoritma seperti MD5, SHA-1, dan SHA-256 pada mulanya dirancang untuk integritas file dan verifikasi tanda tangan digital di mana kecepatan pemrosesan data bervolume besar menjadi prioritas utama.

Namun, kecepatan ini menjadi bumerang ketika digunakan untuk password. Sebuah kartu grafis (GPU) modern kelas konsumen saat ini mampu menghitung lebih dari **100 miliar hash MD5 per detik**. Jika seorang peretas mencuri basis data yang di-hash dengan MD5, mereka dapat memecahkan seluruh password 8 karakter dalam hitungan detik.

## Solusi: Slow Hashing & Key Derivation Functions (KDF)

Untuk melindungi password, kita memerlukan fungsi hash yang sengaja dibuat **lambat** dan membutuhkan sumber daya komputasi tinggi (*work factor*).

### 1. PBKDF2 (Password-Based Key Derivation Function 2)
Menerapkan fungsi pseudorandom berulang-ulang hingga puluhan atau ratusan ribu iterasi. Hal ini memperlambat serangan brute-force ribuan kali lipat.

### 2. Bcrypt
Memanfaatkan algoritma berbasis cipher Blowfish dengan parameter *cost factor*. Bcrypt memiliki resistensi yang sangat baik terhadap akselerasi GPU karena kebutuhan memorinya.

### 3. Argon2 (Pemenang Password Hashing Competition 2015)
Standar emas modern saat ini. Argon2 (khususnya varian Argon2id) dirancang untuk resisten terhadap serangan berbasis GPU dan perangkat keras khusus ASIC dengan memaksa penggunaan kapasitas memori RAM yang signifikan (*memory-hard function*).

## Kesimpulan

Bagi pengembang aplikasi modern, tidak ada alasan lagi untuk menggunakan MD5 atau SHA-1 untuk password. Gunakan minimal **PBKDF2** (dengan iterasi $\ge 600.000$) atau **Argon2id** untuk menjamin keamanan jangka panjang data pengguna.',
    'Arsitek Kriptografi CredLock',
    7,
    ARRAY['cryptography', 'hashing', 'argon2', 'pbkdf2', 'analysis'],
    true,
    TIMEZONE('utc'::TEXT, NOW())
)
ON CONFLICT (slug) DO NOTHING;
