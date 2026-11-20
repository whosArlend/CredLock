import { breachRepository, type BreachRepository } from '../repositories/breachRepository.js';
import type {
  BreachListResponse,
  BreachDetailItem,
  BreachQueryOptions,
  BreachListItem,
} from '../types/breach.js';
import type { SupabaseClient } from '@supabase/supabase-js';

export class BreachService {
  constructor(private readonly repo: BreachRepository = breachRepository) {}

  /**
   * Retrieves a paginated list of breaches with metadata calculation.
   */
  async listBreaches(
    options: BreachQueryOptions,
    client?: SupabaseClient
  ): Promise<BreachListResponse> {
    const { data: rawData, totalItems } = await this.repo.getBreaches(options, client);

    const totalPages = totalItems > 0 ? Math.ceil(totalItems / options.limit) : 0;
    const hasNextPage = options.page < totalPages;
    const hasPreviousPage = options.page > 1 && totalItems > 0;

    // Format list items cleanly
    const data: BreachListItem[] = (rawData || []).map((item) => {
      let pwnCount: number | null = null;
      if (item.pwn_count != null) {
        const num = Number(item.pwn_count);
        pwnCount = isNaN(num) ? null : num;
      }

      return {
        id: String(item.id),
        title: String(item.title),
        slug: String(item.slug),
        domain: item.domain ? String(item.domain) : null,
        organization: item.organization ? String(item.organization) : null,
        breach_date: item.breach_date ? String(item.breach_date) : null,
        added_date: String(item.added_date),
        pwn_count: pwnCount,
        data_classes: Array.isArray(item.data_classes) ? item.data_classes : [],
        severity: item.severity,
        logo_url: item.logo_url ? String(item.logo_url) : null,
      };
    });

    return {
      data,
      pagination: {
        page: options.page,
        limit: options.limit,
        totalItems,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  /**
   * Retrieves detail of one verified and published breach by slug.
   * Returns null if nonexistent, unpublished, or unverified.
   */
  async getBreachDetail(
    slug: string,
    client?: SupabaseClient
  ): Promise<BreachDetailItem | null> {
    const raw = await this.repo.getBreachBySlug(slug.trim(), client);
    if (!raw) {
      return null;
    }

    let pwnCount: number | null = null;
    if (raw.pwn_count != null) {
      const num = Number(raw.pwn_count);
      pwnCount = isNaN(num) ? null : num;
    }

    return {
      id: String(raw.id),
      title: String(raw.title),
      slug: String(raw.slug),
      domain: raw.domain ? String(raw.domain) : null,
      organization: raw.organization ? String(raw.organization) : null,
      breach_date: raw.breach_date ? String(raw.breach_date) : null,
      added_date: String(raw.added_date),
      pwn_count: pwnCount,
      description: String(raw.description),
      data_classes: Array.isArray(raw.data_classes) ? raw.data_classes : [],
      severity: raw.severity,
      source_url: raw.source_url ? String(raw.source_url) : null,
      logo_url: raw.logo_url ? String(raw.logo_url) : null,
    };
  }
}

export const breachService = new BreachService();
