import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Retrieves the public Supabase configuration safely across Vite and Node.js runtimes.
 * Under zero-knowledge principles, only the public project URL and public
 * anonymous key are ever accessible to client-side bundles.
 */
export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  let url = '';
  let anonKey = '';

  // 1. Try Vite import.meta.env
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
    if (metaEnv?.VITE_SUPABASE_URL) url = metaEnv.VITE_SUPABASE_URL.trim();
    if (metaEnv?.VITE_SUPABASE_ANON_KEY) anonKey = metaEnv.VITE_SUPABASE_ANON_KEY.trim();
  } catch {
    // Fall through to process.env
  }

  // 2. Try Node process.env (for tests and headless runners)
  if (!url || !anonKey) {
    try {
      if (typeof process !== 'undefined' && process.env) {
        if (process.env.VITE_SUPABASE_URL) url = process.env.VITE_SUPABASE_URL.trim();
        if (process.env.VITE_SUPABASE_ANON_KEY) anonKey = process.env.VITE_SUPABASE_ANON_KEY.trim();
      }
    } catch {
      // Ignored in strict sandboxed browser environments
    }
  }

  const isConfigured = Boolean(
    url &&
    url !== 'https://your-project.supabase.co' &&
    anonKey &&
    anonKey !== 'your-supabase-public-anon-key-here' &&
    url.startsWith('https://')
  );

  return { url, anonKey, isConfigured };
}

let cachedClient: SupabaseClient | null = null;

/**
 * Returns the initialized Supabase client singleton, or null if configuration
 * is absent in the current environment.
 */
export function getSupabase(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    return null;
  }

  cachedClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'credlock-auth-token',
    },
  });

  return cachedClient;
}

/**
 * Allows overriding or resetting the Supabase client for testing and mocking.
 */
export function setSupabaseClient(client: SupabaseClient | null): void {
  cachedClient = client;
}

/**
 * Helper to check if Supabase is properly configured in the current runtime.
 */
export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig().isConfigured;
}
