/**
 * Types and interfaces for the Security Articles API module.
 */

export type ArticleCategory = 'guide' | 'analysis' | 'news' | 'explainer';

export type ArticleSortField = 'title' | 'category' | 'published_at' | 'read_time_minutes';

export type SortOrder = 'asc' | 'desc';

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

export interface ArticleDetailItem {
  id: string;
  title: string;
  slug: string;
  category: ArticleCategory;
  summary: string;
  content: string;
  author_name: string;
  read_time_minutes: number;
  tags: string[];
  published_at: string | null;
}

export interface ArticlePaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ArticleListResponse {
  data: ArticleListItem[];
  pagination: ArticlePaginationMeta;
}

export interface ArticleQueryOptions {
  page: number;
  limit: number;
  search?: string;
  category?: ArticleCategory;
  sort: ArticleSortField;
  order: SortOrder;
}
