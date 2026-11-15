# Beer BROS — Project Source of Truth

## Product vision
Beer BROS is a premium, mobile-first social network for adults aged 18+ in Uganda, centred on drinks culture, personal stories, and meeting good company. Its home experience is a social feed where members publish their best drinking and socialising stories, follow accounts, discover topics and people through search, and message other members. A separate discovery feature helps members find nearby people open to socialising over a drink, express interest, and connect on mutual interest. The product should feel welcoming, safe, locally relevant, and polished; it is not a dating-only app and must not become an encouragement to binge drink.

## Product principles and safeguards
- Adults only: clearly state 18+ eligibility and design account-age checks into onboarding. Do not present the app as a drinking encouragement or a way to pressure others.
- Responsible socialising: promote moderation, consent, public first meetings, and report/block controls. No feature should reward excessive consumption.
- Protect location: use approximate distance/area only. Never display, store in client state, log, or expose another user's exact coordinates. Any future proximity matching must happen server-side using coarse geohash/distance bands and explicit location consent.
- Privacy and safety controls must be accessible from profile and match surfaces. Reporting/blocking and moderation are launch requirements for a real public release.
- The local demo is not a production service. Do not imply that demo likes or profiles are persisted or visible to other people.
- Never copy Tinder branding, assets, or proprietary code. Beer BROS has its own identity and visual language.

## Design direction
- Premium dark interface: deep charcoal/forest surfaces, vivid fresh lime accent, restrained warm cream text.
- Large profile photography, rounded cards, high-quality typography, subtle shadows and smooth, reduced-motion-aware transitions.
- Navigation stays minimal and responsive. Prioritize thumb reach and clear touch targets on phones; enhance for desktop.
- Keep the interface calm and editorial. Avoid clutter, neon overload, and alcohol-as-party-pressure messaging.

## Technical architecture
- Client: React + TypeScript + Vite, Tailwind CSS, Lucide React icons; deploy the frontend through Vercel.
- Backend: Node.js + TypeScript API service on Render, with PostgreSQL for accounts, profiles, follows, stories, reactions, conversations, moderation records, and discovery actions. Use WebSockets (Socket.IO or equivalent) for authorized live chat after the REST/API foundation is secure.
- Authentication: server-verified email/password or chosen OAuth provider, secure session handling, age eligibility gate, account recovery, and rate limiting. Never trust client-provided identity or authorization.
- Keep backend services under `server/` with route, service, repository, middleware, schema/migration, and test layers. Client feature modules stay under `src/features/`; typed API clients under `src/lib/api/`.
- Keep integrations behind typed boundaries and environment variables. Local demo must remain usable without production credentials while being clearly distinguished from real account and social actions.
- Do not put secrets in the client bundle. Privileged keys and database credentials belong only in Render environment variables. Vercel receives only explicitly public frontend configuration.
- The current backend uses a Render-hosted Node API and PostgreSQL. Do not add a Supabase dependency unless the architecture is explicitly changed and documented.
- Use strict TypeScript, semantic HTML, accessible labels/focus states, responsive layouts, and reduced-motion support.
- Keep product requirements in `docs/PRD.md`, milestones/status in `docs/ROADMAP.md`, and setup/current state in `README.md`. Update all relevant docs when decisions or status change.

## Development workflow
1. Read this file, `docs/PRD.md`, `docs/ROADMAP.md`, and `README.md` at the start of each major session.
2. Inspect the current repository and Git status before edits. Preserve existing implemented functionality; make additive, focused changes.
3. For a feature, update its source-of-truth requirements/status, implement, then run the relevant checks requested by the task (typecheck/build/tests) and fix failures.
4. Keep demo data clearly marked and deterministic. Document external setup requirements and never claim untested behavior works.
5. Before handoff, summarize completed, pending, blocked, validation, and configuration status in the README/roadmap.

## Current implementation decisions
- Existing initial release is a client-side local discovery demo with in-memory swipe state and seeded profiles/catalogue. Refresh resets demo decisions.
- The product direction is now a broader social network with home feed, stories, follows, search, messaging, and a complementary discovery feature.
- A TypeScript Express/PostgreSQL/Socket.IO API scaffold now exists under `server/`, including account, feed, follow, search, report/block, and conversation routes. It builds and has a limited API smoke check. The frontend is not yet wired to this API; no real database has been provisioned, and the backend must not be described as production-ready.
- Hosting target: Vercel frontend and Render API/PostgreSQL. A Render free preview Blueprint, API service, and temporary database now exist and deploy from `main`; Vercel import is pending account email verification. The frontend has not been connected to the API and the preview is not production-ready.
- Product name is “Beer BROS”; working tagline is “Good company. Your kind of night.”
- Initial discovery is a single-profile card with pass/interest controls; a mutual match is simulated only in the seeded demo when applicable.
