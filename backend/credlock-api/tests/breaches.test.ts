import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { setSupabaseClient } from '../src/config/supabase.js';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('Breach Intelligence Endpoints (Phase 3.3B)', () => {
  afterEach(() => {
    setSupabaseClient(null);
  });

  const dataset = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Tokopedia Data Breach (2020)',
      slug: 'tokopedia-2020',
      domain: 'tokopedia.com',
      organization: 'PT Tokopedia',
      breach_date: '2020-03-01',
      added_date: '2020-05-02',
      pwn_count: 91000000,
      description: 'Tokopedia database breach description.',
      data_classes: ['Email addresses', 'Names', 'Password hashes'],
      severity: 'critical',
      is_verified: true,
      is_published: true,
      source_url: 'https://zdnet.com/tokopedia',
      logo_url: 'https://logo.com/tokopedia.png',
      created_at: '2020-05-02T10:00:00Z',
      updated_at: '2020-05-02T10:00:00Z',
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      title: 'Bukalapak Data Breach (2019)',
      slug: 'bukalapak-2019',
      domain: 'bukalapak.com',
      organization: 'PT Bukalapak.com',
      breach_date: '2019-03-01',
      added_date: '2019-03-17',
      pwn_count: 13000000,
      description: 'Bukalapak historical backup intrusion.',
      data_classes: ['Email addresses', 'Usernames'],
      severity: 'high',
      is_verified: true,
      is_published: true,
      source_url: 'https://thehackernews.com/bukalapak',
      logo_url: null,
      created_at: '2019-03-17T10:00:00Z',
      updated_at: '2019-03-17T10:00:00Z',
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      title: 'Canva Security Breach (2019)',
      slug: 'canva-2019',
      domain: 'canva.com',
      organization: 'Canva Pty Ltd',
      breach_date: '2019-05-24',
      added_date: '2019-05-24',
      pwn_count: 137000000,
      description: 'Canva graphic design database breach.',
      data_classes: ['Email addresses', 'Names', 'Password hashes'],
      severity: 'critical',
      is_verified: true,
      is_published: true,
      source_url: 'https://zdnet.com/canva',
      logo_url: 'https://logo.com/canva.png',
      created_at: '2019-05-24T10:00:00Z',
      updated_at: '2019-05-24T10:00:00Z',
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      title: 'Dropbox Credential Spill (2012)',
      slug: 'dropbox-2012',
      domain: 'dropbox.com',
      organization: 'Dropbox, Inc.',
      breach_date: '2012-07-01',
      added_date: '2016-08-31',
      pwn_count: 68680741,
      description: 'Dropbox employee credential reuse.',
      data_classes: ['Email addresses', 'Password hashes'],
      severity: 'high',
      is_verified: true,
      is_published: true,
      source_url: 'https://krebsonsecurity.com/dropbox',
      logo_url: null,
      created_at: '2016-08-31T10:00:00Z',
      updated_at: '2016-08-31T10:00:00Z',
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      title: 'Adobe Systems Breach (2013)',
      slug: 'adobe-2013',
      domain: 'adobe.com',
      organization: 'Adobe Systems Inc.',
      breach_date: '2013-10-04',
      added_date: '2013-10-04',
      pwn_count: 152989505,
      description: 'Adobe 3DES ECB cipher weakness.',
      data_classes: ['Email addresses', 'Password hints'],
      severity: 'critical',
      is_verified: true,
      is_published: true,
      source_url: 'https://krebsonsecurity.com/adobe',
      logo_url: null,
      created_at: '2013-10-04T10:00:00Z',
      updated_at: '2013-10-04T10:00:00Z',
    },
    // Hidden records for security testing
    {
      id: '99999999-9999-9999-9999-999999999991',
      title: 'Unpublished Breach Draft',
      slug: 'unpublished-draft',
      domain: 'secret.com',
      organization: 'Secret Org',
      breach_date: '2024-01-01',
      added_date: '2024-01-01',
      pwn_count: 500000,
      description: 'Unpublished draft description',
      data_classes: ['Emails'],
      severity: 'low',
      is_verified: true,
      is_published: false, // UNPUBLISHED
      source_url: null,
      logo_url: null,
    },
    {
      id: '99999999-9999-9999-9999-999999999992',
      title: 'Unverified Rumor Breach',
      slug: 'unverified-rumor',
      domain: 'rumor.com',
      organization: 'Rumor Corp',
      breach_date: '2024-02-02',
      added_date: '2024-02-02',
      pwn_count: 1000000,
      description: 'Unverified claim description',
      data_classes: ['Passwords'],
      severity: 'medium',
      is_verified: false, // UNVERIFIED
      is_published: true,
      source_url: null,
      logo_url: null,
    },
  ];

  function createMockSupabase(allRecords: any[] = dataset) {
    const executedQueries: any[] = [];

    const mock = {
      from: (table: string) => {
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
                  (r.organization && r.organization.toLowerCase().includes(term)) ||
                  (r.domain && r.domain.toLowerCase().includes(term))
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

            // Apply all order directives sequentially (primary sort + secondary tiebreakers)
            if (orderDirectives.length > 0) {
              rows.sort((a, b) => {
                for (const { col, asc } of orderDirectives) {
                  const valA =
                    a[col] != null && !isNaN(Number(a[col]))
                      ? Number(a[col])
                      : (a[col] ?? '');
                  const valB =
                    b[col] != null && !isNaN(Number(b[col]))
                      ? Number(b[col])
                      : (b[col] ?? '');

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
  describe('GET /api/v1/breaches (List & Pagination)', () => {
    it('returns HTTP 200 with default pagination and standard envelope', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/breaches');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');

      // Default pagination is page 1, limit 10
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 10,
        totalItems: 5, // 5 published and verified items
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      expect(res.body.data).toHaveLength(5);
    });

    it('supports custom page and limit with accurate pagination metadata', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/breaches?page=1&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 2,
        totalItems: 5,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: false,
      });
      expect(res.body.data).toHaveLength(2);
    });

    it('returns empty array when page is beyond the last page', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/breaches?page=10&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.page).toBe(10);
      expect(res.body.pagination.totalItems).toBe(5);
      expect(res.body.pagination.hasNextPage).toBe(false);
      expect(res.body.pagination.hasPreviousPage).toBe(true);
    });

    it('filters records by search query across title, organization, or domain', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/breaches?search=tokopedia');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].slug).toBe('tokopedia-2020');
      expect(res.body.pagination.totalItems).toBe(1);
    });

    it('filters records by severity category', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/breaches?severity=critical');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3); // Tokopedia, Canva, Adobe
      for (const item of res.body.data) {
        expect(item.severity).toBe('critical');
      }
    });

    it('supports sorting by allowlisted fields in asc and desc directions', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      // Sort by pwn_count asc
      const res = await request(app).get('/api/v1/breaches?sort=pwn_count&order=asc');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(5);
      // Smallest pwn_count first (Bukalapak: 13,000,000)
      expect(res.body.data[0].slug).toBe('bukalapak-2019');
    });

    it('combines search, severity, sorting, and pagination seamlessly', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get(
        '/api/v1/breaches?search=com&severity=high&sort=pwn_count&order=desc&page=1&limit=5'
      );

      expect(res.status).toBe(200);
      // Both Bukalapak and Dropbox match .com and severity high
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].slug).toBe('dropbox-2012'); // 68M > 13M
      expect(res.body.data[1].slug).toBe('bukalapak-2019');
    });
  });

  // ==========================================================================
  // 2. Query Validation Tests (HTTP 400 Bad Request)
  // ==========================================================================
  describe('Query Validation & Error Responses', () => {
    it('returns HTTP 400 when page is less than 1 or not an integer', async () => {
      const res = await request(app).get('/api/v1/breaches?page=0');
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns HTTP 400 when limit is greater than 50 or less than 1', async () => {
      const res = await request(app).get('/api/v1/breaches?limit=100');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns HTTP 400 when severity is not one of critical, high, medium, low', async () => {
      const res = await request(app).get('/api/v1/breaches?severity=catastrophic');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns HTTP 400 when sort field is not in the allowlist', async () => {
      const res = await request(app).get('/api/v1/breaches?sort=passwords;DROP TABLE breaches;');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns HTTP 400 when order is neither asc nor desc', async () => {
      const res = await request(app).get('/api/v1/breaches?order=backwards');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ==========================================================================
  // 3. Security & Visibility Rules
  // ==========================================================================
  describe('Visibility & Security Enforcement', () => {
    it('never includes unpublished or unverified records in list or total count', async () => {
      const { client, executedQueries } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/breaches?limit=50');

      expect(res.status).toBe(200);
      expect(res.body.pagination.totalItems).toBe(5);

      const slugs = res.body.data.map((b: any) => b.slug);
      expect(slugs).not.toContain('unpublished-draft');
      expect(slugs).not.toContain('unverified-rumor');

      // Verify repository explicitly attached both filters to Supabase query
      expect(executedQueries[0].filters.is_published).toBe(true);
      expect(executedQueries[0].filters.is_verified).toBe(true);
    });

    it('list items do not leak internal audit columns', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/breaches');
      const item = res.body.data[0];

      expect(item).not.toHaveProperty('created_at');
      expect(item).not.toHaveProperty('updated_at');
      expect(item).not.toHaveProperty('is_published');
      expect(item).not.toHaveProperty('is_verified');
    });
  });

  // ==========================================================================
  // 4. Detail Endpoint Tests
  // ==========================================================================
  describe('GET /api/v1/breaches/:slug (Detail Endpoint)', () => {
    it('returns HTTP 200 with complete public detail for a valid slug', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/breaches/tokopedia-2020');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.slug).toBe('tokopedia-2020');
      expect(res.body.data.title).toBe('Tokopedia Data Breach (2020)');
      expect(res.body.data.organization).toBe('PT Tokopedia');
      expect(res.body.data.domain).toBe('tokopedia.com');
      expect(res.body.data.pwn_count).toBe(91000000);
      expect(res.body.data.severity).toBe('critical');
      expect(res.body.data.description).toBeDefined();
      expect(res.body.data.source_url).toBe('https://zdnet.com/tokopedia');
      expect(res.body.data.logo_url).toBe('https://logo.com/tokopedia.png');

      // Internal fields are NOT present
      expect(res.body.data).not.toHaveProperty('created_at');
      expect(res.body.data).not.toHaveProperty('is_published');
      expect(res.body.data).not.toHaveProperty('is_verified');
    });

    it('returns HTTP 404 when slug does not exist', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/breaches/nonexistent-breach-slug');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns HTTP 404 when requesting an unpublished record (does not leak existence)', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/breaches/unpublished-draft');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns HTTP 404 when requesting an unverified record (does not leak existence)', async () => {
      const { client } = createMockSupabase();
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/breaches/unverified-rumor');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
