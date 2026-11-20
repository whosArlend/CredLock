/**
 * Frontend types and interfaces for the Breach Intelligence API module.
 * Strictly mirrors the backend DTO contracts from GET /api/v1/breaches and GET /api/v1/breaches/:slug.
 */

import type { ApiPaginationMeta } from '@/services/api/types';

export type { ApiPaginationMeta };
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

export interface BreachQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  severity?: BreachSeverity;
  sort?: 'added_date' | 'breach_date' | 'pwn_count' | 'title';
  order?: 'asc' | 'desc';
}

export interface BreachListResult {
  data: BreachListItem[];
  pagination: ApiPaginationMeta;
}

export type BreachFetchStatus = 'idle' | 'loading' | 'success' | 'error';
