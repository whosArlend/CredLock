import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../config/supabase.js';
import type {
  RecommendationListItem,
  RecommendationDetailItem,
  RecommendationQueryOptions,
} from '../types/recommendation.js';
import type { AppError } from '../middleware/errorHandler.js';
import { sanitizeSearchTerm } from '../utils/sanitize.js';

export class RecommendationRepository {
  /**
   * Retrieves a paginated list of published security recommendations.
   * Strictly enforces is_published = true.
   */
  async getRecommendations(
    options: RecommendationQueryOptions,
    client?: SupabaseClient
  ): Promise<{ data: RecommendationListItem[]; totalItems: number }> {
    const db = client || getSupabaseClient();

    let query = db
      .from('recommendations')
      .select(
        'id, title, slug, category, priority, summary, action_steps, target_audience, tags',
        { count: 'exact' }
      )
      .eq('is_published', true);

    // Apply category filter
    if (options.category) {
      query = query.eq('category', options.category);
    }

    // Apply priority filter
    if (options.priority) {
      query = query.eq('priority', options.priority);
    }

    // Apply case-insensitive search across title, summary, and category
    if (options.search) {
      const sanitized = sanitizeSearchTerm(options.search);
      if (sanitized.length > 0) {
        query = query.or(
          `title.ilike.%${sanitized}%,summary.ilike.%${sanitized}%,category.ilike.%${sanitized}%`
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
      const err: AppError = new Error('Failed to retrieve recommendations list');
      err.code = 'DATABASE_QUERY_ERROR';
      err.statusCode = 500;
      throw err;
    }

    return {
      data: (data || []) as RecommendationListItem[],
      totalItems: count ?? 0,
    };
  }

  /**
   * Retrieves detail of one published recommendation by its slug.
   * Strictly enforces is_published = true.
   */
  async getRecommendationBySlug(
    slug: string,
    client?: SupabaseClient
  ): Promise<RecommendationDetailItem | null> {
    const db = client || getSupabaseClient();

    const { data, error } = await db
      .from('recommendations')
      .select(
        'id, title, slug, category, priority, summary, action_steps, target_audience, tags'
      )
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (error) {
      const err: AppError = new Error('Failed to retrieve recommendation detail');
      err.code = 'DATABASE_QUERY_ERROR';
      err.statusCode = 500;
      throw err;
    }

    return (data as RecommendationDetailItem) || null;
  }
}

export const recommendationRepository = new RecommendationRepository();
