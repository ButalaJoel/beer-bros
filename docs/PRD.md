# Beer BROS Product Requirements

**Status:** Product requirements and implementation status, 16 November 2026
**Audience:** Adults aged 18+ in Uganda  
**Product:** Mobile-first social network and discovery web application

## 1. Vision
Give adults a welcoming place to share memorable social stories, follow people and interests, discover community, and meet nearby people open to socialising. Beer BROS supports conversation and low-pressure connection while putting consent, privacy, and responsible drinking first.

## 2. Users and needs
- Adults who enjoy sharing funny, memorable, or meaningful social stories.
- Members who want to follow friends, creators, venues, and communities.
- People who want to find new connections and message each other safely.
- People visiting or living in Ugandan cities who want local connections without exposing precise whereabouts.

## 3. Core journey
1. A visitor sees the product proposition, 18+ eligibility, and safety principles.
2. A member creates an account, confirms age eligibility, and sets up a profile.
3. Member opens Home to read and publish stories, react, comment, and follow accounts.
4. Member searches for people and stories, opens profiles, and follows accounts.
5. Members message through authorized conversations, with block/report controls available.
6. Members may also use a distinct Discovery feature with broad-area profile details and mutual interest; mutual interest is required before private messaging.

## 4. Functional requirements
### Home feed and stories
- Home is the primary signed-in destination and displays a feed of member stories.
- Signed-in preview reads member stories from PostgreSQL and persists story creation, likes, replies, and follows through authenticated API requests. Empty data is an actual empty state; seeded demo stories are not shown as community members.
- Members can publish text and optionally attach a photo; story length, media rules, visibility, edits, deletion, reactions, and comments must be specified before launch.
- Feed items identify their author, timestamp, optional topic/drink tag, and reaction/comment counts.
- Members can react, comment, report content, and open the author profile.

### Discovery and mutual interest
- Discovery is opt-in and hidden by default. Only active, opted-in adults can appear as candidates.
- Horizontal swipe right or the accessible Interested control records interest; swipe left or Pass records a pass. The other member sees incoming interest under Likes you.
- Reciprocal interest creates a persistent match and private conversation. A pass does not create a match.
- Share broad area only. Do not collect or expose exact coordinates.

### Messaging
- Members can read/send private messages only in a conversation created by a mutual Discovery match. Blocked pairs cannot message.
- Conversations and messages persist in PostgreSQL. Inbox previews refresh automatically; the current preview uses REST polling while Socket.IO delivery remains future work.
- The two-account path is verified against the deployed Vercel and Render preview. Physical-device gesture QA, moderation operations, account recovery/deletion, and public production readiness remain pending.
- Feed ranking must avoid promoting dangerous consumption, harassment, or viral intoxication content; provide chronological or transparent controls for initial release.
- Clearly distinguish member content from sponsored or system content; no alcohol advertising in the initial release.

### Accounts, profiles, and following
- Support account registration, login, logout, recovery, age gate, profile setup/edit, and account deletion.
- Follow/unfollow accounts and view follower/following lists with privacy controls defined before beta.
- Profiles include biography, photo(s), interests, broad location label, optional current drink, and social intent.

### Search
- Search people and public stories by display name, handle, topic, and supported text fields.
- Provide loading, empty, error, and safe-result states; enforce block and privacy filters server-side.

### Messaging
- Authenticated members can message only after mutual Discovery interest creates a match and authorized conversation.
- Messages persist through server-authorized APIs; inbox and chat currently poll REST endpoints. Socket.IO authorization exists, but the client does not yet use live WebSocket delivery.
- Prevent messaging blocked accounts. Account recovery and email verification are not implemented.
- Rate limits use shared PostgreSQL storage for general traffic, authentication, state-changing requests, and Socket.IO sends. Counters are HMAC keyed and expire; schema setup, deployment, and live restart verification are pending.

### Discovery
- Display a large, responsive profile card with accessible profile details and optional drink label.
- Support pass and interest via explicit buttons, keyboard-accessible controls, and mobile gestures where implemented.
- Provide feedback for actions, empty state, and undo only if it can be implemented without confusing consent.
- Discovery displays only opted-in adult member accounts. Right swipe or the Interested button persists an interest; left swipe or Pass persists a pass. Members can see incoming interest, choose to reciprocate, review mutual matches, and open a private conversation. Swipe gestures have button alternatives. Only broad area is shown; exact coordinates are not requested or stored.
- Production matching should rank eligible profiles using server-side approximate location and preferences; do not expose coordinates.

