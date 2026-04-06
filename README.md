# Redirex

A production-grade URL shortener with per-user link management, async click analytics, and a two-layer read cache. Built as a monorepo with a shared type package so the frontend and backend never drift out of sync.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
  - [URL Shortening](#url-shortening)
  - [Redirect & Caching](#redirect--caching)
  - [Analytics Pipeline](#analytics-pipeline)
  - [Authentication](#authentication)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Shared Package](#shared-package)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Setup](#local-setup)
  - [Environment Variables](#environment-variables)
- [Development Workflow](#development-workflow)
- [Design Decisions](#design-decisions)
- [Known Limitations & Future Work](#known-limitations--future-work)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Browser)                    │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP
┌───────────────────────────▼─────────────────────────────┐
│               Fastify API Server (:3000)                │
│                                                         │
│   POST /api/shorten      GET /api/urls                  │
│   POST /api/auth/*       PATCH /api/urls/:key           │
│   GET  /:shortKey  ──────────────────────────────────┐  │
└──────────────┬──────────────────────────────────────┬┘  │
               │                                      │   │
    ┌──────────▼──────────┐              ┌────────────▼──┐│
    │   Redis (:6379)     │              │  BullMQ Queue ││
    │                     │              │  (via Redis)  ││
    │  url:{key} → URL    │              └───────┬───────┘│
    │  (L1 cache, 24h TTL)│                      │        │
    └──────────┬──────────┘              ┌───────▼───────┐│
               │ miss                    │Analytics Worker││
    ┌──────────▼──────────┐              │(separate proc) ││
    │  PostgreSQL (:5432) │◄─────────────┤               ││
    │                     │  INSERT      │ INSERT clicks  ││
    │  users, urls,       │  analytics   │ trigger →     ││
    │  analytics, tags    │              │ click_count++ ││
    └─────────────────────┘              └───────────────┘│
```

The critical path for a redirect is: Redis lookup → 302. If Redis misses, it falls back to Postgres and backfills the cache. The analytics write is fully decoupled — it never blocks the redirect response.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| API server | [Fastify v5](https://fastify.dev/) | Fastest Node.js HTTP framework, schema-first |
| Database | [PostgreSQL 15](https://www.postgresql.org/) | ACID, UUID PKs, partial indexes, DB-level triggers |
| Cache / Queue | [Redis 7](https://redis.io/) | Sub-millisecond reads for L1 cache; BullMQ job store |
| Job queue | [BullMQ](https://docs.bullmq.io/) | Reliable async processing, retries, concurrency control |
| Validation | [Zod](https://zod.dev/) | Runtime validation + TypeScript inference, shared across packages |
| Auth | Custom HMAC-SHA256 JWT | No external auth dep; hand-rolled for learning transparency |
| Language | TypeScript (strict) | End-to-end type safety |
| Monorepo | npm workspaces | Shared types between frontend and backend without a build tool |
| Infra | Docker Compose | One command to spin up Postgres + Redis |

---

## Project Structure

```
redirex-engine/
│
├── shared/                         # @redirex/shared — consumed by both backend and frontend
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                # Barrel export
│       ├── schemas/
│       │   ├── auth.ts             # Zod: RegisterSchema, LoginSchema
│       │   ├── url.ts              # Zod: ShortenUrlSchema, UpdateUrlSchema, PaginationSchema
│       │   └── analytics.ts        # Zod: AnalyticsQuerySchema
│       └── types/
│           ├── auth.ts             # TS: AuthResponse, JwtPayload
│           ├── url.ts              # TS: UrlRecord, ShortenResponse, PaginatedUrls
│           └── analytics.ts        # TS: AnalyticsResponse, DailyClick, DeviceClick
│
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── sql/
│   │   └── init.sql                # Full schema: tables, indexes, triggers
│   └── src/
│       ├── index.ts                # Bootstrap only — registers plugins and routes
│       ├── config/
│       │   └── infra.ts            # pg Pool, ioredis, BullMQ Queue
│       ├── routes/
│       │   ├── authRoutes.ts       # POST /api/auth/register, /api/auth/login
│       │   └── urlRoutes.ts        # All URL and analytics routes
│       ├── controllers/
│       │   ├── auth/
│       │   │   └── authController.ts
│       │   ├── url/
│       │   │   ├── urlController.ts          # POST /api/shorten, GET /:shortKey
│       │   │   └── urlManagementController.ts # GET/PATCH/DELETE /api/urls/:key
│       │   └── analytics/
│       │       └── analyticsController.ts    # GET /api/urls/:key/analytics
│       ├── services/
│       │   ├── authService.ts      # register, login, signJwt, verifyJwt
│       │   └── urlService.ts       # shortenUrl, getLongUrl, getUserUrls, analytics
│       ├── middleware/
│       │   └── auth.ts             # authenticate() — reads Bearer token
│       ├── utils/
│       │   ├── base62.ts           # encode(bigint) → short key
│       │   └── validate.ts         # Thin Zod safeParse wrapper
│       └── workers/
│           └── analyticsWorker.ts  # BullMQ worker — runs as separate process
│
├── frontend/                       # React + Vite (to be built out)
│   ├── package.json
│   └── src/
│
├── docker-compose.yml
├── Makefile
└── README.md
```

---

## How It Works

### URL Shortening

```
POST /api/shorten  { url, title?, description?, expiresAt? }
```

1. Zod validates the request body against `ShortenUrlSchema`.
2. If a valid `Authorization: Bearer <token>` header is present, the URL is linked to that user's account. If the token is absent or invalid, the URL is created anonymously — this is intentional, shortening is always available without an account.
3. The service opens a Postgres transaction, inserts the row with a temporary placeholder key to obtain the auto-incremented `BIGSERIAL` ID, then encodes that ID to base62 to produce the final short key (e.g. ID `3844` → `"100"`).
4. The short key is written back to the row and the transaction commits.
5. The `longUrl` is immediately written to Redis with a 24-hour TTL (write-through cache).

### Redirect & Caching

```
GET /:shortKey
```

The redirect path is optimised for the common case:

1. **L1 — Redis**: `GET url:{shortKey}`. Hit → 302 redirect. Typical latency: ~1ms.
2. **L2 — PostgreSQL**: If Redis misses, query `urls` where `short_key = $1 AND is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())`. Found → backfill Redis with 24h TTL, then 302. Typical latency: ~10–30ms.
3. **Not found** → 404.

The analytics job is enqueued with `fire-and-forget` — `analyticsQueue.add(...)` is called but never awaited. The 302 response returns before the analytics write happens.

Cache invalidation happens explicitly:
- When a URL is deactivated (`is_active = false`): `redis.del(url:{shortKey})`.
- When `expires_at` is updated: `redis.del(url:{shortKey})`.
- When a URL is deleted: `redis.del(url:{shortKey})`.

### Analytics Pipeline

Click data is processed asynchronously by a separate worker process to keep the redirect path at ~1ms:

```
Redirect handler
  └── analyticsQueue.add('log-click', { shortKey, ip, ua, referer })
        └── [BullMQ / Redis]
              └── analyticsWorker.ts (separate process, concurrency: 5)
                    └── INSERT INTO analytics (short_key, ip_address, user_agent, referer)
                          └── Postgres trigger: trg_increment_click
                                └── UPDATE urls SET click_count = click_count + 1
```

The DB-level trigger keeps `urls.click_count` in sync automatically — no application-level counter management needed. The `analytics` table stores the raw click events for time-series queries (daily clicks, device breakdown, top countries).

### Authentication

Auth uses a hand-rolled HS256 JWT with no external library dependency:

- Passwords are hashed with HMAC-SHA256 using a per-user random salt (32 hex bytes, `crypto.randomBytes`). No bcrypt dependency.
- Tokens are signed with `JWT_SECRET` from env, expire after 7 days.
- `timingSafeEqual` is used for both signature verification and password comparison to prevent timing attacks.
- The `authenticate()` middleware reads `Authorization: Bearer <token>`, verifies the signature and expiry, and returns the decoded payload or sends 401 directly.

---

## Database Schema

### Tables

**`users`** — registered accounts  
**`urls`** — all shortened links, optionally linked to a user  
**`analytics`** — raw click events  
**`rate_limits`** — reserved for future rate limiting  
**`domains`** — reserved for custom domain support  
**`tags` / `url_tags`** — reserved for link tagging

### Key Design Choices

**`urls.id` is `BIGSERIAL`** — auto-incrementing integer. The short key is derived from this ID via base62 encoding. This guarantees uniqueness without a separate collision-check loop and produces short keys that grow predictably: 1 char for the first 61 URLs, 2 chars up to 3,843, and so on.

**Partial index on active URLs**: `CREATE INDEX idx_urls_active ON urls(short_key) WHERE is_active = TRUE` — the redirect query only touches this index, making inactive URL lookups fall through to a full scan (intentional: inactive URLs should be slow to redirect).

**`click_count` is a denormalized counter** — maintained by a Postgres `AFTER INSERT` trigger on the `analytics` table. Avoids a `COUNT(*)` query on every dashboard load.

**`user_id` uses `ON DELETE SET NULL`** — deleting a user preserves all their shortened URLs (they become anonymous) rather than cascade-deleting potentially widely-shared links.

---

## API Reference

Full interactive documentation is available at `http://localhost:3000/docs` when the server is running.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Create account |
| `POST` | `/api/auth/login` | — | Get JWT token |

### URL Operations

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/shorten` | Optional | Shorten a URL |
| `GET` | `/:shortKey` | — | Redirect to original URL |

### URL Management

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/urls` | Required | List your URLs (paginated) |
| `GET` | `/api/urls/:shortKey` | Required | Get URL + recent clicks |
| `PATCH` | `/api/urls/:shortKey` | Required | Update title, expiry, active state |
| `DELETE` | `/api/urls/:shortKey` | Required | Permanently delete URL |

### Analytics

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/urls/:shortKey/analytics` | Required | 30-day daily, device, country breakdown |

### Example: Full flow

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "password123"}'
# → { "userId": "...", "token": "eyJ..." }

# Shorten a URL (authenticated)
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"url": "https://github.com/rapid-killer-9/redirex-engine", "title": "Redirex repo"}'
# → { "shortKey": "1", "shortUrl": "http://localhost:3000/1", "userId": "..." }

# Redirect
curl -L http://localhost:3000/1
# → 302 → https://github.com/rapid-killer-9/redirex-engine

# List your URLs
curl http://localhost:3000/api/urls \
  -H "Authorization: Bearer <token>"

# Analytics
curl http://localhost:3000/api/urls/1/analytics \
  -H "Authorization: Bearer <token>"
```

---

## Shared Package

`@redirex/shared` is an internal npm package (referenced via `"file:../shared"`) that contains Zod schemas and TypeScript types used by both the backend and frontend. This means:

- A schema change is a single edit in one file, not two.
- The frontend can use the same Zod schemas for form validation that the backend uses for request validation.
- TypeScript will catch mismatches between what the API returns and what the frontend expects at compile time.

```
shared/src/
├── schemas/      # Zod schemas — runtime validation + inferred types
│   ├── auth.ts   # RegisterSchema, LoginSchema
│   ├── url.ts    # ShortenUrlSchema, UpdateUrlSchema, PaginationSchema
│   └── analytics.ts
└── types/        # Pure TS interfaces — zero runtime cost
    ├── auth.ts   # AuthResponse, JwtPayload
    ├── url.ts    # UrlRecord, ShortenResponse, PaginatedUrls
    └── analytics.ts
```

**In the backend:**
```ts
import { RegisterSchema } from '@redirex/shared';
const { data, error } = RegisterSchema.safeParse(req.body);
```

**In the frontend:**
```ts
import { ShortenUrlSchema } from '@redirex/shared';
import type { UrlRecord } from '@redirex/shared';

// Form validation — same schema as the backend
const result = ShortenUrlSchema.safeParse(formValues);
```

Whenever you change `shared/src/`, rebuild before restarting other processes:
```bash
cd shared && npm run build
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- `make` (optional but recommended)

### Local Setup

```bash
# 1. Clone
git clone https://github.com/rapid-killer-9/redirex-engine.git
cd redirex-engine

# 2. Full setup (copies .env, starts Docker, installs and builds everything)
make setup

# 3. Start all services
make start
```

`make start` runs three processes concurrently:
- `backend` — Fastify API server on `:3000`
- `worker` — BullMQ analytics worker (separate process)
- `frontend` — Vite dev server on `:5173`

| Service | URL |
|---|---|
| API | http://localhost:3000 |
| Swagger UI | http://localhost:3000/docs |
| Frontend | http://localhost:5173 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

### Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

```env
# Server
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# PostgreSQL — matches docker-compose.yml defaults
DATABASE_URL=postgresql://admin:password123@localhost:5432/url_shortner

# Redis
REDIS_URL=redis://localhost:6379

# Auth — change this in production, must be at least 32 chars
JWT_SECRET=some-long-random-string-at-least-32-chars

# Analytics (optional — for GeoIP country/city enrichment)
GEOIP_LICENSE_KEY=your_maxmind_key_here
```

> **Note on the DB name**: the Docker Compose database is named `url_shortner` (missing the 'e'). This is a known typo in the original setup — match it exactly in `DATABASE_URL` or rename it in `docker-compose.yml`.

### Resetting the Database

If you need a clean slate (e.g. after a schema change):

```bash
docker compose down -v   # destroys volumes
docker compose up -d     # recreates and runs init.sql
```

---

## Development Workflow

```bash
# Start infrastructure only
docker compose up -d

# Run backend in watch mode
cd backend && npm run dev

# Run analytics worker in watch mode (separate terminal)
cd backend && npm run worker

# Run frontend
cd frontend && npm run dev

# Rebuild shared types after any change to shared/src/
cd shared && npm run build
```

**Adding a new route:**
1. Add Zod schema to `shared/src/schemas/` and rebuild shared.
2. Add the controller in `backend/src/controllers/<domain>/`.
3. Register the route in `backend/src/routes/<domain>Routes.ts`.
4. Done — no changes to `index.ts` needed.

---

## Design Decisions

**Why not nanoid for short keys?**  
Collision-free sequential base62 encoding from a `BIGSERIAL` ID means no uniqueness check on insert. A random key approach (nanoid) requires checking for collisions on every insert, which adds a round-trip under write load. The tradeoff is that short keys are predictable — acceptable for a URL shortener, not acceptable for a secret-sharing service.

**Why hand-rolled JWT instead of jsonwebtoken?**  
Transparency and zero extra dependency. The implementation uses only Node's built-in `crypto` module. For production use, replacing this with `jose` or `jsonwebtoken` is a one-file change in `authService.ts`.

**Why a DB trigger for `click_count` instead of application-level increment?**  
Atomic, consistent, and works regardless of which process inserts the analytics row. If the worker runs with concurrency 5, five concurrent inserts all correctly increment the counter without any application-level locking.

**Why BullMQ instead of writing analytics inline?**  
The redirect p99 latency stays at ~1–2ms regardless of Postgres write latency or load. Analytics writes can be batched, retried on failure, and processed at a different rate than redirects without any impact on the user experience.

**Why two Redis roles (cache + queue) on the same instance?**  
Simplicity in development. In production, separate Redis instances for caching and BullMQ are recommended — a cache eviction policy (`maxmemory-policy allkeys-lru`) conflicts with BullMQ's expectation that job keys are never evicted.

---

## Known Limitations & Future Work

- **GeoIP enrichment is a stub** — `country` and `city` columns in `analytics` are always `NULL`. Wire up `ip-api.com` (free, 45 req/min) or MaxMind GeoLite2 (local DB, no rate limit) in `analyticsWorker.ts`.
- **No rate limiting** — the `rate_limits` table exists in the schema but the application logic is not yet implemented. Add a Fastify plugin (`@fastify/rate-limit`) with Redis as the store.
- **JWT is not revocable** — there is no token blacklist. Logout is client-side only. Add a Redis-backed revocation list or switch to short-lived access tokens + refresh tokens for production.
- **No custom domains** — the `domains` table is scaffolded but the routing logic to serve `yourdomain.com/:shortKey` is not implemented.
- **No tagging UI** — the `tags` and `url_tags` tables exist but no API endpoints expose them yet.
- **Frontend is a placeholder** — the React app is a stock Vite template. Dashboard, analytics charts, and auth flows need to be built.
- **Password hashing uses HMAC-SHA256** — acceptable for a learning project, but `bcrypt` or `argon2` should be used in production as they are deliberately slow and resistant to GPU-based brute force.