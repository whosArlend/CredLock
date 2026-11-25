import type { Store, Options, IncrementResponse } from 'express-rate-limit';

export interface UpstashRedisConfig {
  url: string;
  token: string;
  prefix?: string;
  timeoutMs?: number;
}

/**
 * Custom express-rate-limit Store implementation backed by Upstash Redis REST API.
 * Uses native Node.js global fetch for zero-dependency, serverless HTTP-based operations.
 *
 * Atomic increment and expiration algorithm via Redis multi-exec:
 * 1. INCR <key>
 * 2. PEXPIRE <key> <windowMs> NX (only sets expiry if key has no TTL yet)
 * 3. PTTL <key>
 *
 * This guarantees atomic counter increment and precise window expiration across
 * all distributed serverless container instances.
 */
export class UpstashRedisStore implements Store {
  public localKeys = false;
  public prefix: string;
  private url: string;
  private token: string;
  private windowMs: number = 15 * 60 * 1000;
  private timeoutMs: number;

  constructor(config: UpstashRedisConfig) {
    this.url = config.url.replace(/\/+$/, '');
    this.token = config.token;
    this.prefix = config.prefix || 'credlock:rl:';
    this.timeoutMs = config.timeoutMs || 4000;
  }

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  private buildKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Executes a pipeline of commands via Upstash Redis REST `/pipeline` endpoint.
   */
  private async executePipeline<T = unknown>(commands: unknown[][]): Promise<T[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.url}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commands),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Upstash Redis HTTP error: ${response.status} ${response.statusText}`);
      }

      const results = (await response.json()) as Array<{ result?: unknown; error?: string }>;

      for (const res of results) {
        if (res.error) {
          throw new Error(`Upstash Redis pipeline command failed: ${res.error}`);
        }
      }

      return results.map((r) => r.result) as T[];
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Increments hit counter for client key and calculates reset time based on TTL.
   */
  async increment(key: string): Promise<IncrementResponse> {
    const fullKey = this.buildKey(key);

    // Pipeline:
    // 1. INCR key -> returns new count
    // 2. PEXPIRE key windowMs NX -> sets expiration only if key does not have an active TTL
    // 3. PTTL key -> returns remaining milliseconds until expiration
    const results = await this.executePipeline<number>([
      ['INCR', fullKey],
      ['PEXPIRE', fullKey, this.windowMs, 'NX'],
      ['PTTL', fullKey],
    ]);

    const totalHits = results[0] ?? 1;
    const remainingPttl = results[2];

    const resetTime =
      typeof remainingPttl === 'number' && remainingPttl > 0
        ? new Date(Date.now() + remainingPttl)
        : new Date(Date.now() + this.windowMs);

    return {
      totalHits,
      resetTime,
    };
  }

  /**
   * Decrements hit counter for a client key (e.g. on skipped routes).
   */
  async decrement(key: string): Promise<void> {
    const fullKey = this.buildKey(key);
    await this.executePipeline([['DECR', fullKey]]);
  }

  /**
   * Resets hit counter for a client key.
   */
  async resetKey(key: string): Promise<void> {
    const fullKey = this.buildKey(key);
    await this.executePipeline([['DEL', fullKey]]);
  }
}
