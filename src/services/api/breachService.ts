import { apiClient, type ApiClient } from './client.ts';
import type { ApiSuccessResponse, ApiPaginatedResponse, RequestQueryParams } from './types.ts';
import type {
  BreachListItem,
  BreachDetailItem,
  BreachQueryOptions,
  BreachListResult,
} from '@/types';

/**
 * Service providing Breach Intelligence data from the CredLock Security Intelligence API.
 * Endpoints:
 * - GET /api/v1/breaches
 * - GET /api/v1/breaches/:slug
 */
export class BreachService {
  private readonly client: ApiClient;

  constructor(client: ApiClient = apiClient) {
    this.client = client;
  }

  /**
   * Fetches a paginated list of published and verified breaches.
   * Supports search, severity filtering, sorting, and pagination.
   */
  async getBreaches(options?: BreachQueryOptions): Promise<BreachListResult> {
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
      if (options.severity) {
        params.severity = options.severity;
      }
      if (options.sort) {
        params.sort = options.sort;
      }
      if (options.order) {
        params.order = options.order;
      }
    }

    const response = await this.client.get<ApiPaginatedResponse<BreachListItem>>('/breaches', {
      params,
    });

    return {
      data: response.data,
      pagination: response.pagination,
    };
  }

  /**
   * Fetches public detail of a single verified and published breach by its slug.
   * Throws ApiClientError with status 404 if the breach is nonexistent or unpublished.
   */
  async getBreachBySlug(slug: string): Promise<BreachDetailItem> {
    const cleanSlug = encodeURIComponent(slug.trim());
    const response = await this.client.get<ApiSuccessResponse<BreachDetailItem>>(
      `/breaches/${cleanSlug}`
    );
    return response.data;
  }
}

export const breachService = new BreachService();

/**
 * Functional convenience helper for fetching breaches list.
 */
export async function fetchBreaches(
  options?: BreachQueryOptions,
  client?: ApiClient
): Promise<BreachListResult> {
  const service = client ? new BreachService(client) : breachService;
  return service.getBreaches(options);
}

/**
 * Functional convenience helper for fetching breach detail by slug.
 */
export async function fetchBreachBySlug(
  slug: string,
  client?: ApiClient
): Promise<BreachDetailItem> {
  const service = client ? new BreachService(client) : breachService;
  return service.getBreachBySlug(slug);
}
