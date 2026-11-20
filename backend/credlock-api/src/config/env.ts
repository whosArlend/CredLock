import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file if available
dotenv.config();

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().positive().default(4000),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

export type EnvConfig = z.infer<typeof envSchema>;

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
