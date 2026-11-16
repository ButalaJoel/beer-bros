import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

if (process.env.COPY_DATABASE_ON_START !== 'true') {
  console.log('Startup database copy is disabled.')
  process.exit(0)
}

const sourceUrl = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL
const targetUrl = process.env.TARGET_DATABASE_URL || process.env.NEON_DATABASE_URL
if (!sourceUrl || !targetUrl) {
  console.error('Startup database copy requires source and target database URLs in the service environment.')
  process.exit(2)
}

const script = fileURLToPath(new URL('./migrate-postgres.mjs', import.meta.url))
const result = spawnSync(process.execPath, [script], {
  env: {
    ...process.env,
    SOURCE_DATABASE_URL: sourceUrl,
    TARGET_DATABASE_URL: targetUrl,
  },
  stdio: 'inherit',
})

if (result.error) {
  console.error('Could not start the PostgreSQL copy process.')
  process.exit(1)
}
if (result.status !== 0) process.exit(result.status ?? 1)
