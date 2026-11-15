# Beer BROS

Premium social network for adults 18+ in Uganda: share your best social stories, follow accounts, search, message, and discover nearby people. **Good company. Your kind of night.**

## Current status
Initial local demo: responsive Home story feed, story composer, local reactions/replies/follows, Search, demo inbox, and a separate discovery dashboard with seeded profiles and drinks. All actions are in-memory and reset on reload. No real account or messages exist yet. The production build has not been verified because npm installation is timing out in this environment; `npm run build` currently stops because TypeScript is not installed.

## Technologies
- React 18, TypeScript, Vite
- Tailwind CSS
- Lucide React
- Vercel planned for frontend (not connected)
- Render planned for TypeScript API and PostgreSQL (not connected)

## GitHub
Private source repository: [ButalaJoel/beer-bros](https://github.com/ButalaJoel/beer-bros). The local `main` branch tracks `origin/main`.

## Setup
Requirements: Node.js 20+ and npm.

```sh
npm install
npm run dev
```

Open the local URL shown by Vite.

## Scripts
- `npm run dev` — start Vite development server
- `npm run build` — TypeScript check and production build
- `npm run preview` — serve the production build locally

## Structure
```text
src/
  app/          App composition
  components/   Reusable interface elements
  data/         Demo profiles and drink catalogue
  features/     Discovery flow
  lib/          Integration boundaries/utilities
  types/        Shared domain models
```

## Configuration
No environment variables are needed for the local demo. Production configuration will separate Vercel frontend settings from Render API/database secrets. Never put database credentials, signing keys, or privileged tokens in `VITE_*` variables. No production service is connected yet.

## Safety and privacy
This demo is for adults 18+. Do not use it to encourage excessive drinking. Exact user coordinates are not shown or used in the demo. Read [AGENTS.md](AGENTS.md), [docs/PRD.md](docs/PRD.md), and [docs/ROADMAP.md](docs/ROADMAP.md) before major development.
