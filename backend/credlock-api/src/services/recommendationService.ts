import {
  recommendationRepository,
  type RecommendationRepository,
} from '../repositories/recommendationRepository.js';
import type {
  RecommendationListResponse,
  RecommendationDetailItem,
  RecommendationQueryOptions,
  RecommendationListItem,
} from '../types/recommendation.js';
import type { SupabaseClient } from '@supabase/supabase-js';

export class RecommendationService {
  constructor(
    private readonly repo: RecommendationRepository = recommendationRepository
  ) {}

  /**
   * Retrieves a paginated list of recommendations with metadata calculation.
   */
  async listRecommendations(
    options: RecommendationQueryOptions,
    client?: SupabaseClient
  ): Promise<RecommendationListResponse> {
    const { data: rawData, totalItems } = await this.repo.getRecommendations(
      options,
      client
    );

    const totalPages = totalItems > 0 ? Math.ceil(totalItems / options.limit) : 0;
    const hasNextPage = options.page < totalPages;
    const hasPreviousPage = options.page > 1 && totalItems > 0;

    // Cleanly map and sanitize list items
    const data: RecommendationListItem[] = (rawData || []).map((item) => ({
      id: String(item.id),
      title: String(item.title),
      slug: String(item.slug),
      category: item.category,
      priority: item.priority,
      summary: String(item.summary),
      target_audience: item.target_audience ? String(item.target_audience) : null,
      tags: Array.isArray(item.tags) ? item.tags : [],
      action_steps: item.action_steps,
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
   * Retrieves detail of one published recommendation by slug.
   * Returns null if nonexistent or unpublished.
   */
  async getRecommendationDetail(
    slug: string,
    client?: SupabaseClient
  ): Promise<RecommendationDetailItem | null> {
    const raw = await this.repo.getRecommendationBySlug(slug.trim(), client);
    if (!raw) {
      return null;
    }

    return {
      id: String(raw.id),
      title: String(raw.title),
      slug: String(raw.slug),
      category: raw.category,
      priority: raw.priority,
      summary: String(raw.summary),
      action_steps: raw.action_steps,
      target_audience: raw.target_audience ? String(raw.target_audience) : null,
      tags: Array.isArray(raw.tags) ? raw.tags : [],
    };
  }
}

export const recommendationService = new RecommendationService();
