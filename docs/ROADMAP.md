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
- [x] Make Home story feed the primary experience; retain Discovery as a separate feature (demo-only interactions).
- [ ] Define story composition, follow states, search results, messaging privacy, and notification behavior.
- [ ] Validate onboarding, profile fields, discovery preferences, safety language, and Uganda localization with target users.
- [ ] Finalize visual identity, content tone, accessibility baseline, and privacy/terms copy.
- [ ] Define beta success and safety metrics.

## Phase 2 — Backend foundation on Render
- [x] Create Render free preview web service and PostgreSQL database; configure generated secrets and environment separation. Do not store real member data on the 30-day free database.
- [x] Implement TypeScript API, initial schema, registration/login, server-side 18+ gate, and profile/story/follow/search endpoints.
- [x] Add authenticated conversation/message routes and Socket.IO room authorization.
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
- Local frontend production build and backend TypeScript build pass. The authenticated client now calls the API; live end-to-end verification still requires deployment and a user-created test account.
- Private repository exists at `https://github.com/ButalaJoel/beer-bros`; the local `main` branch tracks `origin/main`.
- The public Render hostname did not resolve during a direct external check from the current browser environment; retry from another network/browser before relying on it.
- The Vercel rewrite to Render is live and `/api/health` responds successfully. Full write/read persistence remains to be verified through an account owned by the user.
- Render Free Postgres expires after 30 days. Choose a durable database plan before storing real accounts or conversations.
- No production discovery matching, moderation operations, account recovery, or deletion exists.
- Vercel + Render is the agreed hosting target. Production database will be PostgreSQL on Render unless a later requirement changes the decision.
