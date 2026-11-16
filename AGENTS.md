# Beer BROS — Project Source of Truth

## Product vision
Beer BROS is a premium, mobile-first social network for adults aged 18+ in Uganda, centred on drinks culture, personal stories, and meeting good company. Its home experience is a social feed where members publish their best drinking and socialising stories, follow accounts, discover topics and people through search, and message other members. A separate discovery feature helps members find nearby people open to socialising over a drink, express interest, and connect on mutual interest. The product should feel welcoming, safe, locally relevant, and polished; it is not a dating-only app and must not become an encouragement to binge drink.

## Product principles and safeguards
- Adults only: clearly state 18+ eligibility and design account-age checks into onboarding. Do not present the app as a drinking encouragement or a way to pressure others.
- Responsible socialising: promote moderation, consent, public first meetings, and report/block controls. No feature should reward excessive consumption.
- Protect location: use approximate distance/area only. Never display, store in client state, log, or expose another user's exact coordinates. Any future proximity matching must happen server-side using coarse geohash/distance bands and explicit location consent.
- Privacy and safety controls must be accessible from profile and match surfaces. Reporting/blocking and moderation are launch requirements for a real public release.
- Do not show seeded demonstration stories as real community content. Signed-out visitors see account access; authenticated stories and social actions use PostgreSQL through the API.
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
- Keep integrations behind typed boundaries and environment variables. The signed-in social feed and Discovery require the API; never silently fall back to fabricated remote data. Profiles appear in Discovery only after explicit opt-in.
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
- Beer BROS is a broader social network with a member story feed, follows, search, persistent direct messages, and a distinct discovery feature.
- The React client accesses `/api/*` through a same-origin Vercel rewrite to the Render API. Keep this rewrite before the SPA fallback. It avoids browser cross-site cookie restrictions and lets Render accept the Vercel origin.
- Registration/login use the API's signed HttpOnly session cookie and PostgreSQL. The server validates age 18+, hashes passwords, and validates writes. Never put database credentials, JWT secrets, or privileged keys in Vercel client variables.
- Authenticated Home and Search use PostgreSQL. Stories, likes, replies, follows, and conversations/messages persist through the API. Empty member data is a genuine empty state, not seeded demo content.
- Discovery uses real opted-in member profiles and persisted pass/interest actions. Right swipe and Interested signal interest; the recipient sees pending interest in Likes you; two interested actions create a match and conversation. Show broad area only, never precise location. Messaging is match-gated and the inbox polls for new messages.
- Hosting: Vercel `https://beer-bros-nine.vercel.app`; Render API `https://beer-bros-api.onrender.com`; Render Postgres `beer-bros-db`. Deploy from `main`. The Render free preview database is temporary and not suitable for production member data.
- Administration is through Render workspace/database access, not a Beer BROS admin login. No in-product moderation/admin console exists yet. Use Render's database Connect details with `psql` or a trusted SQL client; never disclose credentials in chat or commit them.
- Product name is “Beer BROS”; working tagline is “Good company. Your kind of night.”
- Discovery candidate cards come from opted-in member profiles. Pass/interest is persisted; mutual interest creates a match and a conversation. The member may swipe horizontally or use the accessible Pass/Interested buttons.
