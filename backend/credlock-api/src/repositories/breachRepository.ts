import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../config/supabase.js';
import type {
  BreachListItem,
  BreachDetailItem,
  BreachQueryOptions,
} from '../types/breach.js';
import type { AppError } from '../middleware/errorHandler.js';

export class BreachRepository {
  /**
   * Retrieves a paginated list of published and verified breaches.
   */
  async getBreaches(
    options: BreachQueryOptions,
    client?: SupabaseClient
  ): Promise<{ data: BreachListItem[]; totalItems: number }> {
    const db = client || getSupabaseClient();

    let query = db
      .from('breaches')
      .select(
        'id, title, slug, domain, organization, breach_date, added_date, pwn_count, data_classes, severity, logo_url',
        { count: 'exact' }
      )
      .eq('is_published', true)
      .eq('is_verified', true);

    // Apply severity filter
    if (options.severity) {
      query = query.eq('severity', options.severity);
    }

    // Apply safe search across title, organization, and domain
    if (options.search) {
      const sanitized = options.search.replace(/[,()":]/g, ' ').trim();
      if (sanitized.length > 0) {
        query = query.or(
          `title.ilike.%${sanitized}%,organization.ilike.%${sanitized}%,domain.ilike.%${sanitized}%`
        );
      }
    }

    // Apply primary sort and deterministic secondary sort
    query = query
      .order(options.sort, { ascending: options.order === 'asc' })
      .order('id', { ascending: true });

    // Apply database-level pagination range
    const offset = (options.page - 1) * options.limit;
    query = query.range(offset, offset + options.limit - 1);

    const { data, count, error } = await query;

    if (error) {
      const err: AppError = new Error('Failed to retrieve breaches list');
      err.code = 'DATABASE_QUERY_ERROR';
      err.statusCode = 500;
      throw err;
    }

    return {
      data: (data || []) as BreachListItem[],
      totalItems: count ?? 0,
    };
  }

  /**
   * Retrieves detail of one verified and published breach by its slug.
   * Returns null if not found or if the record is unpublished/unverified.
   */
  async getBreachBySlug(
    slug: string,
    client?: SupabaseClient
  ): Promise<BreachDetailItem | null> {
    const db = client || getSupabaseClient();

    const { data, error } = await db
      .from('breaches')
      .select(
        'id, title, slug, domain, organization, breach_date, added_date, pwn_count, description, data_classes, severity, source_url, logo_url'
      )
      .eq('slug', slug)
      .eq('is_published', true)
      .eq('is_verified', true)
      .maybeSingle();

    if (error) {
      const err: AppError = new Error('Failed to retrieve breach detail');
      err.code = 'DATABASE_QUERY_ERROR';
      err.statusCode = 500;
      throw err;
    }

    return (data as BreachDetailItem) || null;
  }
}

export const breachRepository = new BreachRepository();
