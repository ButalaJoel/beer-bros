# Beer BROS Product Requirements

**Status:** Initial product definition, 15 November 2026  
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
6. Members may also use a distinct nearby discovery feature with approximate location and mutual interest; messaging remains subject to account and safety controls.

## 4. Functional requirements
### Home feed and stories
- Home is the primary signed-in destination and displays a feed of member stories.
- Members can publish text and optionally attach a photo; story length, media rules, visibility, edits, deletion, reactions, and comments must be specified before launch.
- Feed items identify their author, timestamp, optional topic/drink tag, and reaction/comment counts.
- Members can react, comment, report content, and open the author profile.
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
- Authenticated members can start or continue an authorized one-to-one conversation subject to product privacy rules.
- Messages are persistent and delivered through a server-authorized API; live delivery uses WebSockets when configured.
- Support message history, unread state, report/block, and conversation controls. Prevent messaging blocked users; rate-limit new conversations and sends.

### Discovery
- Display a large, responsive profile card with accessible profile details and optional drink label.
- Support pass and interest via explicit buttons, keyboard-accessible controls, and mobile gestures where implemented.
- Provide feedback for actions, empty state, and undo only if it can be implemented without confusing consent.
- Demo mode uses seeded data and in-memory state. It must disclose that actions are local and reset on reload.
- Production matching should rank eligible profiles using server-side approximate location and preferences; do not expose coordinates.

### Profiles and drink catalogue
- Profile fields planned: display name, date of birth/age eligibility, pronouns optional, bio, photo(s), interests, broad location label, optional current drink, and social intent.
- Seed a structured catalogue with Ugandan and imported beer brands. Catalogue entries should be data, not hard-coded UI strings.
- Avoid alcohol quantity, intoxication, or consumption leaderboards.

### Matching
- A match occurs only when both members express interest.
- Discovery matching requires authentication, match authorization, block/report checks, rate limits, and moderation pathways.
- The current demo can show a match confirmation for a designated seeded profile but must label this as a simulation.

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
- Backend: TypeScript API deployed on Render, backed by PostgreSQL; WebSockets support live messaging.
- Local development supports separate client and server processes with documented environment examples.
- Keep authorization, validation, feed ranking, matching, search filters, and privacy enforcement server-side.

## 8. Out of scope for initial local demo
- Real authentication, location queries, remote feed, media upload, persistent chat, notifications, payments, and moderation backend.
- Any claim that demo actions are shared, saved remotely, or constitute a real match.

## 9. Release gates
- Legal/privacy review for Uganda and target markets.
- Verified 18+ onboarding and safe location design.
- Block/report/unmatch and operational moderation available.
- Supabase policies, storage protections, auth flows, abuse controls, and deletion verified.
- Accessibility, security, performance, and device testing completed.
