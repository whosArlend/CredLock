import {
  articleRepository,
  type ArticleRepository,
} from '../repositories/articleRepository.js';
import type {
  ArticleListResponse,
  ArticleDetailItem,
  ArticleQueryOptions,
  ArticleListItem,
} from '../types/article.js';
import type { SupabaseClient } from '@supabase/supabase-js';

export class ArticleService {
  constructor(
    private readonly repo: ArticleRepository = articleRepository
  ) {}

  /**
   * Retrieves a paginated list of articles with metadata calculation.
   */
  async listArticles(
    options: ArticleQueryOptions,
    client?: SupabaseClient
  ): Promise<ArticleListResponse> {
    const { data: rawData, totalItems } = await this.repo.getArticles(
      options,
      client
    );

    const totalPages = totalItems > 0 ? Math.ceil(totalItems / options.limit) : 0;
    const hasNextPage = options.page < totalPages;
    const hasPreviousPage = options.page > 1 && totalItems > 0;

    // Cleanly map and sanitize list items
    const data: ArticleListItem[] = (rawData || []).map((item) => ({
      id: String(item.id),
      title: String(item.title),
      slug: String(item.slug),
      category: item.category,
      summary: String(item.summary),
      author_name: String(item.author_name),
      read_time_minutes: Number(item.read_time_minutes),
      tags: Array.isArray(item.tags) ? item.tags : [],
      published_at: item.published_at ? String(item.published_at) : null,
    }));

    return {
      data,
      pagination: {
        page: options.page,
        limit: options.limit,
        totalItems,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  /**
   * Retrieves detail of a single published article by slug.
   * Preserves raw Markdown content exactly as stored.
   */
  async getArticleDetail(
    slug: string,
    client?: SupabaseClient
  ): Promise<ArticleDetailItem | null> {
    const raw = await this.repo.getArticleBySlug(slug, client);
    if (!raw) {
      return null;
    }

    return {
      id: String(raw.id),
      title: String(raw.title),
      slug: String(raw.slug),
      category: raw.category,
      summary: String(raw.summary),
      content: String(raw.content),
      author_name: String(raw.author_name),
      read_time_minutes: Number(raw.read_time_minutes),
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      published_at: raw.published_at ? String(raw.published_at) : null,
    };
  }
}

export const articleService = new ArticleService();
