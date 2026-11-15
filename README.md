# Beer BROS

Premium social network for adults 18+ in Uganda: share your best social stories, follow accounts, search, message, and discover nearby people. **Good company. Your kind of night.**

## Current status
The signed-in preview now connects account registration/login, stories, likes, replies, follows, search, and inbox messages to the Render PostgreSQL API. Vercel routes `/api/*` to Render. Preview URLs: [Vercel](https://beer-bros-nine.vercel.app) and [Render API](https://beer-bros-api.onrender.com). Render reports the API Live and database migration complete. Deploy this commit to verify the Vercel proxy and browser session end to end. Discovery swipes remain demo-only; recovery, profile editing, moderation console, and live Socket.IO client are pending. The Render free database is temporary and must not hold real public user data.

## Technologies
- React 18, TypeScript, Vite
- Tailwind CSS
- Lucide React
- Express, PostgreSQL, and Socket.IO API scaffold
- Vercel Hobby front end: [beer-bros-nine.vercel.app](https://beer-bros-nine.vercel.app)
- Render free preview Blueprint: `beer-bros-preview`, service `beer-bros-api`, database `beer-bros-db` (`https://beer-bros-api.onrender.com`)

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
Backend routes require `DATABASE_URL`, `JWT_SECRET`, and exact `WEB_ORIGIN`. Keep these in Render's environment, never in Vercel client variables. To administer PostgreSQL, sign in to Render, open `beer-bros-db`, choose **Connect**, and use its PSQL command/URL with `psql`, pgAdmin, or another trusted SQL client. Never paste the password or full connection URL into source control or chat. There is no Beer BROS admin login or in-product admin console yet; Render workspace access controls database administration. The free preview database expires after 30 days and must be replaced with a durable plan before inviting public users.

## Safety and privacy
This demo is for adults 18+. Do not use it to encourage excessive drinking. Exact user coordinates are not shown or used in the demo. Read [AGENTS.md](AGENTS.md), [docs/PRD.md](docs/PRD.md), and [docs/ROADMAP.md](docs/ROADMAP.md) before major development.
