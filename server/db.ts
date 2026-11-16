import { Pool } from 'pg'

// Allow a staged provider cutover while retaining DATABASE_URL as a rollback source.
const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL must be configured')

export const pool = new Pool({
  connectionString,
  max: Number(process.env.DB_POOL_SIZE ?? 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})

pool.on('error', (error) => console.error('Unexpected PostgreSQL pool error:', error.message))
