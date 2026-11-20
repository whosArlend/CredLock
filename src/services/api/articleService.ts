import { apiClient, type ApiClient } from './client.ts';
import type { ApiSuccessResponse, ApiPaginatedResponse, RequestQueryParams } from './types.ts';
import type {
  ArticleListItem,
  ArticleDetailItem,
  ArticleQueryOptions,
  ArticleListResult,
} from '@/types';

/**
 * Service providing Security Articles & Advisories data from the CredLock Security Intelligence API.
 * Endpoints:
 * - GET /api/v1/articles
 * - GET /api/v1/articles/:slug
 */
export class ArticleService {
  private readonly client: ApiClient;

  constructor(client: ApiClient = apiClient) {
    this.client = client;
  }

  /**
   * Fetches a paginated list of published security articles.
   * Supports search, category filter, sorting, and pagination.
   */
  async getArticles(options?: ArticleQueryOptions): Promise<ArticleListResult> {
    const params: RequestQueryParams = {};

    if (options) {
      if (options.page !== undefined && options.page !== null) {
        params.page = options.page;
      }
      if (options.limit !== undefined && options.limit !== null) {
        params.limit = options.limit;
      }
      if (options.search !== undefined && options.search !== null && options.search.trim() !== '') {
        params.search = options.search.trim();
      }
      if (options.category) {
        params.category = options.category;
      }
      if (options.sort) {
        params.sort = options.sort;
      }
      if (options.order) {
        params.order = options.order;
      }
    }

    const response = await this.client.get<
      ApiPaginatedResponse<ArticleListItem>
    >('/articles', {
      params,
    });

    return {
      data: response.data,
      pagination: response.pagination,
    };
  }

  /**
   * Fetches public detail of a single published security article by its slug.
   * Throws ApiClientError with status 404 if the article is nonexistent or unpublished.
   */
  async getArticleBySlug(slug: string): Promise<ArticleDetailItem> {
    const cleanSlug = encodeURIComponent(slug.trim());
    const response = await this.client.get<
      ApiSuccessResponse<ArticleDetailItem>
    >(`/articles/${cleanSlug}`);
    return response.data;
  }
}

export const articleService = new ArticleService();

/**
 * Functional convenience helper for fetching articles list.
 */
export async function fetchArticles(
  options?: ArticleQueryOptions,
  client?: ApiClient
): Promise<ArticleListResult> {
  const service = client ? new ArticleService(client) : articleService;
  return service.getArticles(options);
}

/**
 * Functional convenience helper for fetching article detail by slug.
 */
export async function fetchArticleBySlug(
  slug: string,
  client?: ApiClient
): Promise<ArticleDetailItem> {
  const service = client ? new ArticleService(client) : articleService;
  return service.getArticleBySlug(slug);
}
