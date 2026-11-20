import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../config/supabase.js';
import type {
  ArticleListItem,
  ArticleDetailItem,
  ArticleQueryOptions,
} from '../types/article.js';
import type { AppError } from '../middleware/errorHandler.js';
import { sanitizeSearchTerm } from '../utils/sanitize.js';

export class ArticleRepository {
  /**
   * Retrieves a paginated list of published security articles.
   * Strictly enforces is_published = true.
   */
  async getArticles(
    options: ArticleQueryOptions,
    client?: SupabaseClient
  ): Promise<{ data: ArticleListItem[]; totalItems: number }> {
    const db = client || getSupabaseClient();

    let query = db
      .from('articles')
      .select(
        'id, title, slug, category, summary, author_name, read_time_minutes, tags, published_at',
        { count: 'exact' }
      )
      .eq('is_published', true);

    // Apply category filter
    if (options.category) {
      query = query.eq('category', options.category);
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
      const err: AppError = new Error('Failed to retrieve articles list');
      err.code = 'DATABASE_QUERY_ERROR';
      err.statusCode = 500;
      throw err;
    }

    return {
      data: (data || []) as ArticleListItem[],
      totalItems: count ?? 0,
    };
  }

  /**
   * Retrieves detail of one published security article by its slug.
   * Strictly enforces is_published = true.
   */
  async getArticleBySlug(
    slug: string,
    client?: SupabaseClient
  ): Promise<ArticleDetailItem | null> {
    const db = client || getSupabaseClient();

    const { data, error } = await db
      .from('articles')
      .select(
        'id, title, slug, category, summary, content, author_name, read_time_minutes, tags, published_at'
      )
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (error) {
      const err: AppError = new Error('Failed to retrieve article detail');
      err.code = 'DATABASE_QUERY_ERROR';
      err.statusCode = 500;
      throw err;
    }

    return (data as ArticleDetailItem) || null;
  }
}

export const articleRepository = new ArticleRepository();
