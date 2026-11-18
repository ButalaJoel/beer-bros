import { createHmac } from 'node:crypto'
import type { ClientRateLimitInfo, Options, Store } from 'express-rate-limit'
import { pool } from './db.js'
import { getSessionSecret } from './auth.js'

/** Shared PostgreSQL-backed counters. Keys are HMACed so raw IP addresses and user IDs are not stored. */
export class PostgresRateLimitStore implements Store {
  private windowMs = 60_000
  /** A unique prefix tells express-rate-limit these are separate stores (avoids false ERR_ERL_DOUBLE_COUNT). */
  readonly prefix: string

  constructor(private readonly limiter: string) { this.prefix = `bb-${limiter}:` }

  init(options: Options): void {
    this.windowMs = options.windowMs
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const keyHash = this.hash(key)
    const result = await pool.query<{ hits: number; reset_at: Date }>(
      `INSERT INTO api_rate_limits (limiter, key_hash, hits, reset_at)
       VALUES ($1, $2, 1, now() + ($3::text || ' milliseconds')::interval)
       ON CONFLICT (limiter, key_hash) DO UPDATE SET
         hits = CASE WHEN api_rate_limits.reset_at <= now() THEN 1 ELSE api_rate_limits.hits + 1 END,
         reset_at = CASE WHEN api_rate_limits.reset_at <= now()
           THEN now() + ($3::text || ' milliseconds')::interval ELSE api_rate_limits.reset_at END
       RETURNING hits, reset_at`,
      [this.limiter, keyHash, this.windowMs],
    )
    return { totalHits: Number(result.rows[0].hits), resetTime: new Date(result.rows[0].reset_at) }
  }

  async decrement(key: string): Promise<void> {
    // hits must stay above zero (table CHECK), so drop the row instead of going to 0.
    const keyHash = this.hash(key)
    await pool.query('DELETE FROM api_rate_limits WHERE limiter=$1 AND key_hash=$2 AND hits <= 1', [this.limiter, keyHash])
    await pool.query('UPDATE api_rate_limits SET hits = hits - 1 WHERE limiter=$1 AND key_hash=$2 AND hits > 1', [this.limiter, keyHash])
  }

  async resetKey(key: string): Promise<void> {
    await pool.query('DELETE FROM api_rate_limits WHERE limiter=$1 AND key_hash=$2', [this.limiter, this.hash(key)])
  }

  async resetAll(): Promise<void> {
    await pool.query('DELETE FROM api_rate_limits WHERE limiter=$1', [this.limiter])
  }

  private hash(key: string): string {
    return createHmac('sha256', getSessionSecret()).update(key).digest('hex')
  }
}

/** Periodically remove expired counters without storing source IP addresses. */
export function startRateLimitCleanup(): NodeJS.Timeout {
  const timer = setInterval(() => {
    void pool.query("DELETE FROM api_rate_limits WHERE reset_at < now() - interval '1 day'")
      .catch((error: unknown) => console.error('Rate-limit cleanup failed:', error instanceof Error ? error.message : 'Unknown error'))
  }, 30 * 60_000)
  timer.unref()
  return timer
}

