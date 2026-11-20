/**
 * Types and interfaces for the Security Recommendations API module.
 */

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
  action_steps: unknown;
}

export interface RecommendationDetailItem {
  id: string;
  title: string;
  slug: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  summary: string;
  action_steps: unknown;
  target_audience: string | null;
  tags: string[];
}

export interface RecommendationPaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface RecommendationListResponse {
  data: RecommendationListItem[];
  pagination: RecommendationPaginationMeta;
}

export interface RecommendationQueryOptions {
  page: number;
  limit: number;
  search?: string;
  category?: RecommendationCategory;
  priority?: RecommendationPriority;
  sort: 'title' | 'category' | 'priority' | 'created_at';
  order: 'asc' | 'desc';
}
