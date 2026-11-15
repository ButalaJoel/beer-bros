# Beer BROS Roadmap

Status key: **Done** = implemented and checked; **Pending** = not yet implemented; **Blocked** = needs an external decision or dependency.

## Phase 0 — Project foundation (current)
- [x] Establish product source of truth and project workflow.
- [x] Set up React, Vite, TypeScript, Tailwind CSS, and Lucide React.
- [x] Create responsive Home story-feed demo, Search, inbox preview, and separate discovery experience.
- [x] Create private GitHub repository and push the initial project.
- [x] Seed Ugandan and imported drinks catalogue.
- [ ] Run production build and resolve any errors. **Blocked:** npm registry access was unavailable in the initial environment, so dependencies are not installed and `npm run build` stops at missing `tsc`.
- [ ] Configure brand assets and real profile photography.

## Phase 1 — Product validation and UX
- [x] Make Home story feed the primary experience; retain Discovery as a separate feature (demo-only interactions).
- [ ] Define story composition, follow states, search results, messaging privacy, and notification behavior.
- [ ] Validate onboarding, profile fields, discovery preferences, safety language, and Uganda localization with target users.
- [ ] Finalize visual identity, content tone, accessibility baseline, and privacy/terms copy.
- [ ] Define beta success and safety metrics.

## Phase 2 — Backend foundation on Render
- [ ] Create Render web service and PostgreSQL database; configure secrets and environment separation.
- [ ] Implement TypeScript API, database migrations, auth, age eligibility gate, profile schema, session security, and account deletion.
- [ ] Add photo storage provider and upload validation.
- [ ] Add migrations, typed data access, and automated policy/security checks.

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
- Phase 0 implementation is present; build validation remains pending in this initial handoff.
- Private repository exists at `https://github.com/ButalaJoel/beer-bros`; the local `main` branch tracks `origin/main`.
- Vercel and Render integrations are available but not connected; no deployment configuration or credentials are set.
- No production account, feed, follow, search, discovery, persistent messaging, or moderation service exists.
- Vercel + Render is the agreed hosting target. Production database will be PostgreSQL on Render unless a later requirement changes the decision.