### Profiles and drink catalogue
- Profile fields planned: display name, date of birth/age eligibility, pronouns optional, bio, photo(s), interests, broad location label, optional current drink, and social intent.
- Seed a structured catalogue with Ugandan and imported beer brands. Catalogue entries should be data, not hard-coded UI strings.
- Avoid alcohol quantity, intoxication, or consumption leaderboards.

### Matching
- A match occurs only when both members express interest.
- Discovery matching requires authentication, match authorization, block exclusions, rate limits, and moderation pathways.
- Deployed two-account QA verified incoming likes, reciprocal match creation, and persistent message round-trip. Clearly labeled staging accounts remain in the preview database.

### Safety and privacy
- 18+ eligibility is mandatory before production discovery access.
- Consent is required for location access; show only a broad area or distance band.
- Provide block, report, unmatch, and account deletion pathways before public launch.
- Include reminders to meet publicly, tell a friend, respect boundaries, and drink responsibly.
- Privacy policy, terms, moderation operations, data retention, and incident response must be finalized before launch.

## 5. Non-functional requirements
- Mobile-first responsive experience with keyboard and screen-reader support.
- Respect `prefers-reduced-motion`; do not rely on motion alone to communicate actions.
- Good perceived performance, optimized responsive images, and graceful empty/error states.
- Strictly typed client code and environment-based service configuration.
- Security: least privilege, protected personal data, server-side authorization, safe upload validation, and no secrets in browser code.

## 6. Success measures (to define before beta)
- Onboarding completion and profile completion rates.
- Discovery action and mutual-match rates, interpreted with safety metrics.
- Report/block response time and moderation outcomes.
- Retention and successful self-reported social connections.
- Accessibility and performance checks across common mobile devices.

## 7. Hosting and system architecture
- Frontend: React/Vite application deployed on Vercel.
- Backend: TypeScript API deployed on Render, backed by managed PostgreSQL. Neon PostgreSQL Free is the active staging database; the prior Render database is retained as a pre-cutover snapshot. Post-cutover writes are not replicated, so any rollback needs data reconciliation. WebSockets support live messaging when client delivery is enabled.
- Route `/api/*` through the Vercel app origin using the Vercel rewrite before the SPA fallback; set Render `WEB_ORIGIN` to the exact Vercel origin.
- Local development supports separate client and server processes with documented environment examples.
- Keep authorization, validation, feed ranking, matching, search filters, and privacy enforcement server-side.

## 8. Current implementation gaps
- Consent-based discovery actions/matching and match-gated message UI are implemented; deployed two-account round-trip is verified. Location queries, media upload, push notifications, and client Socket.IO delivery remain future work.
- Account recovery, email verification, account deletion, editable profiles, and an in-product moderation/admin console.
- Neon PostgreSQL Free is the active staging destination. The source-to-target copy and API read/write checks passed; the old Render database remains as a pre-cutover snapshot, not a synchronized rollback. Free-tier data still requires an off-site backup and is not production recovery-ready. The runtime currently uses the Neon owner connection; a least-privilege app role remains pending before public beta. Schema changes are prepared to run manually through a GitHub Actions workflow with an owner secret isolated from the API runtime.
- Rate limiting is not launch-grade: existing counters are in-memory and not shared across instances; endpoint-specific abuse limits and load/restart tests remain pending.
- Complete data-protection operations are pending: data inventory/purpose and retention, export/deletion, backup/restore, provider encryption verification, access audit, credential rotation, and privacy/incident-response processes.
- Session revocation, security-focused automated tests, independent security review, and log PII-redaction review remain pending.

## 9. Release gates
- Legal/privacy review for Uganda and target markets.
- Verified 18+ onboarding and safe location design.
- Apply and verify shared-store rate limits and tested abuse protections for account creation/login, social actions, Discovery, search, and messaging.
- Documented data purpose/retention, account export/deletion, verified encrypted storage/backups, least-privilege access, recovery testing, and incident response.
- Security review of sessions, CSRF/origin checks, authorization, logs, secrets and incident handling.
- Block/report/unmatch and operational moderation available.
- PostgreSQL permissions, storage protections, auth flows, abuse controls, and deletion verified.
- Accessibility, security, performance, and device testing completed.

