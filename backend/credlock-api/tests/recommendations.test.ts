import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { setSupabaseClient } from '../src/config/supabase.js';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('Security Recommendations Endpoints (Phase 3.3C)', () => {
  afterEach(() => {
    setSupabaseClient(null);
  });

  const dataset = [
    {
      id: '10000000-0000-0000-0000-000000000001',
      title: 'Aktifkan Autentikasi Dua Faktor (2FA / MFA)',
      slug: 'aktifkan-autentikasi-dua-faktor',
      category: 'auth',
      priority: 'critical',
      summary: 'Autentikasi dua faktor menambahkan lapisan pertahanan esensial selain password.',
      action_steps: [
        'Unduh aplikasi autentikator mandiri.',
        'Pindai kode QR 2FA.',
        'Simpan kode pemulihan cadangan.',
      ],
      target_audience: 'Semua pengguna internet',
      tags: ['2fa', 'mfa', 'authenticator'],
      is_published: true,
      created_at: '2026-01-01T10:00:00Z',
      updated_at: '2026-01-01T10:00:00Z',
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      title: 'Gunakan Password Manager Terpercaya',
      slug: 'gunakan-password-manager-terpercaya',
      category: 'password',
      priority: 'critical',
      summary: 'Password manager mengamankan seluruh kredensial dalam brankas terenkripsi.',
      action_steps: [
        'Pilih password manager zero-knowledge.',
        'Buat Master Password panjang.',
        'Pindahkan password dari browser.',
      ],
      target_audience: 'Pengguna dengan banyak akun online',
      tags: ['passwords', 'vault', 'zero-knowledge'],
      is_published: true,
      created_at: '2026-01-02T10:00:00Z',
      updated_at: '2026-01-02T10:00:00Z',
    },
    {
      id: '10000000-0000-0000-0000-000000000003',
      title: 'Hentikan Penggunaan Ulang Password (Password Reuse)',
      slug: 'hentikan-penggunaan-ulang-password',
      category: 'password',
      priority: 'high',
      summary: 'Password sama di beberapa situs web membuka celah fatal bagi serangan Credential Stuffing.',
      action_steps: ['Identifikasi password duplikat.', 'Ganti password akun penting.'],
      target_audience: 'Semua pengguna internet',
      tags: ['passwords', 'credential-stuffing'],
      is_published: true,
      created_at: '2026-01-03T10:00:00Z',
      updated_at: '2026-01-03T10:00:00Z',
    },
    {
      id: '10000000-0000-0000-0000-000000000004',
      title: 'Amankan Email Utama Sebagai Pusat Pemulihan Akun',
      slug: 'amankan-email-utama',
      category: 'auth',
      priority: 'critical',
      summary: 'Akun email adalah gerbang utama menuju seluruh identitas digital Anda.',
      action_steps: ['Terapkan password terkuat.', 'Wajib aktifkan 2FA.'],
      target_audience: 'Semua pengguna',
      tags: ['email-security', 'auth'],
      is_published: true,
      created_at: '2026-01-04T10:00:00Z',
      updated_at: '2026-01-04T10:00:00Z',
    },
    {
      id: '10000000-0000-0000-0000-000000000005',
      title: 'Waspada Terhadap Phishing dan Rekayasa Sosial',
      slug: 'waspada-phishing-dan-rekayasa-sosial',
      category: 'incident_response',
      priority: 'high',
      summary: 'Mayoritas insiden peretasan diawali dari manipulasi psikologis melalui tautan palsu.',
      action_steps: ['Periksa domain pengirim.', 'Waspada urgensi palsu.'],
      target_audience: 'Semua pengguna internet',
      tags: ['phishing', 'awareness'],
      is_published: true,
      created_at: '2026-01-05T10:00:00Z',
      updated_at: '2026-01-05T10:00:00Z',
    },
    {
      id: '10000000-0000-0000-0000-000000000006',
      title: 'Perbarui Perangkat Lunak dan Sistem Operasi Secara Rutin',
      slug: 'perbarui-perangkat-dan-aplikasi',
      category: 'device',
      priority: 'medium',
      summary: 'Pembaruan perangkat lunak menambal kerentanan keamanan kritis.',
      action_steps: ['Aktifkan pembaruan otomatis.', 'Segera perbarui browser.'],
      target_audience: 'Pengguna desktop dan smartphone',
      tags: ['patching', 'updates'],
      is_published: true,
      created_at: '2026-01-06T10:00:00Z',
      updated_at: '2026-01-06T10:00:00Z',
    },
    {
      id: '10000000-0000-0000-0000-000000000007',
      title: 'Enkripsi Koneksi di Jaringan Wi-Fi Publik',
      slug: 'enkripsi-koneksi-di-wifi-publik',
      category: 'network',
      priority: 'medium',
      summary: 'Jaringan Wi-Fi terbuka rentan terhadap serangan Man-in-the-Middle.',
      action_steps: ['Gunakan VPN terpercaya.', 'Gunakan DoH.'],
      target_audience: 'Pengguna mobile',
      tags: ['wifi', 'vpn'],
      is_published: true,
      created_at: '2026-01-07T10:00:00Z',
      updated_at: '2026-01-07T10:00:00Z',
    },
    {
      id: '10000000-0000-0000-0000-000000000008',
      title: 'Lakukan Audit Akses dan Prosedur Tanggap Darurat Kredensial',
      slug: 'audit-akses-dan-tanggap-darurat',
      category: 'incident_response',
      priority: 'high',
      summary: 'Ketika kredensial Anda terdeteksi dalam insiden kebocoran data, respons cepat membatasi kerugian.',
      action_steps: ['Periksa breach checker.', 'Ganti password terdampak.'],
      target_audience: 'Pengguna dengan indikasi kebocoran',
      tags: ['incident-response', 'emergency'],
      is_published: true,
      created_at: '2026-01-08T10:00:00Z',
      updated_at: '2026-01-08T10:00:00Z',
    },
    // Hidden unpublished records for security tests
    {
      id: '10000000-0000-0000-0000-000000000099',
      title: 'Draft Rekomendasi Internal Rahasia',
      slug: 'draft-internal-rahasia',
      category: 'password',
      priority: 'low',
      summary: 'Draft ringkasan rahasia yang belum dirilis.',
      action_steps: ['Internal step 1'],
      target_audience: 'Admin internal',
      tags: ['internal'],
      is_published: false, // UNPUBLISHED
      created_at: '2026-01-09T10:00:00Z',
      updated_at: '2026-01-09T10:00:00Z',
    },
  ];

  function createMockSupabase(allRecords: any[] = dataset, shouldThrow = false) {
    const executedQueries: any[] = [];

    const mock = {
      from: (table: string) => {
        if (shouldThrow) {
          return {
            select: () => {
              throw new Error('Simulated database query failure');
            },
          };
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

    return { client: mock as unknown as SupabaseClient, executedQueries };
  }

  // ==========================================================================
  // 1. List Endpoint Tests
  // ==========================================================================
  describe('GET /api/v1/recommendations (List & Pagination)', () => {
    it('1. returns HTTP 200 with default pagination and standard envelope', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/recommendations');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');

      // Default pagination is page 1, limit 10
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 10,
        totalItems: 8, // 8 published items
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      expect(res.body.data).toHaveLength(8);
    });

    it('2. supports custom page and limit parameters', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/recommendations?page=1&limit=3');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.pagination.limit).toBe(3);
    });

    it('3. calculates pagination metadata correctly', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/recommendations?page=1&limit=3');

      expect(res.body.pagination.totalItems).toBe(8);
      expect(res.body.pagination.totalPages).toBe(3);
    });

    it('4. calculates hasNextPage correctly', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/recommendations?page=1&limit=5');
      expect(res.body.pagination.hasNextPage).toBe(true);

      const res2 = await request(app).get('/api/v1/recommendations?page=2&limit=5');
      expect(res2.body.pagination.hasNextPage).toBe(false);
    });

    it('5. calculates hasPreviousPage correctly', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res1 = await request(app).get('/api/v1/recommendations?page=1&limit=5');
      expect(res1.body.pagination.hasPreviousPage).toBe(false);

      const res2 = await request(app).get('/api/v1/recommendations?page=2&limit=5');
      expect(res2.body.pagination.hasPreviousPage).toBe(true);
    });

    it('6. searches across title, summary, and category case-insensitively', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/recommendations?search=autentikasi');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].slug).toBe('aktifkan-autentikasi-dua-faktor');
    });

    it('7. filters records by category', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/recommendations?category=password');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2); // Password manager, Password reuse
      for (const item of res.body.data) {
        expect(item.category).toBe('password');
      }
    });

    it('8. filters records by priority', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/recommendations?priority=critical');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3); // 2FA, Password manager, Email utama
      for (const item of res.body.data) {
        expect(item.priority).toBe('critical');
      }
    });

    it('9. sorts by allowed fields', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/recommendations?sort=title&order=asc');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(8);
      // Alphabetical order: 'Aktifkan...' should come first
      expect(res.body.data[0].title).toContain('Aktifkan');
    });

    it('10. supports both ascending and descending order', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const resDesc = await request(app).get('/api/v1/recommendations?sort=created_at&order=desc');
      const resAsc = await request(app).get('/api/v1/recommendations?sort=created_at&order=asc');

      expect(resDesc.body.data[0].slug).not.toEqual(resAsc.body.data[0].slug);
    });

    it('11. handles an empty database gracefully', async () => {
      const { client } = createMockSupabase([]);
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/recommendations');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('12. returns empty data array when page is beyond total pages', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/recommendations?page=10&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.page).toBe(10);
      expect(res.body.pagination.totalItems).toBe(8);
      expect(res.body.pagination.hasNextPage).toBe(false);
      expect(res.body.pagination.hasPreviousPage).toBe(true);
    });

    it('13. returns HTTP 400 for invalid page (< 1)', async () => {
      const res = await request(app).get('/api/v1/recommendations?page=0');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('14. returns HTTP 400 for invalid limit (> 50 or < 1)', async () => {
      const res = await request(app).get('/api/v1/recommendations?limit=99');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('15. returns HTTP 400 for invalid sorting field', async () => {
      const res = await request(app).get('/api/v1/recommendations?sort=drop_table');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('16. returns HTTP 400 for invalid order', async () => {
      const res = await request(app).get('/api/v1/recommendations?order=random');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('17. combines search, category, priority, and pagination', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get(
        '/api/v1/recommendations?search=password&category=password&priority=critical&page=1&limit=5'
      );

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].slug).toBe('gunakan-password-manager-terpercaya');
    });
  });

  // ==========================================================================
  // 2. Security Tests
  // ==========================================================================
  describe('Security & Public Visibility Enforcement', () => {
    it('18. explicitly enforces is_published = true on every query', async () => {
      const { client, executedQueries } = createMockSupabase();
      setSupabaseClient(client);

      await request(app).get('/api/v1/recommendations');

      expect(executedQueries.length).toBeGreaterThanOrEqual(1);
      for (const q of executedQueries) {
        expect(q.filters.is_published).toBe(true);
      }
    });

    it('19. unpublished records never appear in list responses', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/recommendations?limit=50');
      const slugs = res.body.data.map((r: any) => r.slug);

      expect(slugs).not.toContain('draft-internal-rahasia');
    });

    it('20. unpublished records never contribute to totalItems or pagination counts', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/recommendations');

      // 8 published, 1 unpublished -> totalItems must be 8
      expect(res.body.pagination.totalItems).toBe(8);
    });

    it('21. unpublished records cannot be retrieved through the detail endpoint', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/recommendations/draft-internal-rahasia');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('22. nonexistent and unpublished slugs return consistent safe 404 responses', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const resNonexistent = await request(app).get('/api/v1/recommendations/does-not-exist');
      const resUnpublished = await request(app).get(
        '/api/v1/recommendations/draft-internal-rahasia'
      );

      expect(resNonexistent.status).toBe(404);
      expect(resUnpublished.status).toBe(404);
      expect(resNonexistent.body.error.code).toBe(resUnpublished.body.error.code);
    });

    it('23. database query errors return safe 500 without leaking credentials or stack traces', async () => {
      const { client } = createMockSupabase(dataset, true); // shouldThrow = true
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/recommendations');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('success', false);
      expect(['DATABASE_QUERY_ERROR', 'INTERNAL_SERVER_ERROR']).toContain(
        res.body.error.code
      );

      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain('stack');
      expect(bodyStr).not.toContain('supabase');
      expect(bodyStr).not.toContain('SELECT');
      expect(bodyStr).not.toContain('password_key');
    });
  });

  // ==========================================================================
  // 3. Detail Endpoint Tests
  // ==========================================================================
  describe('GET /api/v1/recommendations/:slug (Detail Endpoint)', () => {
    it('24. returns HTTP 200 for a valid published slug', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get(
        '/api/v1/recommendations/aktifkan-autentikasi-dua-faktor'
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.slug).toBe('aktifkan-autentikasi-dua-faktor');
      expect(res.body.data.title).toContain('Autentikasi Dua Faktor');
    });

    it('25. returns expected public fields without internal audit leaks', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get(
        '/api/v1/recommendations/aktifkan-autentikasi-dua-faktor'
      );
      const data = res.body.data;

      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('title');
      expect(data).toHaveProperty('slug');
      expect(data).toHaveProperty('category', 'auth');
      expect(data).toHaveProperty('priority', 'critical');
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('action_steps');
      expect(data).toHaveProperty('target_audience');
      expect(data).toHaveProperty('tags');

      // Internal audit columns are omitted
      expect(data).not.toHaveProperty('created_at');
      expect(data).not.toHaveProperty('updated_at');
      expect(data).not.toHaveProperty('is_published');
    });

    it('26. preserves JSON action_steps structure as an array/object', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get(
        '/api/v1/recommendations/aktifkan-autentikasi-dua-faktor'
      );

      expect(Array.isArray(res.body.data.action_steps)).toBe(true);
      expect(res.body.data.action_steps).toHaveLength(3);
      expect(typeof res.body.data.action_steps[0]).toBe('string');
    });

    it('27. returns HTTP 404 for nonexistent slug', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/recommendations/fictional-slug-999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
