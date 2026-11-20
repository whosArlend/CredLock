/**
 * Frontend types for the CredLock Security Intelligence Dashboard API.
 * Mirrors the contract from GET /api/v1/dashboard/summary.
 */

export interface DashboardStatistics {
  totalBreaches: number;
  totalExposedAccounts: number;
  totalRecommendations: number;
  totalArticles: number;
}

export interface BreachesBySeverity {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface RecentBreachItem {
  id: string;
  title: string;
  slug: string;
  organization: string | null;
  domain: string | null;
  breach_date: string | null;
  added_date: string;
  pwn_count: number | null;
  severity: string;
}

export interface DashboardSummaryData {
  statistics: DashboardStatistics;
  breachesBySeverity: BreachesBySeverity;
  recentBreaches: RecentBreachItem[];
}

export type DashboardStatus = 'idle' | 'loading' | 'success' | 'error';
