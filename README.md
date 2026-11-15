# Beer BROS

Premium social network for adults 18+ in Uganda: share your best social stories, follow accounts, search, message, and discover nearby people. **Good company. Your kind of night.**

## Current status
Initial local demo: responsive discovery dashboard, seeded profile cards and drinks catalogue, and in-memory pass/interest interactions. This first screen is only one feature of the intended product. The primary signed-in experience will be a story feed with follows, search, messaging, and separate nearby discovery. Local demo actions do not persist or share. The production build has not been verified because npm dependencies could not be installed in this environment (registry access unavailable); `npm run build` currently stops because TypeScript is not installed.

## Technologies
- React 18, TypeScript, Vite
- Tailwind CSS
- Lucide React
- Vercel planned for frontend (not connected)
- Render planned for TypeScript API and PostgreSQL (not connected)

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
