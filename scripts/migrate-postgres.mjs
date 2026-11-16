import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import pg from 'pg'

const { Pool } = pg

const tables = [
  'users', 'profiles', 'follows', 'stories', 'story_likes', 'story_comments',
  'blocks', 'discovery_actions', 'matches', 'reports', 'conversations', 'messages',
]
const sourceUrl = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL
const targetUrl = process.env.TARGET_DATABASE_URL || process.env.NEON_DATABASE_URL

if (!sourceUrl || !targetUrl) {
  console.error('Set SOURCE_DATABASE_URL (or DATABASE_URL) and TARGET_DATABASE_URL (or NEON_DATABASE_URL) in the secure environment. Do not commit either value.')
  process.exit(2)
}
if (sourceUrl === targetUrl) {
  console.error('Source and target must be different PostgreSQL databases.')
  process.exit(2)
}

const sourcePool = new Pool({ connectionString: sourceUrl, max: 1, connectionTimeoutMillis: 15_000 })
const targetPool = new Pool({ connectionString: targetUrl, max: 1, connectionTimeoutMillis: 15_000 })
let sourceClient
let targetClient
let sourceTransaction = false
let targetTransaction = false
let alreadyCopied = false
const quoteIdentifier = (value) => `"${value.replaceAll('"', '""')}"`

try {
  const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'server', 'db', 'schema.sql')
  const schema = await readFile(schemaPath, 'utf8')
  targetClient = await targetPool.connect()

  // Create/upgrade the destination schema before the transactional data copy.
  await targetClient.query(schema)

  const markerTable = await targetClient.query("SELECT to_regclass('public.beer_bros_migration_state') AS table_name")
  if (markerTable.rows[0].table_name) {
    const marker = await targetClient.query("SELECT completed_at FROM public.beer_bros_migration_state WHERE id = 'render-to-neon-v1'")
    if (marker.rowCount) {
      console.log('PostgreSQL copy already completed; destination migration marker is present. No data was changed.')
      alreadyCopied = true
    }
  }

  if (!alreadyCopied) {
    sourceClient = await sourcePool.connect()

  // Keep a consistent source snapshot and briefly queue app writes during the copy.
    await sourceClient.query('BEGIN ISOLATION LEVEL REPEATABLE READ')
    sourceTransaction = true
    const quotedTables = tables.map((table) => `public.${quoteIdentifier(table)}`).join(', ')
    await sourceClient.query(`LOCK TABLE ${quotedTables} IN SHARE MODE`)

    const targetCounts = await Promise.all(tables.map(async (table) => {
      const result = await targetClient.query(`SELECT count(*)::int AS count FROM public.${quoteIdentifier(table)}`)
      return { table, count: result.rows[0].count }
    }))
    const occupied = targetCounts.filter((item) => item.count > 0)
    if (occupied.length) {
      throw new Error(`Destination is not empty (${occupied.map((item) => item.table).join(', ')}). No data was copied.`)
    }

    await targetClient.query('BEGIN')
    targetTransaction = true
    await targetClient.query(`CREATE TABLE IF NOT EXISTS public.beer_bros_migration_state (
      id text PRIMARY KEY,
      completed_at timestamptz NOT NULL DEFAULT now()
    )`)
    const counts = []
    for (const table of tables) {
      const rows = await sourceClient.query(`SELECT * FROM public.${quoteIdentifier(table)}`)
      if (rows.rowCount) {
        const columns = Object.keys(rows.rows[0])
        const columnSql = columns.map(quoteIdentifier).join(', ')
        const valueSql = columns.map((_, index) => `$${index + 1}`).join(', ')
        const insertSql = `INSERT INTO public.${quoteIdentifier(table)} (${columnSql}) VALUES (${valueSql})`
        for (const row of rows.rows) await targetClient.query(insertSql, columns.map((column) => row[column]))
      }
      counts.push({ table, count: rows.rowCount })
    }

    for (const { table, count } of counts) {
      const result = await targetClient.query(`SELECT count(*)::int AS count FROM public.${quoteIdentifier(table)}`)
      if (result.rows[0].count !== count) throw new Error(`Row-count verification failed for ${table}. Destination transaction was rolled back.`)
    }

    await targetClient.query("INSERT INTO public.beer_bros_migration_state (id) VALUES ('render-to-neon-v1')")
    await targetClient.query('COMMIT')
    targetTransaction = false
    await sourceClient.query('COMMIT')
    sourceTransaction = false
    console.log('PostgreSQL copy completed; source and destination row counts match:')
    for (const item of counts) console.log(`- ${item.table}: ${item.count}`)
    console.log('The source was not modified. Verify the destination API before removing the rollback database.')
  }
} catch (error) {
  if (targetTransaction) await targetClient?.query('ROLLBACK').catch(() => undefined)
  if (sourceTransaction) await sourceClient?.query('ROLLBACK').catch(() => undefined)
  console.error(`PostgreSQL copy stopped safely: ${error instanceof Error ? error.message : 'Unknown error'}`)
  process.exitCode = 1
} finally {
  sourceClient?.release()
  targetClient?.release()
  await Promise.all([sourcePool.end(), targetPool.end()])
}
