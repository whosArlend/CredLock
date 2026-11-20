import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { validateSupabaseEnv } from './env.js';

let cachedClient: SupabaseClient | null = null;

/**
 * Creates or retrieves the cached Supabase client instance.
 * Uses the server-side SUPABASE_SECRET_KEY (elevated/admin credentials).
 * Never expose this client or its credentials to the frontend.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!cachedClient) {
    const config = validateSupabaseEnv();
    cachedClient = createClient(config.SUPABASE_URL, config.SUPABASE_SECRET_KEY, {
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
