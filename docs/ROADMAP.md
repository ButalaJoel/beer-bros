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
- [ ] Add session revocation and session/device management; current signed tokens remain valid until expiry or account removal.
- [x] Apply the current schema to the preview database during Render build and verify migration completion in Render logs.
- [ ] Add automated migration verification and a broader security review.
- [x] Deploy API service to Render Free from the private GitHub repository; Render marks it Live and its deploy logs confirm the health check and database migration succeeded.
- [x] Set Render `WEB_ORIGIN` to `https://beer-bros-nine.vercel.app` and redeploy.
- [x] Verify the Render service is Live and the Vercel same-origin API proxy reaches it. Direct hostname checks from this local shell are blocked by its network proxy, so use the browser/Vercel proxy for live checks.
- [x] Deploy the frontend integration to Vercel; verify the live `/api/health` proxy and authenticated `/api/stories` gate.
- [x] Verify live registration, session restore, story creation, like, and reply persistence after reload using a clearly labeled QA fixture.
- [x] Verify two-account conversation/message round-trip using labeled QA fixtures; account cleanup remains pending until account deletion exists.

## Phase 3 — Discovery and matching
- [x] Add explicit Discovery opt-in and server-side candidate selection; share broad area only and never request exact coordinates.
- [x] Persist pass/interest actions and create mutual matches plus conversations on reciprocal interest.
- [x] Add incoming Likes you and Matches views, empty/error/loading feedback, block exclusions, and swipe buttons.
- [x] Verify deployed two-account interest → Likes you → reciprocal match flow on Vercel + Render.
- [ ] Add candidate pagination and further abuse/rate protections.

## Phase 4 — Messaging and safety operations
- [x] Gate conversations and message reads/writes on mutual matches; persist message history.
- [x] Refresh the open inbox and conversation history automatically through the REST API.
- [x] Verify a saved message sent by one matched QA account appears in the other account's inbox and conversation.
- [ ] Add Socket.IO live delivery and notification preferences; current inbox and open chat use REST polling.
- [ ] Implement block/report/unmatch, moderation queue, escalation and response process.
- [ ] Add public-meetup and responsible-drinking safety surfaces.
- [ ] Establish privacy controls: data inventory/purpose, retention periods, account export/deletion, incident response, and privacy notice.
- [ ] Protect stored data operationally: verify provider encryption/backups, least-privilege database access, credential rotation, backup restore drills, and privileged-access audit.
- [ ] Redact sensitive details from logs and review error monitoring for PII leakage.
- [ ] Validate CSRF/origin protections, session behavior, authorization boundaries, and rate limits with security-focused tests.

## Phase 5 — Closed beta and launch readiness
- [ ] Test on target Android/iOS browsers and low-bandwidth conditions.
- [ ] Complete accessibility, privacy, security, legal, and performance reviews.
- [ ] Replace process-local rate-limit counters with a shared store and add endpoint-specific account/IP limits for registration/login, content writes, follows, Discovery actions, search, and message sending.
- [ ] Test rate-limit behavior across restarts/multiple instances and tune thresholds to reduce automated abuse without blocking shared-network users.
- [ ] Operate closed beta, review safety metrics, fix issues, then make a launch decision.

## Current status and blockers
- Local frontend production build and backend TypeScript build pass. Render deploy `6f303d8` is Live and the database migration completed successfully.
- Private repository exists at `https://github.com/ButalaJoel/beer-bros`; the local `main` branch tracks `origin/main`.
- The Vercel same-origin API proxy and Render service were verified through the live app. Direct hostname checks from the shell remain limited by its network proxy.
- Deployed QA verification passed with two separate 18+ staging accounts: account A expressed interest; account B saw it in Likes you and reciprocated; both saw a match; account B's message persisted and appeared in account A's inbox/chat.
- The swipe card registers horizontal pointer movement; its right direction calls the same persisted `interested` action as the tested Interested button, and left calls `pass`. The two-account live test used the accessible action button; physical-device gesture QA remains in Phase 5.
- Render's first Discovery build failed on TypeScript strictness and the first live action found a PostgreSQL UUID inference error; both were fixed in `d8842f5` and `6f303d8`. Keep these commits in the history; do not revert them.
- A clearly labeled second QA account (`beerbros_qa2`) and one staging chat message were created in the preview database for this verification. Account deletion is not implemented, so retain them as QA fixtures until a deletion workflow exists.
- The Vercel rewrite to Render is live and `/api/health` responds successfully. Discovery schema migration and routes are live.
- Security baseline present: Helmet headers, allowlisted credentialed CORS, origin checks for state-changing API calls, a 32 KB JSON body limit, server-side input validation, bcrypt password hashing, HttpOnly session cookies (Secure in production), authenticated authorization checks, and process-local rate limits (120 requests/IP/minute, auth 20/IP/15 minutes, socket send 20/user/minute).
- Security gaps: HTTP rate-limit counters use the default process-local memory store and reset across restarts/instances; socket counters are also in memory. There are no endpoint-specific write limits, email verification, password recovery, session revocation, account export/deletion, complete moderation operations, or independent security review. Do not describe the preview as production-secure.
- Data-protection status: exact coordinates are not collected or shown; Discovery shares only a broad area. The service stores account email, date of birth, password hash, profile fields, stories, follows, match state, and messages. Provider encryption/backups, retention and deletion processes, privileged access auditing, recovery drills, and log redaction have not yet been verified or implemented as a complete operational policy.
- Render Free Postgres expires after 30 days. Choose a durable database plan before storing real accounts or conversations.
- Moderation operations, account recovery, account deletion/export, candidate pagination, photo upload, and launch-grade data-protection controls remain unimplemented.
- Vercel + Render is the agreed hosting target. Production database will be PostgreSQL on Render unless a later requirement changes the decision.
