# Security and deployment runbook

This runbook records the safe order for moving the hosted API from Neon owner credentials to a scoped application role.

## Database roles

The API must use a role created with SQL, because Neon grants `neon_superuser` membership to roles created through the Console, API, or default CLI flow. Create the application role from the Neon SQL Editor while connected as `neondb_owner`. Replace the password placeholder in the editor with a unique randomly generated password from a password manager. Do not paste it into chat, source control, or a ticket.

```sql
CREATE ROLE beer_bros_app WITH LOGIN PASSWORD '<GENERATE_A_UNIQUE_RANDOM_PASSWORD>';
GRANT CONNECT ON DATABASE neondb TO beer_bros_app;
GRANT USAGE ON SCHEMA public TO beer_bros_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO beer_bros_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO beer_bros_app;
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO beer_bros_app;
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO beer_bros_app;
```

The application role is intentionally DML-only. It cannot create or alter schema. The migration workflow uses a separate owner connection held as a GitHub Actions secret and is manually triggered. Add the Neon owner connection string to the private repository's **Settings → Secrets and variables → Actions** as `NEON_MIGRATION_DATABASE_URL`; never add it to Render or Vercel. Run **Actions → Apply database schema → Run workflow** before deploying a schema change. The workflow does not print the connection string.

After the role and schema exist, set Render's `NEON_DATABASE_URL` to a connection string for `beer_bros_app`, remove the owner `NEON_DATABASE_URL` and old source `DATABASE_URL` from the API service, then redeploy. Confirm `/api/health`, registration/login, story create/read, and message send/read. If validation fails, restore the previous environment value temporarily and rotate the exposed owner credential before inviting members.

Never use Neon Console's **Add role** button for the application role: Neon documents those roles as `neon_superuser` members. The current modal can be closed. Do not use any password previously shared in chat; rotate it if it was ever used.

## Shared rate limits

HTTP and Socket.IO counters are stored in `api_rate_limits` in PostgreSQL. Keys are HMACed with the application session secret before storage. The app applies 120 requests per IP per minute globally, 20 auth requests per IP per 15 minutes, and 60 state-changing requests per IP per minute. Socket messages are limited to 20 per account per minute. Expired buckets are periodically deleted.

This design shares counters between API processes and survives process restarts. It adds a small indexed write to requests; monitor Neon compute usage during closed beta. If the database is unavailable, rate-limit checks fail closed, so the API may reject requests until database connectivity returns.

## Backups and recovery

Neon Free's restore history is short and is not an independent export. Keep real user data out of public launch until an encrypted off-site backup destination, retention schedule, access policy, and successful restore drill are in place. Never place a database dump in GitHub, Vercel, or a public artifact. The Render database is only a pre-cutover snapshot and is scheduled to expire December 15, 2026; it is not a current backup.

Before beta, select a protected object-storage destination (or upgrade to a database plan with suitable recovery), automate encrypted `pg_dump` exports outside the API runtime, alert on failed backups, and restore a recent export into an isolated database. Record the operator, timestamp, checksum, and restore result without logging credentials or user content.

## Public beta gate

The preview is not ready for an open public launch until account recovery and deletion/export, email verification, block/report moderation operations, retention and privacy notice, incident response, backup restore drills, accessibility/device QA, and independent security review are complete. Keep registration limited to invited testers until then.

