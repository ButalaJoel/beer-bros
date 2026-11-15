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
- [x] Create Render free preview web service and PostgreSQL database; configure generated secrets and environment separation. Do not store real member data on the 30-day free database.
- [x] Implement TypeScript API, initial schema, registration/login, server-side 18+ gate, and profile/story/follow/search endpoints.
- [x] Add authenticated conversation/message routes and Socket.IO room authorization.
- [ ] Add account recovery, email verification, and account deletion workflow.
- [ ] Add photo storage provider and upload validation.
- [x] Apply the initial schema to the preview database during Render build; add independent migration verification and broader security checks.
- [x] Deploy API service to Render Free from the private GitHub repository; deployment is marked Live. Public health endpoint DNS verification is still pending.
- [ ] Complete Vercel Hobby project creation after user enters the email verification code; front-end deploy is not live yet.

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
- Local frontend and backend builds pass. API smoke checks pass for health, required authentication, the 18+ registration gate, and request-origin protection. Render API build is Live at `https://beer-bros-api.onrender.com`; a public health URL check returned DNS resolution failure in this session and needs retry.
- Private repository exists at `https://github.com/ButalaJoel/beer-bros`; the local `main` branch tracks `origin/main`.
- Vercel project setup is awaiting the account owner’s one-time email verification; no frontend deployment is live yet.
- Backend code is not connected to the frontend. Render has created the preview database and the build invokes the initial migration.
- Render Free Postgres expires after 30 days. Choose a durable database plan before storing real accounts or conversations.
- No production discovery matching, moderation operations, account recovery, or deletion exists.
- Vercel + Render is the agreed hosting target. Production database will be PostgreSQL on Render unless a later requirement changes the decision.
