# Beer BROS

Premium social network for adults 18+ in Uganda: share your best social stories, follow accounts, search, message, and discover nearby people. **Good company. Your kind of night.**

## Current status
The signed-in preview connects account registration/login, stories, search, Discovery, matches, and inbox messaging to Neon PostgreSQL Free. The Render database is retained as a pre-cutover snapshot; new writes are not replicated back, so rollback requires reconciling Neon-only writes. Migration copied 2 users, 2 profiles, 1 story, 1 match, and 1 message; per-table counts matched. The live Vercel app read the migrated story/chat, then created a new story and chat message that both remained visible after reload. Public API health returned `ok`. Two-account live verification previously confirmed mutual interest, match creation, and a message round-trip. The card's horizontal pointer gesture and its accessible buttons call the same pass/interest handler; touch-device QA remains outstanding. QA accounts and posts are intentionally retained for testing. Preview URLs: [Vercel](https://beer-bros-nine.vercel.app) and [Render API](https://beer-bros-api.onrender.com). Recovery, profile editing, moderation console, and photo upload remain pending. The Render free database is scheduled to expire December 15, 2026. Shared rate limits and a manual GitHub Actions schema migration path are now deployed; the live API health endpoint returned `ok` after rollout. Verify the 429 thresholds and restart persistence before relying on them for beta.

## Beta admin console
Admin features are implemented and deployed: announcements for signed-in members, an admin report queue with status changes, and metadata-only audit entries. Access is controlled by the server `ADMIN_EMAILS` allowlist on Render. Owner-reported Neon migration and Render allowlist configuration completed; Render deploy succeeded, Vercel `/api/health` returned `ok`, the signed-in announcements endpoint returned an empty list, and the non-admin admin endpoint returned 403 as expected. Still confirm the owner account sees the Admin tab after a fresh sign-in. Neon Free remains staging; complete backup/recovery, privacy/legal review, and safety operations before a broad public beta.

## Security and data protection status
Baseline controls include Helmet security headers, allowlisted credentialed CORS, origin checks on API writes, a 32 KB JSON body cap, schema validation, bcrypt password hashing, HttpOnly cookies (Secure in production), authenticated server-side authorization, and shared PostgreSQL-backed limits: 120 requests per IP/minute, 20 auth requests per IP/15 minutes, 60 state-changing requests per IP/minute, and 20 Socket.IO sends per account/minute. The API is live on the SQL-created `beer_bros_app` role; health returns `ok`, and unauthenticated story requests return the expected authentication error. The 429 thresholds and counter persistence across restart still need live verification. Before public beta, finish account/session recovery and revocation, account export/deletion, retention rules, tested independent backup/restore, verified encryption, log redaction, incident response, and an independent security review. The service stores email, date of birth, password hash, profile data, stories, follows, matches, and messages; Discovery does not collect exact coordinates.

## Technologies
- React 18, TypeScript, Vite
- Tailwind CSS
- Lucide React
- Express, PostgreSQL, and Socket.IO API scaffold
- Vercel Hobby front end: [beer-bros-nine.vercel.app](https://beer-bros-nine.vercel.app)
- Render free preview Blueprint: `beer-bros-preview`, service `beer-bros-api`, API `https://beer-bros-api.onrender.com`; Neon Free project `my-first-project` (`neondb`, Frankfurt) is the active staging database. Render Postgres `beer-bros-db` is retained as a pre-cutover snapshot.

## GitHub
Private source repository: [ButalaJoel/beer-bros](https://github.com/ButalaJoel/beer-bros). The local `main` branch tracks `origin/main`; Vercel and Render deploy from `main`.

## Setup
Requirements: Node.js 20+ and npm.

```sh
npm install
npm run dev
npm run server:dev
```

Run the frontend and API in separate terminals. Copy `.env.example` to `.env` and configure a local PostgreSQL database and a 32+ character `JWT_SECRET`. For local Vite development, set `VITE_API_URL` to the API origin and configure `WEB_ORIGIN` to the Vite origin. Vercel uses a same-origin `/api/*` rewrite to Render.

## Scripts
- `npm run dev` — start Vite development server
- `npm run server:dev` — start API in watch mode
- `npm run server:build` — type-check and compile API
- `npm run server:start` — run compiled API
- `npm run db:migrate` — create/update PostgreSQL tables
- `npm run db:copy` — copy app tables from `SOURCE_DATABASE_URL` into an empty `TARGET_DATABASE_URL`
- `npm run build` — TypeScript check and production build
- `npm run preview` — serve the production build locally
- `npm run test:api-smoke` — check API health, auth gating, 18+ age gate, and request-origin protection

## Structure
```text
src/
  app/          App composition
  components/   Reusable interface elements
  data/         Demo profiles and drink catalogue
  features/     Discovery flow
  lib/          Integration boundaries/utilities
  types/        Shared domain models
server/
  auth.ts       Session and authorization middleware
  routes.ts     Account, story, follow, search, report, block, and chat APIs
  index.ts      Express and Socket.IO server
  db/schema.sql PostgreSQL schema
scripts/
  migrate-postgres.mjs Safe PostgreSQL source-to-empty-target copy
```

## Configuration
Backend routes require a PostgreSQL connection URL, `JWT_SECRET`, and exact `WEB_ORIGIN`. `NEON_DATABASE_URL` is server-only. The API must use a scoped SQL-created `beer_bros_app` role; schema DDL runs through the manually triggered GitHub Actions workflow using a separate owner secret. Keep provider credentials in Render/GitHub Actions secret storage or a local untracked environment file, never in Vercel client variables, source control, or chat. See [the security runbook](docs/SECURITY_RUNBOOK.md). Member registration is open to eligible adults with unique email addresses and individual passwords. The admin console is restricted by the Render `ADMIN_EMAILS` allowlist; it is not accessible to arbitrary member credentials. Neon Free is a staging database, not a production backup plan.

## Database administration
Sign in to [Neon](https://console.neon.tech), open the `my-first-project` project, and use its SQL Editor for administrative queries. The database owner role is `neondb_owner`; the API now connects as the SQL-created, DML-only `beer_bros_app` role. Keep owner credentials outside the API runtime. Configure `NEON_MIGRATION_DATABASE_URL` as a GitHub Actions secret before the next schema change so the manual migration workflow can run. The old Render database is a pre-cutover snapshot; changes written to Neon are not copied back.

## Database migration
`npm run db:copy` is a guarded one-time migration tool and is no longer part of Render startup. `npm run db:migrate` is run only through the manually triggered GitHub Actions workflow with the `NEON_MIGRATION_DATABASE_URL` secret. The API process receives only the scoped `NEON_DATABASE_URL`. Keep the Render Postgres instance as a pre-cutover snapshot through its expiry; it does not contain new writes.

## Safety and privacy
This demo is for adults 18+. Do not use it to encourage excessive drinking. Exact user coordinates are not shown or used in the demo. Read [AGENTS.md](AGENTS.md), [docs/PRD.md](docs/PRD.md), and [docs/ROADMAP.md](docs/ROADMAP.md) before major development.
