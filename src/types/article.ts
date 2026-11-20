/**
 * Frontend types and interfaces for the Security Articles API module.
 * Strictly mirrors the backend DTO contracts from GET /api/v1/articles and GET /api/v1/articles/:slug.
 */

import type { ApiPaginationMeta } from '@/services/api/types';

export type ArticleCategory = 'guide' | 'analysis' | 'news' | 'explainer';

export type ArticleSortField = 'title' | 'category' | 'published_at' | 'read_time_minutes';

export type ArticleSortOrder = 'asc' | 'desc';

export interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  category: ArticleCategory;
  summary: string;
  author_name: string;
  read_time_minutes: number;
  tags: string[];
  published_at: string | null;
}

export interface ArticleDetailItem extends ArticleListItem {
  content: string;
}

export interface ArticleQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: ArticleCategory;
  sort?: ArticleSortField;
  order?: ArticleSortOrder;
}

export interface ArticleListResult {
  data: ArticleListItem[];
  pagination: ApiPaginationMeta;
}

export type ArticleFetchStatus = 'idle' | 'loading' | 'success' | 'error';
