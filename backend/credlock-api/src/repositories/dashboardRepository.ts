import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../config/supabase.js';
import type { RecentBreachItem } from '../types/dashboard.js';
import type { AppError } from '../middleware/errorHandler.js';

export interface BreachAggregateRow {
  severity: string;
  pwn_count: number | string | null;
}

/**
 * Repository handling database operations for the Dashboard Summary.
 * Strictly enforces visibility filters (is_published, is_verified) since
 * the server client uses SUPABASE_SECRET_KEY which bypasses RLS.
 */
export class DashboardRepository {
  /**
   * Fetches severity and pwn_count for all published and verified breaches.
   */
  async getBreachesAggregates(client?: SupabaseClient): Promise<BreachAggregateRow[]> {
    const db = client || getSupabaseClient();
    const { data, error } = await db
      .from('breaches')
      .select('severity, pwn_count')
      .eq('is_published', true)
      .eq('is_verified', true);

    if (error) {
      const err: AppError = new Error('Failed to retrieve breach aggregate statistics');
      err.code = 'DATABASE_QUERY_ERROR';
      err.statusCode = 500;
      throw err;
    }

    return (data || []) as BreachAggregateRow[];
  }

  /**
   * Fetches up to `limit` recent verified and published breaches.
   * Only selects the necessary non-internal public fields.
   */
  async getRecentBreaches(limit = 5, client?: SupabaseClient): Promise<RecentBreachItem[]> {
    const db = client || getSupabaseClient();
    const { data, error } = await db
      .from('breaches')
      .select('id, title, slug, organization, domain, breach_date, added_date, pwn_count, severity')
      .eq('is_published', true)
      .eq('is_verified', true)
      .order('added_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      const err: AppError = new Error('Failed to retrieve recent breaches');
      err.code = 'DATABASE_QUERY_ERROR';
      err.statusCode = 500;
      throw err;
    }

    return (data || []) as RecentBreachItem[];
  }

  /**
   * Counts the total number of published recommendations.
   */
  async getPublishedRecommendationsCount(client?: SupabaseClient): Promise<number> {
    const db = client || getSupabaseClient();
    const { count, error } = await db
      .from('recommendations')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true);

    if (error) {
      const err: AppError = new Error('Failed to count published recommendations');
      err.code = 'DATABASE_QUERY_ERROR';
      err.statusCode = 500;
      throw err;
    }

    return count ?? 0;
  }

  /**
   * Counts the total number of published articles.
   */
  async getPublishedArticlesCount(client?: SupabaseClient): Promise<number> {
    const db = client || getSupabaseClient();
    const { count, error } = await db
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true);

    if (error) {
      const err: AppError = new Error('Failed to count published articles');
      err.code = 'DATABASE_QUERY_ERROR';
      err.statusCode = 500;
      throw err;
    }

    return count ?? 0;
  }
}

export const dashboardRepository = new DashboardRepository();
