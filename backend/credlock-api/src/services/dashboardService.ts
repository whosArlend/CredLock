import { dashboardRepository, type DashboardRepository } from '../repositories/dashboardRepository.js';
import type {
  DashboardSummaryData,
  BreachesBySeverity,
  RecentBreachItem,
} from '../types/dashboard.js';
import type { SupabaseClient } from '@supabase/supabase-js';

export class DashboardService {
  constructor(private readonly repo: DashboardRepository = dashboardRepository) {}

  /**
   * Retrieves and aggregates summary statistics and recent breaches for the dashboard.
   */
  async getDashboardSummary(client?: SupabaseClient): Promise<DashboardSummaryData> {
    // Execute all queries in parallel for efficiency
    const [breachesData, recentBreachesRaw, totalRecommendations, totalArticles] =
      await Promise.all([
        this.repo.getBreachesAggregates(client),
        this.repo.getRecentBreaches(5, client),
        this.repo.getPublishedRecommendationsCount(client),
        this.repo.getPublishedArticlesCount(client),
      ]);

    // 1. Calculate breaches count and aggregate exposed accounts
    const totalBreaches = breachesData.length;
    let totalExposedAccountsBigInt = 0n;

    // 2. Initialize and calculate severity breakdown
    const breachesBySeverity: BreachesBySeverity = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    for (const row of breachesData) {
      // Safe pwn_count summation handling nulls, strings, and large numbers
      if (row.pwn_count != null) {
        try {
          const rawStr = String(row.pwn_count).trim();
          if (rawStr.length > 0) {
            const countBigInt = BigInt(rawStr);
            if (countBigInt > 0n) {
              totalExposedAccountsBigInt += countBigInt;
            }
          }
        } catch {
          // If string conversion or BigInt fails (e.g. non-numeric format), safely skip
        }
      }

      // Safe severity grouping
      const normalizedSeverity = (row.severity || '').toLowerCase().trim();
      if (normalizedSeverity in breachesBySeverity) {
        breachesBySeverity[normalizedSeverity as keyof BreachesBySeverity]++;
      }
    }

    // Convert totalExposedAccounts to number (safe within JS Number.MAX_SAFE_INTEGER)
    const totalExposedAccounts =
      totalExposedAccountsBigInt <= BigInt(Number.MAX_SAFE_INTEGER)
        ? Number(totalExposedAccountsBigInt)
        : Number(totalExposedAccountsBigInt);

    // 3. Format recent breaches safely (guaranteeing exact permitted fields)
    const recentBreaches: RecentBreachItem[] = (recentBreachesRaw || [])
      .slice(0, 5)
      .map((item) => {
        let pwnCount: number | null = null;
        if (item.pwn_count != null) {
          const num = Number(item.pwn_count);
          pwnCount = isNaN(num) ? null : num;
        }

        return {
          id: String(item.id),
          title: String(item.title),
          slug: String(item.slug),
          organization: item.organization ? String(item.organization) : null,
          domain: item.domain ? String(item.domain) : null,
          breach_date: item.breach_date ? String(item.breach_date) : null,
          added_date: String(item.added_date),
          pwn_count: pwnCount,
          severity: String(item.severity),
        };
      });

    return {
      statistics: {
        totalBreaches,
        totalExposedAccounts,
        totalRecommendations,
        totalArticles,
      },
      breachesBySeverity,
      recentBreaches,
    };
  }
}

export const dashboardService = new DashboardService();
