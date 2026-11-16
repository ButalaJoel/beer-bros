# Beer BROS Roadmap

Status key: **Done** = implemented and checked; **Pending** = not yet implemented; **Blocked** = needs an external decision or dependency.

## Phase 0 — Project foundation (current)
- [x] Establish product source of truth and project workflow.
- [x] Set up React, Vite, TypeScript, Tailwind CSS, and Lucide React.
- [x] Create responsive Home story-feed demo, Search, inbox preview, and separate discovery experience.
- [x] Create private GitHub repository and push the initial project.
- [x] Seed Ugandan and imported drinks catalogue.
- [x] Run production build and resolve any errors.
- [x] Deploy and verify the public Vercel front-end preview at `https://beer-bros-nine.vercel.app`.
- [x] Add authenticated React registration/login and same-origin Vercel API routing.
- [x] Replace fake signed-in feed with PostgreSQL stories, likes, replies, follows and member search.
- [x] Connect inbox history and persistent message sending to authenticated API routes.
- [ ] Configure brand assets and real profile photography.

## Phase 1 — Product validation and UX
- [x] Make Home story feed the primary experience; retain Discovery as a separate, member-backed feature.
- [ ] Define story composition, follow states, search results, messaging privacy, and notification behavior.
- [ ] Validate onboarding, profile fields, discovery preferences, safety language, and Uganda localization with target users.
- [ ] Finalize visual identity, content tone, accessibility baseline, and privacy/terms copy.
- [ ] Define beta success and safety metrics.

## Phase 2 — Backend foundation on Render
- [x] Create Render free preview web service and PostgreSQL database; configure generated secrets and environment separation. Do not store real member data on the 30-day free database.
- [x] Implement TypeScript API, initial schema, registration/login, server-side 18+ gate, and profile/story/follow/search endpoints.
- [x] Add authenticated conversation/message routes and Socket.IO room authorization.
- [x] Add match-gated conversations and persistent message history/send APIs.
- [x] Add same-origin API client inbox polling for new conversations and messages.
- [ ] Add account recovery, email verification, and account deletion workflow.
- [ ] Add photo storage provider and upload validation.
- [x] Apply the initial schema to the preview database during Render build; add independent migration verification and broader security checks.
- [x] Deploy API service to Render Free from the private GitHub repository; Render marks it Live and its deploy logs confirm the health check and database migration succeeded.
- [x] Set Render `WEB_ORIGIN` to `https://beer-bros-nine.vercel.app` and redeploy.
- [ ] Verify the Render public hostname from an external browser/network; the current browser environment reports DNS resolution failure despite Render’s Live status.
- [x] Deploy the frontend integration to Vercel; verify the live `/api/health` proxy and authenticated `/api/stories` gate.
- [x] Verify live registration, session restore, story creation, like, and reply persistence after reload using a clearly labeled QA fixture.
- [ ] Verify two-account follow and conversation/message round-trip; plan cleanup for QA fixture before public launch.

## Phase 3 — Discovery and matching
- [x] Add explicit Discovery opt-in and server-side candidate selection; share broad area only and never request exact coordinates.
- [x] Persist pass/interest actions and create mutual matches plus conversations on reciprocal interest.
- [x] Add incoming Likes you and Matches views, empty/error/loading feedback, block exclusions, and swipe buttons.
- [ ] Add candidate pagination and further abuse/rate protections.

## Phase 4 — Messaging and safety operations
- [x] Gate conversations and message reads/writes on mutual matches; persist message history.
- [x] Refresh the open inbox and conversation history automatically through the REST API.
- [ ] Add Socket.IO live delivery, notification preferences, and two-account deployed verification.
- [ ] Implement block/report/unmatch, moderation queue, escalation and response process.
- [ ] Add public-meetup and responsible-drinking safety surfaces.

## Phase 5 — Closed beta and launch readiness
- [ ] Test on target Android/iOS browsers and low-bandwidth conditions.
- [ ] Complete accessibility, privacy, security, legal, and performance reviews.
- [ ] Operate closed beta, review safety metrics, fix issues, then make a launch decision.

## Current status and blockers
- Local frontend production build and backend TypeScript build pass. Database schema, consent-based Discovery, matches, and match-gated chat are implemented locally; deploy from `main` and verify with two accounts before tomorrow's test.
- Private repository exists at `https://github.com/ButalaJoel/beer-bros`; the local `main` branch tracks `origin/main`.
- The public Render hostname did not resolve during a direct external check from the current browser environment; retry from another network/browser before relying on it.
- The Vercel rewrite to Render is live and `/api/health` responds successfully. The new discovery schema/API and two-account match/chat path need verification after their deployment.
- Render Free Postgres expires after 30 days. Choose a durable database plan before storing real accounts or conversations.
- Moderation operations, account recovery, account deletion, candidate pagination, and photo upload remain unimplemented.
- Vercel + Render is the agreed hosting target. Production database will be PostgreSQL on Render unless a later requirement changes the decision.
