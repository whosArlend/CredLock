import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { setSupabaseClient } from '../src/config/supabase.js';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('GET /api/v1/dashboard/summary', () => {
  afterEach(() => {
    setSupabaseClient(null);
    vi.restoreAllMocks();
  });

  const sampleBreaches = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Tokopedia Data Breach',
      slug: 'tokopedia-2020',
      organization: 'PT Tokopedia',
      domain: 'tokopedia.com',
      breach_date: '2020-03-01',
      added_date: '2020-05-02',
      pwn_count: 91000000,
      severity: 'critical',
      is_published: true,
      is_verified: true,
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      title: 'Bukalapak Data Breach',
      slug: 'bukalapak-2019',
      organization: 'PT Bukalapak.com',
      domain: 'bukalapak.com',
      breach_date: '2019-03-01',
      added_date: '2019-03-17',
      pwn_count: '13000000', // string format test
      severity: 'high',
      is_published: true,
      is_verified: true,
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      title: 'Canva Security Breach',
      slug: 'canva-2019',
      organization: 'Canva Pty Ltd',
      domain: 'canva.com',
      breach_date: '2019-05-24',
      added_date: '2019-05-24',
      pwn_count: 137000000,
      severity: 'critical',
      is_published: true,
      is_verified: true,
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      title: 'Dropbox Credential Spill',
      slug: 'dropbox-2012',
      organization: 'Dropbox, Inc.',
      domain: 'dropbox.com',
      breach_date: '2012-07-01',
      added_date: '2016-08-31',
      pwn_count: 68680741,
      severity: 'high',
      is_published: true,
      is_verified: true,
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      title: 'Adobe Systems Breach',
      slug: 'adobe-2013',
      organization: 'Adobe Systems Inc.',
      domain: 'adobe.com',
      breach_date: '2013-10-04',
      added_date: '2013-10-04',
      pwn_count: 152989505,
      severity: 'critical',
      is_published: true,
      is_verified: true,
    },
    {
      id: '66666666-6666-6666-6666-666666666666',
      title: 'Sixth Sample Breach',
      slug: 'sixth-breach',
      organization: 'Sixth Corp',
      domain: 'sixth.com',
      breach_date: '2015-01-01',
      added_date: '2015-01-01',
      pwn_count: null, // null test
      severity: 'medium',
      is_published: true,
      is_verified: true,
    },
  ];

  /**
   * Helper to build a mock Supabase client with spy capabilities
   */
  function createMockClient(options: {
    breachesRows?: any[];
    recommendationsCount?: number;
    articlesCount?: number;
    errorOnTable?: string;
  }) {
    const executedQueries: Array<{ table: string; filters: Record<string, any>; select: string }> = [];

    const mockClient = {
      from: (table: string) => {
        if (options.errorOnTable === table) {
          return {
            select: () => {
              throw new Error(`Simulated database failure on table ${table}`);
            },
          };
        }

        const queryState: { table: string; filters: Record<string, any>; select: string; limitCount?: number } = {
          table,
          filters: {},
          select: '',
        };

        const builder: any = {
          select: (fields: string, opts?: any) => {
            queryState.select = fields;
            if (opts?.head) {
              // Count query for recommendations or articles
              return {
                eq: (column: string, val: any) => {
                  queryState.filters[column] = val;
                  executedQueries.push(queryState);

                  let count = 0;
                  if (table === 'recommendations') count = options.recommendationsCount ?? 8;
                  if (table === 'articles') count = options.articlesCount ?? 6;

                  return Promise.resolve({ count, error: null });
                },
              };
            }
            return builder;
          },
          eq: (column: string, val: any) => {
            queryState.filters[column] = val;
            return builder;
          },
          order: () => builder,
          limit: (n: number) => {
            queryState.limitCount = n;
            executedQueries.push(queryState);

            const rows = (options.breachesRows || sampleBreaches).slice(0, n);
            return Promise.resolve({ data: rows, error: null });
          },
        };

        // For non-limit calls like aggregates query
        builder.then = (resolve: any) => {
          executedQueries.push(queryState);
          const rows = options.breachesRows || sampleBreaches;
          const mapped = rows.map((r) => ({ severity: r.severity, pwn_count: r.pwn_count }));
          resolve({ data: mapped, error: null });
        };

        return builder;
      },
    };

    return { client: mockClient as unknown as SupabaseClient, executedQueries };
  }

  describe('Success Scenarios & Expected Structure', () => {
    it('returns HTTP 200 with standard envelope and expected data fields', async () => {
      const { client } = createMockClient({
        breachesRows: sampleBreaches,
        recommendationsCount: 8,
        articlesCount: 6,
      });
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/dashboard/summary');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('data');

      const data = res.body.data;
      expect(data).toHaveProperty('statistics');
      expect(data).toHaveProperty('breachesBySeverity');
      expect(data).toHaveProperty('recentBreaches');

      // Statistics
      expect(data.statistics.totalBreaches).toBe(6);
      expect(data.statistics.totalRecommendations).toBe(8);
      expect(data.statistics.totalArticles).toBe(6);
      // Expected sum: 91M + 13M + 137M + 68680741 + 152989505 = 462670246
      expect(data.statistics.totalExposedAccounts).toBe(462670246);

      // Severity Breakdown - all 4 categories must always be present
      expect(data.breachesBySeverity).toEqual({
        critical: 3,
        high: 2,
        medium: 1,
        low: 0,
      });

      // Recent breaches limited to 5
      expect(data.recentBreaches).toHaveLength(5);
    });

    it('recent breaches contain only the required minimal fields without internal leaks', async () => {
      const { client } = createMockClient({ breachesRows: sampleBreaches });
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/dashboard/summary');
      const firstRecent = res.body.data.recentBreaches[0];

      // Permitted fields
      expect(firstRecent).toHaveProperty('id');
      expect(firstRecent).toHaveProperty('title');
      expect(firstRecent).toHaveProperty('slug');
      expect(firstRecent).toHaveProperty('organization');
      expect(firstRecent).toHaveProperty('domain');
      expect(firstRecent).toHaveProperty('breach_date');
      expect(firstRecent).toHaveProperty('added_date');
      expect(firstRecent).toHaveProperty('pwn_count');
      expect(firstRecent).toHaveProperty('severity');

      // Internal fields that must NEVER be returned
      expect(firstRecent).not.toHaveProperty('description');
      expect(firstRecent).not.toHaveProperty('data_classes');
      expect(firstRecent).not.toHaveProperty('is_published');
      expect(firstRecent).not.toHaveProperty('is_verified');
      expect(firstRecent).not.toHaveProperty('created_at');
      expect(firstRecent).not.toHaveProperty('updated_at');
    });
  });

  describe('Visibility & Security Filtering', () => {
    it('enforces published AND verified filter on breaches, and published on recommendations/articles', async () => {
      const { client, executedQueries } = createMockClient({ breachesRows: sampleBreaches });
      setSupabaseClient(client);

      await request(app).get('/api/v1/dashboard/summary');

      // Verify breaches queries applied BOTH filters
      const breachQueries = executedQueries.filter((q) => q.table === 'breaches');
      expect(breachQueries.length).toBeGreaterThanOrEqual(2);
      for (const bq of breachQueries) {
        expect(bq.filters.is_published).toBe(true);
        expect(bq.filters.is_verified).toBe(true);
      }

      // Verify recommendations count query applied is_published filter
      const recQuery = executedQueries.find((q) => q.table === 'recommendations');
      expect(recQuery?.filters.is_published).toBe(true);

      // Verify articles count query applied is_published filter
      const artQuery = executedQueries.find((q) => q.table === 'articles');
      expect(artQuery?.filters.is_published).toBe(true);
    });
  });

  describe('Edge Cases & Resilient Calculations', () => {
    it('handles an empty database gracefully', async () => {
      const { client } = createMockClient({
        breachesRows: [],
        recommendationsCount: 0,
        articlesCount: 0,
      });
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/dashboard/summary');

      expect(res.status).toBe(200);
      expect(res.body.data.statistics).toEqual({
        totalBreaches: 0,
        totalExposedAccounts: 0,
        totalRecommendations: 0,
        totalArticles: 0,
      });
      expect(res.body.data.breachesBySeverity).toEqual({
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      });
      expect(res.body.data.recentBreaches).toEqual([]);
    });

    it('handles unexpected severity strings and non-numeric pwn_count safely', async () => {
      const edgeBreaches = [
        {
          id: 'aaa',
          title: 'Weird Breach',
          slug: 'weird',
          organization: null,
          domain: null,
          breach_date: null,
          added_date: '2024-01-01',
          pwn_count: 'invalid_number',
          severity: 'UNKNOWN_CUSTOM_SEVERITY',
        },
        {
          id: 'bbb',
          title: 'Zero Breach',
          slug: 'zero',
          organization: null,
          domain: null,
          breach_date: null,
          added_date: '2024-01-02',
          pwn_count: null,
          severity: 'low',
        },
      ];

      const { client } = createMockClient({
        breachesRows: edgeBreaches,
        recommendationsCount: 2,
        articlesCount: 1,
      });
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/dashboard/summary');

      expect(res.status).toBe(200);
      expect(res.body.data.statistics.totalBreaches).toBe(2);
      expect(res.body.data.statistics.totalExposedAccounts).toBe(0);
      // Unknown severity does not crash the 4 standard categories
      expect(res.body.data.breachesBySeverity).toEqual({
        critical: 0,
        high: 0,
        medium: 0,
        low: 1,
      });
    });

    it('accurately sums very large exposed account numbers without precision errors', async () => {
      const massiveBreaches = [
        { severity: 'critical', pwn_count: '3000000000' }, // 3 billion
        { severity: 'high', pwn_count: 2000000000 },      // 2 billion
      ];

      const { client } = createMockClient({ breachesRows: massiveBreaches });
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/dashboard/summary');

      expect(res.status).toBe(200);
      expect(res.body.data.statistics.totalExposedAccounts).toBe(5000000000);
    });
  });

  describe('Error Handling', () => {
    it('returns safe HTTP 500 without leaking stack traces or internal errors when DB fails', async () => {
      const { client } = createMockClient({ errorOnTable: 'breaches' });
      setSupabaseClient(client);

      const res = await request(app).get('/api/v1/dashboard/summary');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toHaveProperty('code');
      expect(res.body.error).toHaveProperty('message');

      // Crucial Security Checks: No database internals, secrets, or stack traces leaked
      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain('stack');
      expect(bodyStr).not.toContain('supabase');
      expect(bodyStr).not.toContain('SELECT');
      expect(bodyStr).not.toContain('password');
    });
  });
});
