import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { setSupabaseClient } from '../src/config/supabase.js';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('Security Articles Endpoints (Phase 3.3D)', () => {
  afterEach(() => {
    setSupabaseClient(null);
  });

  const dataset = [
    {
      id: '20000000-0000-0000-0000-000000000001',
      title: 'Anatomi Password yang Kuat: Lebih dari Sekadar Karakter Acak',
      slug: 'anatomi-password-yang-kuat',
      category: 'guide',
      summary: 'Pelajari bagaimana entropi dan panjang karakter membentuk pertahanan matematis.',
      content:
        '# Anatomi Password yang Kuat\n\nBanyak pengguna mengira bahwa mengganti huruf "a" dengan "@" sudah cukup.\n\n## Rumus Entropi\n\n$$R = N^L$$\n\n```python\nimport math\ndef calc_entropy(length, charset_size):\n    return length * math.log2(charset_size)\n```\n\n- Poin 1\n- Poin 2',
      author_name: 'Tim Keamanan CredLock',
      read_time_minutes: 4,
      tags: ['passwords', 'entropy', 'security-hygiene', 'guide'],
      is_published: true,
      published_at: '2026-01-10T10:00:00Z',
      created_at: '2026-01-10T10:00:00Z',
      updated_at: '2026-01-10T10:00:00Z',
    },
    {
      id: '20000000-0000-0000-0000-000000000002',
      title: 'Memahami Konsep K-Anonymity pada Pengecekan Kebocoran Password',
      slug: 'memahami-k-anonymity-pwned-passwords',
      category: 'explainer',
      summary: 'Bagaimana CredLock memverifikasi password bocor tanpa pernah mengirimkan password asli.',
      content:
        '# Memahami Konsep K-Anonymity\n\nZero-knowledge architecture memastikan server hanya menerima 5 karakter pertama hash SHA-1.',
      author_name: 'Tim Riset CredLock',
      read_time_minutes: 6,
      tags: ['k-anonymity', 'hibp', 'privacy', 'cryptography'],
      is_published: true,
      published_at: '2026-01-12T10:00:00Z',
      created_at: '2026-01-12T10:00:00Z',
      updated_at: '2026-01-12T10:00:00Z',
    },
    {
      id: '20000000-0000-0000-0000-000000000003',
      title: 'Zero-Knowledge Architecture: Mengapa Privasi Klien adalah Kunci',
      slug: 'zero-knowledge-architecture-dalam-keamanan-klien',
      category: 'explainer',
      summary: 'Mengenal filosofi arsitektur Zero-Knowledge dalam perlindungan data privasi klien.',
      content:
        '# Zero-Knowledge Architecture\n\nDalam konteks rekayasa perangkat lunak, client-side processing melindungi pengguna.',
      author_name: 'Arsitek Sistem CredLock',
      read_time_minutes: 5,
      tags: ['zero-knowledge', 'privacy', 'architecture', 'client-side'],
      is_published: true,
      published_at: '2026-01-14T10:00:00Z',
      created_at: '2026-01-14T10:00:00Z',
      updated_at: '2026-01-14T10:00:00Z',
    },
    {
      id: '20000000-0000-0000-0000-000000000004',
      title: 'Protokol Tanggap Darurat Saat Kredensial Akun Anda Bocor',
      slug: 'protokol-tanggap-darurat-saat-kredensial-bocor',
      category: 'guide',
      summary: 'Panduan langkah demi langkah 15 menit pertama saat menerima notifikasi kebocoran data.',
      content:
        '# Protokol Tanggap Darurat\n\n1. Isolasi dan Ubah Password Layanan Terdampak\n2. Putuskan Semua Sesi Aktif',
      author_name: 'Tim Keamanan CredLock',
      read_time_minutes: 5,
      tags: ['incident-response', 'emergency', 'guide'],
      is_published: true,
      published_at: '2026-01-16T10:00:00Z',
      created_at: '2026-01-16T10:00:00Z',
      updated_at: '2026-01-16T10:00:00Z',
    },
    {
      id: '20000000-0000-0000-0000-000000000005',
      title: 'Evolusi Algoritma Hashing: Dari MD5 ke PBKDF2 dan Argon2',
      slug: 'evolusi-algoritma-hashing-dari-md5-ke-argon2',
      category: 'analysis',
      summary: 'Menelaah mengapa fungsi hash cepat berbahaya untuk password, dan keunggulan Argon2.',
      content:
        '# Evolusi Algoritma Hashing\n\nKecepatan GPU modern mampu menghitung miliaran hash per detik.',
      author_name: 'Arsitek Kriptografi CredLock',
      read_time_minutes: 7,
      tags: ['cryptography', 'hashing', 'argon2', 'pbkdf2'],
      is_published: true,
      published_at: '2026-01-18T10:00:00Z',
      created_at: '2026-01-18T10:00:00Z',
      updated_at: '2026-01-18T10:00:00Z',
    },
    {
      id: '20000000-0000-0000-0000-000000000006',
      title: 'Tren Keamanan Siber 2026: Ancaman AI dan Rekayasa Sosial',
      slug: 'tren-keamanan-siber-2026',
      category: 'news',
      summary: 'Laporan perkembangan ancaman serangan siber berbasis kecerdasan buatan dan pertahanan adaptif.',
      content:
        '# Tren Keamanan Siber 2026\n\nSerangan phishing kini semakin sulit dibedakan dari komunikasi resmi.',
      author_name: 'Redaksi Berita CredLock',
      read_time_minutes: 3,
      tags: ['news', 'trends', 'ai', 'cyber-threats'],
      is_published: true,
      published_at: '2026-01-20T10:00:00Z',
      created_at: '2026-01-20T10:00:00Z',
      updated_at: '2026-01-20T10:00:00Z',
    },
    // Unpublished draft record for security visibility tests
    {
      id: '20000000-0000-0000-0000-000000000099',
      title: 'Artikel Rahasia Internal Belum Rilis',
      slug: 'artikel-rahasia-internal',
      category: 'guide',
      summary: 'Dokumen draft internal yang belum boleh dipublikasikan ke publik.',
      content: '# Rahasia Internal\n\nJangan dibaca publik.',
      author_name: 'Editor Internal',
      read_time_minutes: 2,
      tags: ['internal', 'draft'],
      is_published: false, // UNPUBLISHED
      published_at: null,
      created_at: '2026-01-21T10:00:00Z',
      updated_at: '2026-01-21T10:00:00Z',
    },
  ];

  function createMockSupabase(allRecords: any[] = dataset, shouldThrow = false) {
    const executedQueries: any[] = [];

    const mock = {
      from: (table: string) => {
        if (shouldThrow) {
          const errBuilder: any = {
            select: () => errBuilder,
            eq: () => errBuilder,
            or: () => errBuilder,
            order: () => errBuilder,
            range: () =>
              Promise.resolve({
                data: null,
                count: null,
                error: { message: 'Internal postgres query connection timeout' },
              }),
            maybeSingle: () =>
              Promise.resolve({
                data: null,
                error: { message: 'Internal postgres query connection timeout' },
              }),
          };
          return errBuilder;
        }

        let rows = [...allRecords];
        const filters: Record<string, any> = {};
        const orderDirectives: Array<{ col: string; asc: boolean }> = [];

        const builder: any = {
          select: (_fields: string, _opts?: any) => builder,
          eq: (col: string, val: any) => {
            filters[col] = val;
            rows = rows.filter((r) => r[col] === val);
            return builder;
          },
          or: (expr: string) => {
            filters['or'] = expr;
            const match = expr.match(/%([^%]+)%/);
            if (match && match[1]) {
              const term = match[1].toLowerCase();
              rows = rows.filter(
                (r) =>
                  (r.title && r.title.toLowerCase().includes(term)) ||
                  (r.summary && r.summary.toLowerCase().includes(term)) ||
                  (r.category && r.category.toLowerCase().includes(term))
              );
            }
            return builder;
          },
          order: (col: string, opts?: any) => {
            const asc = opts?.ascending ?? true;
            filters[`order_${col}`] = asc ? 'asc' : 'desc';
            orderDirectives.push({ col, asc });
            return builder;
          },
          range: (from: number, to: number) => {
            filters['range'] = { from, to };
            executedQueries.push({ table, filters });

            if (orderDirectives.length > 0) {
              rows.sort((a, b) => {
                for (const { col, asc } of orderDirectives) {
                  const valA = a[col] ?? '';
                  const valB = b[col] ?? '';
                  if (valA < valB) return asc ? -1 : 1;
                  if (valA > valB) return asc ? 1 : -1;
                }
                return 0;
              });
            }

            const totalCount = rows.length;
            const paged = rows.slice(from, to + 1);
            return Promise.resolve({ data: paged, count: totalCount, error: null });
          },
          maybeSingle: () => {
            executedQueries.push({ table, filters, isSingle: true });
            const item = rows.length > 0 ? rows[0] : null;
            return Promise.resolve({ data: item, error: null });
          },
        };

        return builder;
      },
    };

    return { mock: mock as unknown as SupabaseClient, executedQueries };
  }

  // ==========================================================================
  // List Tests (1 - 19)
  // ==========================================================================

  describe('GET /api/v1/articles (List & Pagination)', () => {
    it('1. returns HTTP 200 with default pagination and standard envelope', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get('/api/v1/articles');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(6);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
      expect(res.body.pagination.totalItems).toBe(6);
      expect(res.body.pagination.totalPages).toBe(1);
      expect(res.body.timestamp).toBeDefined();
    });

    it('2. supports custom page and limit pagination', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get('/api/v1/articles?page=2&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.totalItems).toBe(6);
      expect(res.body.pagination.totalPages).toBe(3);
    });

    it('3. calculates correct pagination metadata', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get('/api/v1/articles?page=1&limit=4');

      expect(res.status).toBe(200);
      expect(res.body.pagination.totalItems).toBe(6);
      expect(res.body.pagination.totalPages).toBe(2);
    });

    it('4. calculates hasNextPage correctly', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get('/api/v1/articles?page=1&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.pagination.hasNextPage).toBe(true);
    });

    it('5. calculates hasPreviousPage correctly', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get('/api/v1/articles?page=2&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.pagination.hasPreviousPage).toBe(true);
    });

    it('6. filters records by search query in title', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get('/api/v1/articles?search=Anatomi');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].slug).toBe('anatomi-password-yang-kuat');
    });

    it('7. filters records by search query in summary', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get('/api/v1/articles?search=entropi');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].slug).toBe('anatomi-password-yang-kuat');
    });

    it('8. filters records by search query in category', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get('/api/v1/articles?search=guide');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data.every((item: any) => item.category === 'guide')).toBe(true);
    });

    it('9. filters records by category parameter', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get('/api/v1/articles?category=explainer');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data.every((item: any) => item.category === 'explainer')).toBe(true);
    });

    it('10. supports sorting by allowlisted fields', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get('/api/v1/articles?sort=read_time_minutes&order=asc');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(6);
      expect(res.body.data[0].read_time_minutes).toBe(3); // tren-keamanan-siber-2026 has read_time 3
    });

    it('11. supports ascending order', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get('/api/v1/articles?sort=title&order=asc');

      expect(res.status).toBe(200);
      expect(res.body.data[0].title.startsWith('Anatomi')).toBe(true);
    });

    it('12. supports descending order', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get('/api/v1/articles?sort=published_at&order=desc');

      expect(res.status).toBe(200);
      expect(res.body.data[0].slug).toBe('tren-keamanan-siber-2026'); // published Jan 20
    });

    it('13. returns empty array for empty search results', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get('/api/v1/articles?search=nonexistentterm123');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.totalItems).toBe(0);
      expect(res.body.pagination.totalPages).toBe(0);
    });

    it('14. handles out-of-range page gracefully', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get('/api/v1/articles?page=999&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.page).toBe(999);
      expect(res.body.pagination.hasNextPage).toBe(false);
      expect(res.body.pagination.hasPreviousPage).toBe(true);
    });

    it('15. returns HTTP 400 for invalid page (less than 1)', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get('/api/v1/articles?page=0');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('16. returns HTTP 400 for invalid limit (exceeding 50)', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get('/api/v1/articles?limit=51');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('17. returns HTTP 400 for invalid sort field', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get('/api/v1/articles?sort=invalid_column');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('18. returns HTTP 400 for invalid order', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get('/api/v1/articles?order=sideways');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('19. combines search, category, and pagination seamlessly', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get(
        '/api/v1/articles?category=guide&search=Anatomi&page=1&limit=5'
      );

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].slug).toBe('anatomi-password-yang-kuat');
      expect(res.body.pagination.totalItems).toBe(1);
    });
  });

  // ==========================================================================
  // Security & Visibility Enforcement Tests (20 - 25)
  // ==========================================================================

  describe('Security & Public Visibility Enforcement', () => {
    it('20. explicitly enforces is_published = true on every query', async () => {
      const { mock, executedQueries } = createMockSupabase();
      setSupabaseClient(mock);

      await request(app).get('/api/v1/articles?limit=5');

      expect(executedQueries.length).toBeGreaterThan(0);
      expect(executedQueries[0].filters['is_published']).toBe(true);
    });

    it('21. unpublished articles never appear in list responses', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get('/api/v1/articles?limit=50');

      expect(res.status).toBe(200);
      const unpublished = res.body.data.find(
        (a: any) => a.slug === 'artikel-rahasia-internal'
      );
      expect(unpublished).toBeUndefined();
    });

    it('22. unpublished articles never contribute to totalItems or pagination counts', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get('/api/v1/articles');

      // Dataset has 7 items (6 published, 1 unpublished)
      expect(res.body.pagination.totalItems).toBe(6);
      expect(res.body.data.length).toBe(6);
    });

    it('23. unpublished articles cannot be retrieved through the detail endpoint', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get('/api/v1/articles/artikel-rahasia-internal');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('24. nonexistent and unpublished slugs return consistent safe 404 responses', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const resUnpublished = await request(app).get(
        '/api/v1/articles/artikel-rahasia-internal'
      );
      const resNonexistent = await request(app).get(
        '/api/v1/articles/completely-nonexistent-slug-404'
      );

      expect(resUnpublished.status).toBe(404);
      expect(resNonexistent.status).toBe(404);
      expect(resUnpublished.body.error.code).toBe('NOT_FOUND');
      expect(resNonexistent.body.error.code).toBe('NOT_FOUND');
      expect(resUnpublished.body.error.message).toContain('not found');
      expect(resNonexistent.body.error.message).toContain('not found');
    });

    it('25. database query errors return safe 500 without leaking credentials or stack traces', async () => {
      const { mock } = createMockSupabase(dataset, true); // returns simulated DB error
      setSupabaseClient(mock);

      const res = await request(app).get('/api/v1/articles');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(['DATABASE_QUERY_ERROR', 'INTERNAL_SERVER_ERROR']).toContain(
        res.body.error.code
      );
      expect(res.body.error.stack).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain('sb_secret');
      expect(JSON.stringify(res.body)).not.toContain('Internal postgres query connection timeout');
    });
  });

  // ==========================================================================
  // Detail Tests (26 - 30)
  // ==========================================================================

  describe('GET /api/v1/articles/:slug (Detail Endpoint)', () => {
    it('26. returns HTTP 200 for a valid published slug', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get(
        '/api/v1/articles/anatomi-password-yang-kuat'
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('anatomi-password-yang-kuat');
      expect(res.body.data.title).toBe(
        'Anatomi Password yang Kuat: Lebih dari Sekadar Karakter Acak'
      );
    });

    it('27. returns expected public fields without internal audit or visibility leaks', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get(
        '/api/v1/articles/anatomi-password-yang-kuat'
      );

      expect(res.status).toBe(200);
      const article = res.body.data;
      expect(article.id).toBeDefined();
      expect(article.title).toBeDefined();
      expect(article.slug).toBeDefined();
      expect(article.category).toBe('guide');
      expect(article.summary).toBeDefined();
      expect(article.content).toBeDefined();
      expect(article.author_name).toBeDefined();
      expect(article.read_time_minutes).toBe(4);
      expect(Array.isArray(article.tags)).toBe(true);
      expect(article.published_at).toBeDefined();

      // Ensure internal visibility flag is NOT leaked
      expect(article.is_published).toBeUndefined();
    });

    it('28. preserves Markdown content exactly without alteration or HTML conversion', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get(
        '/api/v1/articles/anatomi-password-yang-kuat'
      );

      expect(res.status).toBe(200);
      const content: string = res.body.data.content;
      expect(content).toContain('# Anatomi Password yang Kuat');
      expect(content).toContain('$$R = N^L$$');
      expect(content).toContain('```python');
      expect(content).toContain('def calc_entropy');
      expect(content).toContain('- Poin 1');
      // Must not be converted to HTML
      expect(content).not.toContain('<h1>');
      expect(content).not.toContain('<pre>');
    });

    it('29. preserves tags as an array of strings and numeric read_time_minutes', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get(
        '/api/v1/articles/anatomi-password-yang-kuat'
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.tags)).toBe(true);
      expect(res.body.data.tags).toContain('passwords');
      expect(res.body.data.tags).toContain('entropy');
      expect(typeof res.body.data.read_time_minutes).toBe('number');
    });

    it('30. returns HTTP 404 for nonexistent slug', async () => {
      const { mock } = createMockSupabase();
      setSupabaseClient(mock);

      const res = await request(app).get('/api/v1/articles/slug-tidak-terdaftar-404');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
      expect(res.body.error.message).toContain('not found');
    });
  });
});
