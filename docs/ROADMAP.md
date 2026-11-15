# Beer BROS Roadmap

Status key: **Done** = implemented and checked; **Pending** = not yet implemented; **Blocked** = needs an external decision or dependency.

## Phase 0 — Project foundation (current)
- [x] Establish product source of truth and project workflow.
- [x] Set up React, Vite, TypeScript, Tailwind CSS, and Lucide React.
- [x] Create responsive Home story-feed demo, Search, inbox preview, and separate discovery experience.
- [x] Create private GitHub repository and push the initial project.
- [x] Seed Ugandan and imported drinks catalogue.
- [x] Run production build and resolve any errors.
- [ ] Configure brand assets and real profile photography.

## Phase 1 — Product validation and UX
- [x] Make Home story feed the primary experience; retain Discovery as a separate feature (demo-only interactions).
- [ ] Define story composition, follow states, search results, messaging privacy, and notification behavior.
- [ ] Validate onboarding, profile fields, discovery preferences, safety language, and Uganda localization with target users.
- [ ] Finalize visual identity, content tone, accessibility baseline, and privacy/terms copy.
- [ ] Define beta success and safety metrics.

## Phase 2 — Backend foundation on Render
- [ ] Create Render web service and PostgreSQL database; configure secrets and environment separation. Blueprint is prepared for a free preview; do not store real member data on the 30-day free database.
- [x] Implement TypeScript API, initial schema, registration/login, server-side 18+ gate, and profile/story/follow/search endpoints.
- [x] Add authenticated conversation/message routes and Socket.IO room authorization.
- [ ] Add account recovery, email verification, and account deletion workflow.
- [ ] Add photo storage provider and upload validation.
- [ ] Apply schema to a real database and add migration verification and broader security checks.

## Phase 3 — Discovery and matching
- [ ] Implement consent-based approximate location and server-side candidate selection.
- [ ] Implement persistent pass/interest records and mutual match creation.
- [ ] Add paging, empty/error/loading states, and abuse/rate protections.

## Phase 4 — Messaging and safety operations
- [ ] Add match-gated realtime messaging and notification preferences.
- [ ] Implement block/report/unmatch, moderation queue, escalation and response process.
- [ ] Add public-meetup and responsible-drinking safety surfaces.

## Phase 5 — Closed beta and launch readiness
- [ ] Test on target Android/iOS browsers and low-bandwidth conditions.
- [ ] Complete accessibility, privacy, security, legal, and performance reviews.
- [ ] Operate closed beta, review safety metrics, fix issues, then make a launch decision.

## Current status and blockers
- Local frontend and backend builds pass. API smoke checks pass for health, required authentication, the 18+ registration gate, and request-origin protection.
- Private repository exists at `https://github.com/ButalaJoel/beer-bros`; the local `main` branch tracks `origin/main`.
- Vercel dashboard control failed in this session, so no frontend deployment has been created.
- Backend code is not connected to the frontend; PostgreSQL schema has not been applied to a provisioned database.
- Render Free Postgres expires after 30 days. Choose a durable database plan before storing real accounts or conversations.
- No production discovery matching, moderation operations, account recovery, or deletion exists.
- Vercel + Render is the agreed hosting target. Production database will be PostgreSQL on Render unless a later requirement changes the decision.
