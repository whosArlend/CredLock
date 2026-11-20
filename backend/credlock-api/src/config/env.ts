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
  SUPABASE_SECRET_KEY: z
    .string()
    .min(1, 'SUPABASE_SECRET_KEY cannot be empty')
    .optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Strict schema specifically for Supabase database operations.
 * Enforces that both SUPABASE_URL and SUPABASE_SECRET_KEY (format: sb_secret_...) are present and valid.
 */
export const supabaseEnvSchema = z.object({
  SUPABASE_URL: z
    .string({ required_error: 'SUPABASE_URL is required for database operations' })
    .url('SUPABASE_URL must be a valid URL (e.g., https://xyz.supabase.co)'),
  SUPABASE_SECRET_KEY: z
    .string({ required_error: 'SUPABASE_SECRET_KEY is required for database operations' })
    .min(10, 'SUPABASE_SECRET_KEY must be a valid non-empty secret key'),
});

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
