/**
 * Types and interfaces for the Dashboard Summary API.
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
