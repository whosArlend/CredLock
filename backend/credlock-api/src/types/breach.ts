/**
 * Types and interfaces for the Breach Intelligence API module.
 */

export type BreachSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface BreachListItem {
  id: string;
  title: string;
  slug: string;
  domain: string | null;
  organization: string | null;
  breach_date: string | null;
  added_date: string;
  pwn_count: number | null;
  data_classes: string[];
  severity: BreachSeverity;
  logo_url: string | null;
}

export interface BreachDetailItem extends BreachListItem {
  description: string;
  source_url: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface BreachListResponse {
  data: BreachListItem[];
  pagination: PaginationMeta;
}

export interface BreachQueryOptions {
  page: number;
  limit: number;
  search?: string;
  severity?: BreachSeverity;
  sort: 'added_date' | 'breach_date' | 'pwn_count' | 'title';
  order: 'asc' | 'desc';
}
