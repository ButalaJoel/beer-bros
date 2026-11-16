# Beer BROS

Premium social network for adults 18+ in Uganda: share your best social stories, follow accounts, search, message, and discover nearby people. **Good company. Your kind of night.**

## Current status
The signed-in preview connects account registration/login, stories, search, Discovery, matches, and inbox messaging to Neon PostgreSQL Free. The Render database is retained as a pre-cutover snapshot; new writes are not replicated back, so rollback requires reconciling Neon-only writes. Migration copied 2 users, 2 profiles, 1 story, 1 match, and 1 message; per-table counts matched. The live Vercel app read the migrated story/chat, then created a new story and chat message that both remained visible after reload. Public API health returned `ok`. Two-account live verification previously confirmed mutual interest, match creation, and a message round-trip. The card's horizontal pointer gesture and its accessible buttons call the same pass/interest handler; touch-device QA remains outstanding. QA accounts and posts are intentionally retained for testing. Preview URLs: [Vercel](https://beer-bros-nine.vercel.app) and [Render API](https://beer-bros-api.onrender.com). Recovery, profile editing, moderation console, and photo upload remain pending. The Render free database is scheduled to expire December 15, 2026.

## Security and data protection status
Baseline controls include Helmet security headers, allowlisted credentialed CORS, origin checks on API writes, a 32 KB JSON body cap, schema validation, bcrypt password hashing, HttpOnly cookies (Secure in production), authenticated server-side authorization, and rate limits: 120 requests per IP/minute, 20 auth requests per IP/15 minutes, and 20 Socket.IO sends per user/minute. HTTP and Socket.IO counters are process-local; they reset on restart and are not coordinated across instances. These are preview safeguards, not a launch-ready abuse-control system. Before public beta, add a shared rate-limit store and route-specific limits, account/session recovery and revocation, account export/deletion, retention rules, tested backup/restore, verified encryption and least-privilege database access, credential rotation, log redaction, incident response, and an independent security review. The service stores email, date of birth, password hash, profile data, stories, follows, matches, and messages; Discovery does not collect exact coordinates.

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
Backend routes require a PostgreSQL connection URL, `JWT_SECRET`, and exact `WEB_ORIGIN`. `NEON_DATABASE_URL` is a server-only runtime override; the API uses it and falls back to `DATABASE_URL` otherwise. The current Neon URL uses the project owner role; replace it with a least-privilege app role before public beta. Keep provider credentials in Render's environment or a local untracked environment file, never in Vercel client variables. To administer a database, sign in to its provider console and use its SQL editor or a trusted SQL client. Never paste a password or full connection URL into source control or chat. There is no Beer BROS admin login or in-product admin console; provider workspace access controls database administration. Neon Free is a staging database, not a production backup plan.

## Database migration
`npm run db:copy` applies the current schema to the destination, takes a consistent source snapshot, briefly queues source writes during the copy, inserts rows in foreign-key order, verifies row counts per table, and rolls back the target copy on errors. Set `SOURCE_DATABASE_URL` and `TARGET_DATABASE_URL` only in a local untracked `.env` or secure process environment. Render Free does not include an interactive shell, so `npm run db:copy:on-start` is used by the Render start command and stays disabled unless `COPY_DATABASE_ON_START=true`. It uses `DATABASE_URL` as source and `NEON_DATABASE_URL` as target, records a transactional idempotency marker, and completes before the API begins listening. The target rejects unrelated pre-existing data. Render currently retains the flag as `true`; the marker makes future restarts skip copying. Set it to `false` after the migration window. Verify the live API against Neon before removing the source database; retain Render's original database intact through the rollback window.

## Safety and privacy
This demo is for adults 18+. Do not use it to encourage excessive drinking. Exact user coordinates are not shown or used in the demo. Read [AGENTS.md](AGENTS.md), [docs/PRD.md](docs/PRD.md), and [docs/ROADMAP.md](docs/ROADMAP.md) before major development.
