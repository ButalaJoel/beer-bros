import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL must be configured')

export const pool = new Pool({
  connectionString,
  max: Number(process.env.DB_POOL_SIZE ?? 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})

pool.on('error', (error) => console.error('Unexpected PostgreSQL pool error:', error.message))
