import { apiClient, type ApiClient } from './client.ts';
import type { ApiSuccessResponse } from './types.ts';
import type { DashboardSummaryData } from '@/types';

/**
 * Service providing dashboard intelligence data from the CredLock Security Intelligence API.
 * Endpoint: GET /api/v1/dashboard/summary
 */
export class DashboardService {
  private readonly client: ApiClient;

  constructor(client: ApiClient = apiClient) {
    this.client = client;
  }

  /**
   * Fetches the global cybersecurity intelligence summary.
   * Includes statistics, breaches by severity, and recent breach incidents.
   */
  async getSummary(): Promise<DashboardSummaryData> {
    const response = await this.client.get<ApiSuccessResponse<DashboardSummaryData>>(
      '/dashboard/summary'
    );
    return response.data;
  }
}

export const dashboardService = new DashboardService();

/**
 * Functional convenience helper for fetching dashboard summary.
 */
export async function fetchDashboardSummary(
  client?: ApiClient
): Promise<DashboardSummaryData> {
  const service = client ? new DashboardService(client) : dashboardService;
  return service.getSummary();
}
