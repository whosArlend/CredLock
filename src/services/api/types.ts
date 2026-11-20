/**
 * TypeScript types and interfaces for the CredLock API communication layer.
 * Mirrors the standardized envelope contracts of the backend.
 */

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiPaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiPaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: ApiPaginationMeta;
  timestamp: string;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiPaginatedResponse<T> | ApiErrorResponse;

export type QueryParamValue = string | number | boolean | null | undefined;
export type RequestQueryParams = Record<string, QueryParamValue>;

export interface RequestOptions {
  params?: RequestQueryParams;
  headers?: Record<string, string>;
  timeoutMs?: number;
  signal?: AbortSignal;
}
