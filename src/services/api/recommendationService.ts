import { apiClient, type ApiClient } from './client.ts';
import type { ApiSuccessResponse, ApiPaginatedResponse, RequestQueryParams } from './types.ts';
import type {
  RecommendationListItem,
  RecommendationDetailItem,
  RecommendationQueryOptions,
  RecommendationListResult,
} from '@/types';

/**
 * Service providing Security Recommendations data from the CredLock Security Intelligence API.
 * Endpoints:
 * - GET /api/v1/recommendations
 * - GET /api/v1/recommendations/:slug
 */
export class RecommendationService {
  private readonly client: ApiClient;

  constructor(client: ApiClient = apiClient) {
    this.client = client;
  }

  /**
   * Fetches a paginated list of published security recommendations.
   * Supports search, category filter, priority filter, sorting, and pagination.
   */
  async getRecommendations(
    options?: RecommendationQueryOptions
  ): Promise<RecommendationListResult> {
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
      if (options.priority) {
        params.priority = options.priority;
      }
      if (options.sort) {
        params.sort = options.sort;
      }
      if (options.order) {
        params.order = options.order;
      }
    }

    const response = await this.client.get<
      ApiPaginatedResponse<RecommendationListItem>
    >('/recommendations', {
      params,
    });

    return {
      data: response.data,
      pagination: response.pagination,
    };
  }

  /**
   * Fetches public detail of a single published security recommendation by its slug.
   * Throws ApiClientError with status 404 if the recommendation is nonexistent or unpublished.
   */
  async getRecommendationBySlug(slug: string): Promise<RecommendationDetailItem> {
    const cleanSlug = encodeURIComponent(slug.trim());
    const response = await this.client.get<
      ApiSuccessResponse<RecommendationDetailItem>
    >(`/recommendations/${cleanSlug}`);
    return response.data;
  }
}

export const recommendationService = new RecommendationService();

/**
 * Functional convenience helper for fetching recommendations list.
 */
export async function fetchRecommendations(
  options?: RecommendationQueryOptions,
  client?: ApiClient
): Promise<RecommendationListResult> {
  const service = client ? new RecommendationService(client) : recommendationService;
  return service.getRecommendations(options);
}

/**
 * Functional convenience helper for fetching recommendation detail by slug.
 */
export async function fetchRecommendationBySlug(
  slug: string,
  client?: ApiClient
): Promise<RecommendationDetailItem> {
  const service = client ? new RecommendationService(client) : recommendationService;
  return service.getRecommendationBySlug(slug);
}
