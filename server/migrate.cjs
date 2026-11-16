const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { Pool } = require('pg')
require('dotenv').config()

const connectionString = process.env.NEON_MIGRATION_DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is required to run migrations.')
  process.exit(1)
}

async function migrate() {
  const pool = new Pool({ connectionString })
  try {
    const sql = readFileSync(resolve(__dirname, 'db/schema.sql'), 'utf8')
    await pool.query(sql)
    console.log('Beer BROS database schema is up to date.')
  } finally {
    await pool.end()
  }
}

migrate().catch((error) => {
  console.error('Database migration failed:', error.message)
  process.exit(1)
})
