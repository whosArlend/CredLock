/**
 * Frontend types and interfaces for the Security Recommendations API module.
 * Strictly mirrors the backend DTO contracts from GET /api/v1/recommendations and GET /api/v1/recommendations/:slug.
 */

import type { ApiPaginationMeta } from '@/services/api/types';

export type RecommendationCategory =
  | 'password'
  | 'auth'
  | 'device'
  | 'network'
  | 'incident_response';

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';

export interface RecommendationListItem {
  id: string;
  title: string;
  slug: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  summary: string;
  target_audience: string | null;
  tags: string[];
  action_steps: string[];
}

export interface RecommendationDetailItem {
  id: string;
  title: string;
  slug: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  summary: string;
  action_steps: string[];
  target_audience: string | null;
  tags: string[];
}

export interface RecommendationQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: RecommendationCategory;
  priority?: RecommendationPriority;
  sort?: 'title' | 'category' | 'priority' | 'created_at';
  order?: 'asc' | 'desc';
}

export interface RecommendationListResult {
  data: RecommendationListItem[];
  pagination: ApiPaginationMeta;
}

export type RecommendationFetchStatus = 'idle' | 'loading' | 'success' | 'error';
