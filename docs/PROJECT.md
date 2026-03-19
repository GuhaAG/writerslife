# WritersLife — Project Document

> Living document. Last updated: 2026-03-10.
> Source of truth for vision, features, and architecture decisions.

---

## 1. Project Vision

**WritersLife** is a web fiction platform for aspiring writers and readers.

**Who it's for:**
- *Authors* who want a place to publish their stories, build an audience, and get feedback
- *Readers* who want to discover, follow, and enjoy serialized fiction

**Two-phase roadmap:**

| Phase | Goal | Status |
|-------|------|--------|
| Phase 1 | Royal Road feature parity — a fully functional web fiction platform | In planning |
| Phase 2 | Unique selling point features that differentiate WritersLife from competitors | TBD |

Phase 1 is intentionally scoped to match what Royal Road (royalroad.com) offers today. This gives us a well-understood product target, an existing user mental model, and a clear definition of "done" before we innovate.

---

## 2. Phase 1: Royal Road Clone

The goal is feature parity with Royal Road's core experience. Features are organized by user type and labeled with MVP priority:

- **P0** — Must ship in MVP (launch blocker)
- **P1** — Ship in first major iteration post-launch
- **P2** — Nice to have, defer until later

### Reader Features

| Priority | Feature |
|----------|---------|
| P0 | Browse fiction: list view with genre/tag filters and search |
| P0 | Read chapters with pagination (prev/next navigation) |
| P0 | User registration and authentication |
| P0 | Follow fiction to receive update notifications |
| P1 | Bookmarks and reading history (resume from last chapter) |
| P1 | Ratings and written reviews |
| P1 | Chapter comments |
| P1 | Multiple browsing lists: Best Rated, Trending, Latest Updates, New, Popular |
| P2 | Reading customization: font size, light/dark theme, reading width |
| P2 | Favorites list and Read Later list |
| P2 | "Others also liked" recommendations |

### Author Features

| Priority | Feature |
|----------|---------|
| P0 | Create fiction: title, description, cover image, genres and tags |
| P0 | Write and publish chapters with a rich text editor |
| P0 | Draft and schedule chapter releases |
| P1 | Author dashboard with stats: followers, total views, average rating |
| P1 | Comment moderation from the dashboard |
| P2 | Analytics: view graphs, word count tracking, per-chapter stats |
| P2 | Chapter scheduling with timezone support |
| P2 | Collaboration credits (co-author attribution) |

### Platform / Admin Features

| Priority | Feature |
|----------|---------|
| P0 | Public user profiles |
| P0 | Fiction discovery homepage (featured, recent, top-rated) |
| P1 | "Rising Stars" trending algorithm |
| P1 | Notification system (email for new chapter releases) |
| P2 | Premium subscription tier |
| P2 | Patreon integration |
| P2 | Moderation tools (reports, bans, content flagging) |

---

## 3. Phase 2: Unique Features

> **Placeholder — TBD.**

This section will be filled in once Phase 1 is scoped and underway. Ideas for differentiation will be captured here as they emerge. Do not design or build Phase 2 features until Phase 1 is complete.

---

## 4. Current Codebase State

### What exists

The repo contains an early-stage dual-architecture prototype:

**Frontend** (`writerslife-app/` — currently deleted from working tree, tracked in git):
- React.js app with React Router v4
- JWT authentication flow (login, signup, profile, settings components)
- Bootstrap + Tailwind CSS hybrid styling
- Electron wrapper for desktop deployment
- Axios for API calls

**Backend** (`books-api/` — currently deleted from working tree, tracked in git):
- Go REST API using the Gin framework
- In-memory storage only (no database)
- Three endpoints: `GET /books`, `GET /book/:id`, `POST /book`
- No auth, no persistence

**New directories** (untracked, in progress):
- `api/` — likely a replacement or expansion of the Go backend
- `app/` — likely a replacement or expansion of the frontend

### Known gaps vs. Phase 1 target

- No database — all data is lost on server restart
- No user authentication on the backend
- No fiction/chapter model (only a basic book model)
- No reading interface
- No author publishing workflow
- No discovery homepage
- No notifications

### What's placeholder vs. functional

Everything in the current codebase should be considered a **prototype skeleton**, not production code. The auth flow in the frontend connects to an assumed auth service on port 8081 that does not exist in this repo.

---

## 5. Tech Stack

### Current stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React.js |
| Frontend routing | React Router v4 |
| CSS | Bootstrap + Tailwind CSS |
| Desktop wrapper | Electron |
| HTTP client | Axios |
| Backend language | Go |
| Backend framework | Gin |
| Data storage | In-memory (no DB) |

### Open decisions

These are deliberately deferred. Do not lock them in without a spike or explicit decision:

- **Database**: relational (PostgreSQL) vs. document (MongoDB) — likely relational given structured fiction/chapter/user models
- **Auth service**: roll our own JWT service vs. use a managed provider (Auth0, Supabase Auth, Clerk)
- **Hosting / deployment**: self-hosted vs. managed cloud (Render, Railway, Fly.io, AWS)
- **Rich text editor**: TipTap, Quill, Slate, ProseMirror — needs evaluation for author writing experience
- **Electron vs. pure web**: whether to keep the desktop wrapper or go web-only for Phase 1
- **Monorepo vs. separate repos**: current repo mixes frontend and backend; may want to separate

### Constraints

- Must be deployable without a paid cloud tier initially (cost-zero MVP)
- Auth must support JWT tokens (frontend is already wired for this)
- Backend API must run on `localhost:8080` in development (frontend assumes this)

---

## 6. Feature Breakdown (Full List)

See Section 2 for the prioritized feature table. This section adds detail for complex features.

### Fiction browsing and discovery

The homepage is the primary discovery surface. It should show:
- A hero/featured section (manually curated or algorithmic)
- Multiple horizontal lists: Trending, Best Rated, Recently Updated, New Releases
- Genre/tag filter pages
- Search (by title, author, tag)

Royal Road reference: their homepage at royalroad.com is the benchmark for layout and information density.

### Chapter reading experience

The reading page is the most-used page on the platform. It needs:
- Clean, distraction-free reading view
- Prev/Next chapter navigation
- Chapter list sidebar or dropdown
- Comment section below each chapter
- "Follow" and "Rate" CTAs easily accessible

### Author publishing workflow

Authors need a simple but complete workflow:
1. Create a new fiction (metadata form)
2. Write chapters in a rich text editor
3. Save as draft or publish immediately
4. Optionally schedule publication

The editor is a critical UX component — it needs to feel good to write in.

### Notifications

Phase 1 notifications are email-only:
- When a followed fiction publishes a new chapter
- When a comment is replied to

In-app notification bell is P1. Push notifications are P2/Phase 2.

---

## 7. Key Decisions Log

| Decision | Status | Notes |
|----------|--------|-------|
| Phase 1 = Royal Road clone | **Decided** | Clear scope, existing mental model |
| Phase 2 features | **Deferred** | TBD after Phase 1 scoped |
| Database technology | **Deferred** | Likely PostgreSQL, not decided |
| Auth approach | **Deferred** | JWT assumed, provider TBD |
| Rich text editor | **Deferred** | Needs evaluation spike |
| Hosting / deployment target | **Deferred** | Cost-zero MVP constraint |
| Electron desktop wrapper | **Deferred** | May drop for web-only Phase 1 |
| Monetization model | **Deferred** | Premium tier and Patreon in P2 scope |
