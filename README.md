# Redirex

A production-grade URL shortener with per-user link management, async click analytics, and a two-layer read cache. Built as a TypeScript monorepo with a shared type package so the frontend and backend never drift out of sync.

## Overview

Redirex is a full-stack URL shortener that goes beyond the basics. It is designed to demonstrate real-world backend engineering patterns: a decoupled analytics pipeline that never slows down the critical redirect path, a two-layer read cache that keeps p99 redirect latency under 2ms, and a monorepo structure where the frontend and backend share the same Zod validation schemas so a schema change is a single edit.

**What it does:**

- Shortens any URL, anonymously or tied to a user account
- Redirects in ~1ms via a Redis L1 cache with automatic PostgreSQL fallback
- Tracks every click asynchronously via a BullMQ job queue — the redirect response is sent before the analytics write happens
- Provides a per-user dashboard with click counts, daily trends, device breakdown, and country stats
- Lets users manage links: toggle active state, update metadata, set expiry dates, delete


## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Browser (React + Vite)                  │
│                        localhost:5173                        │
└───────────────────────────────┬──────────────────────────────┘
                                │ HTTP / REST
┌───────────────────────────────▼──────────────────────────────┐
│                  Fastify API Server  :3000                   │
│                                                              │
│  POST /api/auth/*          →  AuthController                 │
│  POST /api/shorten         →  UrlController                  │
│  GET  /:shortKey           →  UrlController  (redirect)      │
│  GET|PATCH|DELETE /api/urls/:key  →  UrlMgmtController       │
│  GET  /api/urls/:key/analytics    →  AnalyticsController     │
└──────────┬──────────────────────────────┬────────────────────┘
           │                              │
  ┌────────▼────────┐           ┌─────────▼──────────┐
  │   Redis  :6379  │           │   BullMQ Queue     │
  │                 │           │   (backed by Redis) │
  │  url:{key}      │           └─────────┬──────────┘
  │  24h TTL cache  │                     │ async job
  └────────┬────────┘           ┌─────────▼──────────┐
           │ cache miss         │  Analytics Worker  │
  ┌────────▼────────┐           │  (separate process)│
  │  PostgreSQL     │◄──────────┤                    │
  │   :5432         │  INSERT   │  INSERT analytics  │
  │                 │           │  → trigger fires   │
  │  users          │           │  → click_count++   │
  │  urls           │           └────────────────────┘
  │  analytics      │
  │  tags           │
  └─────────────────┘
```

**Critical path for a redirect:** Redis lookup → 302. Total time in the common case (cache hit): ~1ms. Analytics never blocks the response — it is enqueued with fire-and-forget after the reply is sent.

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| API server | [Fastify v5](https://fastify.dev/) | Fastest Node.js HTTP framework; schema-first; excellent TypeScript support |
| Database | [PostgreSQL 15](https://www.postgresql.org/) | ACID transactions, UUID PKs, partial indexes, DB-level triggers for counters |
| Cache & Queue | [Redis 7](https://redis.io/) | Sub-millisecond reads for the L1 URL cache; BullMQ job persistence |
| Job queue | [BullMQ](https://docs.bullmq.io/) | Reliable async processing with retries, concurrency control, and visibility |
| Validation | [Zod](https://zod.dev/) | Runtime + compile-time validation shared across frontend and backend |
| Auth | Hand-rolled HS256 JWT | Zero external auth dependency; uses only Node.js built-in `crypto` module |
| Language | TypeScript (strict mode) | End-to-end type safety across the monorepo |
| Frontend | [React 19](https://react.dev/) + [Vite](https://vite.dev/) | Fast dev experience; modular component architecture |
| Monorepo | npm workspaces | Shared types and schemas between frontend and backend without a build tool |
| Infrastructure | Docker Compose | Single command to spin up PostgreSQL + Redis |

---

## Project Structure

```
redirex/
│
├── shared/                          # @redirex/shared — consumed by both backend and frontend
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                 # Barrel export
│       ├── schemas/
│       │   ├── auth.ts              # Zod: RegisterSchema, LoginSchema
│       │   ├── url.ts               # Zod: ShortenUrlSchema, UpdateUrlSchema, PaginationSchema
│       │   └── analytics.ts         # Zod: AnalyticsQuerySchema
│       └── types/
│           ├── auth.ts              # TS: AuthResponse, JwtPayload
│           ├── url.ts               # TS: UrlRecord, ShortenResponse, PaginatedUrls
│           └── analytics.ts         # TS: AnalyticsResponse, DailyClick, DeviceClick
│
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                 # Bootstrap only — registers plugins and routes
│       ├── config/
│       │   └── infra.ts             # pg Pool, ioredis client, BullMQ Queue
│       ├── routes/
│       │   ├── authRoutes.ts        # POST /api/auth/register, /api/auth/login
│       │   └── urlRoutes.ts         # All URL + analytics routes + redirect
│       ├── controllers/
│       │   ├── auth/
│       │   │   └── authController.ts
│       │   ├── url/
│       │   │   ├── urlController.ts           # POST /api/shorten, GET /:shortKey
│       │   │   └── urlManagementController.ts # GET|PATCH|DELETE /api/urls/:key
│       │   └── analytics/
│       │       └── analyticsController.ts     # GET /api/urls/:key/analytics
│       ├── services/
│       │   ├── authService.ts       # register, login, signJwt, verifyJwt
│       │   └── urlService.ts        # shortenUrl, getLongUrl, getUserUrls, analytics
│       ├── middleware/
│       │   └── auth.ts              # authenticate() — reads + verifies Bearer token
│       ├── utils/
│       │   ├── base62.ts            # encode(bigint) → short key
│       │   └── validate.ts          # Thin Zod safeParse wrapper
│       └── workers/
│           └── analyticsWorker.ts   # BullMQ worker — runs as a separate process
│
├── frontend/
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx                  # Router, auth guard, layout shell
│       ├── main.tsx                 # React entry point
│       ├── api/
│       │   ├── client.ts            # fetch wrapper with automatic auth header injection
│       │   ├── auth.ts              # login / register calls
│       │   ├── urls.ts              # shorten / list / get / update / delete
│       │   └── analytics.ts         # analytics fetch
│       ├── hooks/
│       │   ├── useAuth.ts           # login, register, logout, current user state
│       │   ├── useUrls.ts           # paginated URL list with loading/error/refresh
│       │   ├── useUrlDetail.ts      # single URL + analytics, parallel fetch
│       │   └── useCopy.ts           # clipboard with timed feedback
│       ├── components/
│       │   ├── ui/                  # Atoms: Button, Input, Field, Badge, Toggle,
│       │   │                        #        CopyButton, StatCard, Tabs, Empty, Spinner
│       │   ├── layout/              # Page, Card, PageHeading, Navbar, Modal
│       │   ├── ShortenForm.tsx      # Works in hero (single row) and modal (extended)
│       │   ├── UrlRow.tsx           # One row in the dashboard list
│       │   ├── Pagination.tsx       # Prev/next with page counter
│       │   └── charts/              # DailyChart, DeviceChart, CountryChart
│       ├── pages/
│       │   ├── HomePage.tsx         # Public hero with shorten form
│       │   ├── LoginPage.tsx        # Tabbed sign in / register
│       │   ├── DashboardPage.tsx    # Paginated URL list with stats
│       │   └── DetailPage.tsx       # URL detail — overview, analytics, settings tabs
│       ├── types/
│       │   └── index.ts             # All TypeScript interfaces
│       ├── utils/
│       │   ├── token.ts             # localStorage JWT with expiry check
│       │   └── format.ts            # Dates, numbers, truncation, short URL builder
│       └── styles/
│           └── globals.css          # CSS variables, reset, typography
│
├── shared/sql/
│   └── init.sql                     # Full schema: tables, indexes, triggers
│
├── docker-compose.yml
├── Makefile
└── README.md
```

---

## How It Works

### URL Shortening

```
POST /api/shorten
Body: { url, title?, description?, expiresAt? }
```

1. Zod validates the request body against `ShortenUrlSchema` (from `@redirex/shared`).
2. If a valid `Authorization: Bearer <token>` header is present, the URL is linked to that user's account. If the token is absent or invalid, the URL is created anonymously. Shortening is always available without an account — intentional by design.
3. The service opens a PostgreSQL transaction, inserts the row with a temporary placeholder key to obtain the auto-incremented `BIGSERIAL` ID, then encodes that ID to base62 to produce the final short key. For example, ID `3844` encodes to `"100"`.
4. The short key is written back to the row and the transaction commits.
5. The `longUrl` is immediately written to Redis with a 24-hour TTL (write-through cache), so the first redirect after creation is served from cache.

**Why base62 from BIGSERIAL?** It guarantees uniqueness without a collision-check loop. A random key approach (like nanoid) requires reading from the database on every insert to check for collisions. With sequential IDs the uniqueness is structural.

### Redirect & Caching

```
GET /:shortKey
```

The redirect path is optimised for the common case:

1. **L1 — Redis:** `GET url:{shortKey}`. Hit → `302` redirect. Typical latency: ~1ms.
2. **L2 — PostgreSQL:** If Redis misses, query `urls` where `short_key = $1 AND is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())`. Found → backfill Redis with 24h TTL → `302`. Typical latency: ~10–30ms.
3. **Not found** → `404`.

The analytics job is enqueued with fire-and-forget — `analyticsQueue.add(...)` is called but never awaited. The `302` response returns before the analytics write happens.

**Cache invalidation** is explicit and happens in three cases:

- URL is deactivated (`is_active = false`): `redis.del(url:{shortKey})`
- `expires_at` is updated: `redis.del(url:{shortKey})`
- URL is deleted: `redis.del(url:{shortKey})`

### Analytics Pipeline

Click data is processed asynchronously by a separate worker process to keep the redirect path at ~1ms regardless of database write latency:

```
Redirect handler
  └── analyticsQueue.add('log-click', { shortKey, ip, ua, referer })
        └── [BullMQ / Redis]
              └── analyticsWorker.ts  (separate process, concurrency: 5)
                    └── INSERT INTO analytics (short_key, ip_address, user_agent, referer)
                          └── Postgres trigger: trg_increment_click
                                └── UPDATE urls SET click_count = click_count + 1
```

The database-level trigger keeps `urls.click_count` in sync automatically — no application-level counter management needed, no race conditions under concurrent writes.

The `analytics` table stores raw click events for time-series queries. The API provides aggregations for daily clicks over the last 30 days, device type breakdown, and top 10 countries.

### Authentication

Auth uses a hand-rolled HS256 JWT with no external library dependency.

- **Password hashing:** HMAC-SHA256 with a per-user random salt (32 hex bytes from `crypto.randomBytes`). No bcrypt dependency. Production deployments should upgrade to `argon2` or `bcrypt`.
- **Token signing:** Tokens are signed with `JWT_SECRET` (from env), expire after 7 days.
- **Timing-safe comparison:** `timingSafeEqual` is used for both signature verification and password comparison to prevent timing attacks.
- **Middleware:** `authenticate()` reads `Authorization: Bearer <token>`, verifies signature and expiry, returns the decoded payload or sends `401` directly. No exceptions bubble to the route handler.

---

## Database Schema

### Tables

| Table | Purpose |
|---|---|
| `users` | Registered accounts with hashed passwords |
| `urls` | All shortened links, optionally linked to a user |
| `analytics` | Raw click events — one row per redirect |
| `rate_limits` | Reserved for future rate limiting logic |
| `domains` | Reserved for custom domain support |
| `tags` / `url_tags` | Reserved for link tagging |

### Entity Relationship

```
users (id PK)
  └── urls (user_id FK → users.id ON DELETE SET NULL)
        └── analytics (short_key FK → urls.short_key ON DELETE CASCADE)
        └── url_tags (url_id FK → urls.id ON DELETE CASCADE)
              └── tags (tag_id FK → tags.id ON DELETE CASCADE)
```

### Key Design Choices

**`urls.id` is `BIGSERIAL`** — auto-incrementing integer. The short key is derived from this ID via base62 encoding. Uniqueness is guaranteed structurally with no collision-check round trips.

**Partial index on active URLs:**
```sql
CREATE INDEX idx_urls_active ON urls(short_key) WHERE is_active = TRUE;
```
The redirect query only touches this index. Inactive URLs fall through to a full scan — intentional, as redirecting to inactive links should be slow.

**`click_count` is a denormalised counter** maintained by a PostgreSQL `AFTER INSERT` trigger on `analytics`. This avoids a `COUNT(*)` on every dashboard load and is atomic under concurrent writes.

**`user_id` uses `ON DELETE SET NULL`** — deleting a user preserves all their shortened URLs as anonymous links rather than cascade-deleting potentially widely-shared URLs.

### Schema

```sql
-- Users
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt          TEXT NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- URLs
CREATE TABLE urls (
    id          BIGSERIAL PRIMARY KEY,
    short_key   VARCHAR(10) UNIQUE NOT NULL,
    long_url    TEXT NOT NULL,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    title       TEXT,
    description TEXT,
    is_active   BOOLEAN DEFAULT TRUE,
    expires_at  TIMESTAMP,
    click_count BIGINT DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics
CREATE TABLE analytics (
    id          BIGSERIAL PRIMARY KEY,
    short_key   VARCHAR(10) REFERENCES urls(short_key) ON DELETE CASCADE,
    ip_address  INET,
    user_agent  TEXT,
    referer     TEXT,
    country     VARCHAR(100),
    city        VARCHAR(100),
    device_type VARCHAR(50),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger: keep click_count in sync
CREATE OR REPLACE FUNCTION increment_click_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE urls SET click_count = click_count + 1 WHERE short_key = NEW.short_key;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_click
AFTER INSERT ON analytics
FOR EACH ROW EXECUTE FUNCTION increment_click_count();
```

---

## API Reference

Full interactive documentation is available at `http://localhost:3000/docs` (Swagger UI) when the server is running.

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | Create an account |
| `POST` | `/api/auth/login` | None | Get a JWT token |

### URL Operations

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/shorten` | Optional | Shorten a URL. Attaches to account if token present. |
| `GET` | `/:shortKey` | None | Redirect to the original URL |

### URL Management

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/urls` | Required | List your URLs (paginated) |
| `GET` | `/api/urls/:shortKey` | Required | Get a single URL with recent clicks |
| `PATCH` | `/api/urls/:shortKey` | Required | Update title, expiry, active state |
| `DELETE` | `/api/urls/:shortKey` | Required | Permanently delete a URL |

### Analytics

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/urls/:shortKey/analytics` | Required | 30-day daily clicks, device breakdown, top countries |

### Request / Response Examples

**Register**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "password123"}'
```
```json
{ "userId": "uuid...", "token": "eyJ..." }
```

**Shorten a URL (authenticated)**
```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "url": "https://github.com/rapid-killer-9/redirex-engine",
    "title": "Redirex repo",
    "expiresAt": "2025-12-31T23:59:59Z"
  }'
```
```json
{ "shortKey": "1", "shortUrl": "http://localhost:3000/1", "userId": "uuid..." }
```

**Redirect**
```bash
curl -L http://localhost:3000/1
# → 302 → https://github.com/rapid-killer-9/redirex-engine
```

**Analytics**
```bash
curl http://localhost:3000/api/urls/1/analytics \
  -H "Authorization: Bearer <token>"
```
```json
{
  "daily": [
    { "day": "2025-01-15", "clicks": 42 },
    { "day": "2025-01-16", "clicks": 87 }
  ],
  "devices": [
    { "device": "desktop", "clicks": 98 },
    { "device": "mobile", "clicks": 31 }
  ],
  "countries": [
    { "country": "US", "clicks": 64 },
    { "country": "IN", "clicks": 40 }
  ]
}
```

### Error Responses

All errors follow this shape:

```json
{ "error": "Human-readable error message" }
```

| Status | When |
|---|---|
| `400` | Validation failed — malformed body or params |
| `401` | Missing, invalid, or expired JWT |
| `404` | Short key not found, inactive, or expired |
| `409` | Email already registered |
| `500` | Unexpected server error |

---

## Frontend

The frontend is a React 19 + Vite application structured around a clean separation of concerns:

- **`api/`** — All fetch logic. One file per domain (`auth.ts`, `urls.ts`, `analytics.ts`). A shared `client.ts` handles auth header injection so no page or hook ever touches `fetch` directly.
- **`hooks/`** — Data-fetching hooks (`useUrls`, `useUrlDetail`) with cancellation-safe `useEffect` patterns. Hooks own no UI.
- **`components/`** — Atomic UI components (`Button`, `Input`, `Badge`, `Toggle`, `StatCard`) plus composed components (`ShortenForm`, `UrlRow`, `Pagination`) and charts.
- **`pages/`** — Thin orchestrators. Pages call hooks, pass data to components. No fetch logic lives here.
- **`types/`** — All TypeScript interfaces in one file. Can be replaced with `@redirex/shared` imports once the shared package is built.
- **`utils/`** — Token management with JWT expiry checks. Date/number formatting. Neither touches React.

**Pages:**

| Route | Page | Auth required |
|---|---|---|
| `/` | `HomePage` | No |
| `/login` | `LoginPage` | No (redirects to dashboard on success) |
| `/dashboard` | `DashboardPage` | Yes |
| `/detail` | `DetailPage` | Yes |

---

## Environment Variables

### `frontend/.env`

```env
# Base URL of the API server — must end without a trailing slash
VITE_API_URL=http://localhost:3000
```

### `backend/.env`

```env
# ── Server ────────────────────────────────────────────────────────────────────
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# ── PostgreSQL ────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/url_shortner

# ── Redis ─────────────────────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── Auth ──────────────────────────────────────────────────────────────────
JWT_SECRET=replace-this-with-a-long-random-string-at-least-32-chars

# ── Analytics (optional) ──────────────────────────────────────────────────────
# For MaxMind GeoIP country/city enrichment. Leave blank to skip.
# Without this, country and city columns in the analytics table will remain NULL.
GEOIP_LICENSE_KEY=
```

**Variable notes:**

- `BASE_URL` is used to construct the `shortUrl` in shorten responses. Change this if you deploy behind a custom domain.
- `FRONTEND_URL` is passed to the Fastify CORS plugin as the allowed origin. Set this to your deployed frontend URL in production.
- `JWT_SECRET` is the only variable with real security implications. Use a cryptographically random value of at least 48 bytes in production.
- `GEOIP_LICENSE_KEY` is optional. The analytics worker inserts `NULL` for country and city if no GeoIP provider is configured.

---

## Getting Started

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [Docker](https://www.docker.com/) and Docker Compose
- `make` (optional — all commands can be run manually)

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/rapid-killer-9/redirex-engine.git
cd redirex-engine

# 2. Full setup: copy .env, start Docker, install and build everything
make setup

# 3. Start all services
make start
```

`make setup` does the following in order:

1. Copies `backend/.env.example` to `backend/.env`
2. Copies `frontend/.env.example` to `frontend/.env`
3. Runs `docker compose up -d` to start PostgreSQL and Redis
4. Installs and builds `@redirex/shared`
5. Installs backend and frontend dependencies

`make start` runs three processes concurrently:

- `backend` — Fastify API server on `:3000`
- `worker` — BullMQ analytics worker (separate Node.js process)
- `frontend` — Vite dev server on `:5173`

### Service URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:3000 |
| Swagger UI | http://localhost:3000/docs |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |
