# Beer BROS

Premium social network for adults 18+ in Uganda: share your best social stories, follow accounts, search, message, and discover nearby people. **Good company. Your kind of night.**

## Current status
Initial local demo: responsive Home story feed, local story posting/reactions/replies/follows, Search, demo inbox, and separate discovery with seeded profiles and drinks. Those UI actions reset on reload. A Render API scaffold now includes PostgreSQL-backed account, feed, follow, search, report/block, and conversation routes with authenticated Socket.IO message delivery. The frontend is not connected to the API, and no database or hosted service exists yet.

## Technologies
- React 18, TypeScript, Vite
- Tailwind CSS
- Lucide React
- Express, PostgreSQL, and Socket.IO API scaffold
- Vercel frontend config and Render Blueprint (not connected)

## GitHub
Private source repository: [ButalaJoel/beer-bros](https://github.com/ButalaJoel/beer-bros). The local `main` branch tracks `origin/main`.

## Setup
Requirements: Node.js 20+ and npm.

```sh
npm install
npm run dev
npm run server:dev
```

Run the frontend and API in separate terminals. Open the Vite URL. Copy `.env.example` to `.env` and configure a local PostgreSQL database before using database-backed routes. Placeholder values are for local setup only.

## Scripts
- `npm run dev` — start Vite development server
- `npm run server:dev` — start API in watch mode
- `npm run server:build` — type-check and compile API
- `npm run server:start` — run compiled API
- `npm run db:migrate` — create/update PostgreSQL tables
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
```

## Configuration
The local story demo needs no configuration. Backend routes require `DATABASE_URL`, `JWT_SECRET`, and `WEB_ORIGIN`. Production configuration separates Vercel frontend settings from Render API/database secrets. Never put database credentials, signing keys, or privileged tokens in `VITE_*` variables. No hosted service is connected. `render.yaml` selects free preview resources; Render’s free Postgres expires after 30 days, so it is unsuitable for real member data or launch.

## Safety and privacy
This demo is for adults 18+. Do not use it to encourage excessive drinking. Exact user coordinates are not shown or used in the demo. Read [AGENTS.md](AGENTS.md), [docs/PRD.md](docs/PRD.md), and [docs/ROADMAP.md](docs/ROADMAP.md) before major development.
