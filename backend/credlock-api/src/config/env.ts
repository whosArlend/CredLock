import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file if available
dotenv.config();

/**
 * Base environment schema for general API server startup.
 * Allows basic server liveness even if database credentials are not yet configured.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().positive().default(4000),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL').optional(),
  SUPABASE_ANON_KEY: z
    .string()
    .min(10, 'SUPABASE_ANON_KEY must be a valid non-empty key')
    .optional(),
  SUPABASE_SECRET_KEY: z
    .string()
    .min(1, 'SUPABASE_SECRET_KEY cannot be empty')
    .optional(),
  // Distributed rate-limiting via Upstash Redis REST API
  UPSTASH_REDIS_REST_URL: z
    .string()
    .url('UPSTASH_REDIS_REST_URL must be a valid URL (e.g. https://...upstash.io)')
    .optional(),
  UPSTASH_REDIS_REST_TOKEN: z
    .string()
    .min(10, 'UPSTASH_REDIS_REST_TOKEN must be a non-empty token string')
    .optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates distributed rate-limiting environment configuration.
 * In production, if distributed rate-limiting is required, both URL and TOKEN must be present.
 */
export function isDistributedRateLimitConfigured(config: EnvConfig = env): boolean {
  return Boolean(
    config.UPSTASH_REDIS_REST_URL &&
    config.UPSTASH_REDIS_REST_TOKEN &&
    config.UPSTASH_REDIS_REST_URL.length > 0 &&
    config.UPSTASH_REDIS_REST_TOKEN.length >= 10
  );
}

/**
 * Asserts production configuration readiness for rate-limiting.
 * Throws a descriptive configuration error if running in production without distributed Redis credentials.
 */
export function validateProductionRateLimitConfig(config: EnvConfig = env): void {
  if (config.NODE_ENV === 'production' && !isDistributedRateLimitConfigured(config)) {
    throw new Error(
      'Production configuration error: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be configured ' +
      'in production to provide distributed serverless rate limiting across Vercel instances. ' +
      'In-memory fallback is strictly restricted to development and test environments.'
    );
  }
}

/**
 * Strict schema specifically for Supabase database operations.
 * Enforces least-privilege by prioritizing SUPABASE_ANON_KEY (public read-only access subject to RLS),
 * with backward-compatible fallback to SUPABASE_SECRET_KEY if anon key is not yet configured.
 */
export const supabaseEnvSchema = z
  .object({
    SUPABASE_URL: z
      .string({ required_error: 'SUPABASE_URL is required for database operations' })
      .url('SUPABASE_URL must be a valid URL (e.g., https://xyz.supabase.co)'),
    SUPABASE_ANON_KEY: z
      .string()
      .min(10, 'SUPABASE_ANON_KEY must be a valid non-empty public key')
      .optional(),
    SUPABASE_SECRET_KEY: z
      .string()
      .min(10, 'SUPABASE_SECRET_KEY must be a valid non-empty secret key')
      .optional(),
  })
  .refine(
    (data) => Boolean(data.SUPABASE_ANON_KEY || data.SUPABASE_SECRET_KEY),
    {
      message: 'Either SUPABASE_ANON_KEY (recommended) or SUPABASE_SECRET_KEY must be provided',
      path: ['SUPABASE_ANON_KEY'],
    }
  );

export type SupabaseEnvConfig = z.infer<typeof supabaseEnvSchema>;

/**
 * Validates Supabase configuration from an environment source.
 * Throws a ZodError if configuration is missing or invalid.
 */
export function validateSupabaseEnv(
  source: Record<string, unknown> = process.env
): SupabaseEnvConfig {
  return supabaseEnvSchema.parse(source);
}

/**
 * Loads and validates general server environment configuration.
 */
export function loadEnv(customEnv?: Record<string, unknown>): EnvConfig {
  const source = customEnv || process.env;
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const errorDetails = JSON.stringify(result.error.format(), null, 2);
    console.error(`Invalid environment configuration:\n${errorDetails}`);
    throw new Error(`Environment configuration validation failed: ${result.error.message}`);
  }
  return result.data;
}

export const env = loadEnv();
