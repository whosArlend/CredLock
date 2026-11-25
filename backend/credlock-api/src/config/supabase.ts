import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { validateSupabaseEnv } from './env.js';

let cachedClient: SupabaseClient | null = null;

/**
 * Resolves the Supabase client API key adhering to the Principle of Least Privilege:
 * 1. Prioritizes SUPABASE_ANON_KEY (public read-only access subject to PostgreSQL RLS).
 * 2. Falls back to SUPABASE_SECRET_KEY for backward-compatibility if anon key is not set.
 */
export function resolveSupabaseApiKey(config: ReturnType<typeof validateSupabaseEnv>): {
  key: string;
  isLeastPrivilege: boolean;
} {
  if (config.SUPABASE_ANON_KEY && config.SUPABASE_ANON_KEY.length >= 10) {
    return {
      key: config.SUPABASE_ANON_KEY,
      isLeastPrivilege: true,
    };
  }

  return {
    key: config.SUPABASE_SECRET_KEY as string,
    isLeastPrivilege: false,
  };
}

/**
 * Creates or retrieves the cached Supabase client instance.
 * Employs the public anon key (least privilege) whenever configured,
 * ensuring database reads are naturally restricted by Row Level Security (RLS).
 */
export function getSupabaseClient(): SupabaseClient {
  if (!cachedClient) {
    const config = validateSupabaseEnv();
    const { key, isLeastPrivilege } = resolveSupabaseApiKey(config);

    if (!isLeastPrivilege && process.env.NODE_ENV !== 'test') {
      console.warn(
        '[Security Notice] CredLock API is using SUPABASE_SECRET_KEY (admin credentials). ' +
        'Configure SUPABASE_ANON_KEY to enforce the Principle of Least Privilege with Row Level Security.'
      );
    }

    cachedClient = createClient(config.SUPABASE_URL, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return cachedClient;
}

/**
 * Allows injecting or resetting a mock Supabase client for testing purposes.
 */
export function setSupabaseClient(client: SupabaseClient | null): void {
  cachedClient = client;
}

export interface DatabaseHealthResult {
  connected: boolean;
  latencyMs?: number;
  error?: string;
}

/**
 * Verifies live database connectivity using a lightweight query on the `breaches` table.
 * Queries at most 1 ID without fetching full seed records or mutating data.
 */
export async function checkDatabaseConnection(
  client?: SupabaseClient
): Promise<DatabaseHealthResult> {
  const startTime = Date.now();
  try {
    const dbClient = client || getSupabaseClient();
    const { error } = await dbClient
      .from('breaches')
      .select('id')
      .limit(1);

    if (error) {
      return {
        connected: false,
        error: error.message,
      };
    }

    const latencyMs = Date.now() - startTime;
    return {
      connected: true,
      latencyMs,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database connection error';
    return {
      connected: false,
      error: message,
    };
  }
}
