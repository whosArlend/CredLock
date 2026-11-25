# CredLock Security Intelligence API — Backend

REST API backend for **CredLock Security Intelligence**, built with **Node.js**, **Express 5**, **TypeScript** (NodeNext ESM), **Zod**, and the **Supabase JavaScript Client**.

This service provides verified cybersecurity threat intelligence, breach incident feeds, security hardening recommendations, and research advisories to the CredLock Progressive Web Application (PWA).

---

## 1. Production Service & Live Endpoints

- **Production Base URL:** `https://credlock-api.vercel.app`
- **Development Base URL:** `http://localhost:4000`
- **Release Version:** `v2.0.0` (Root response: `version: "2.0.0"`, Route prefix: `/api/v1/*`) — see [CHANGELOG.md](../../CHANGELOG.md)
- **Hosting Target:** Vercel Serverless Functions (`@vercel/node`)
- **Database:** Supabase Managed PostgreSQL

| Endpoint | Method | Purpose |
|---|:---:|---|
| `/` | `GET` | Root API directory and service status. |
| `/api/health` | `GET` | Basic liveness probe (independent of database availability). |
| `/api/health/db` | `GET` | Database readiness probe checking Supabase round-trip latency. |
| `/api/v1/dashboard/summary` | `GET` | Aggregated threat KPIs, severity breakdown, and 5 recent breaches. |
| `/api/v1/breaches` | `GET` | Paginated catalog of verified breaches with search, severity filter, and sorting. |
| `/api/v1/breaches/:slug` | `GET` | Full incident detail including affected data classes and source references. |
| `/api/v1/recommendations` | `GET` | Paginated security hardening guidance with category/priority filters. |
| `/api/v1/recommendations/:slug` | `GET` | Step-by-step implementation playbooks and suggested tools. |
| `/api/v1/articles` | `GET` | Paginated cybersecurity research advisories. |
| `/api/v1/articles/:slug` | `GET` | Complete research advisory text with Markdown formatting. |

---

## 2. Architecture & Folder Structure

The backend follows a layered modular architecture ensuring clean separation between HTTP handling, input validation, business logic, and database access:

```text
backend/credlock-api/
├── api/                         # Vercel serverless function entry point
│   └── index.ts                 # Handler exporting Express app
├── database/                    # Supabase SQL schema migrations and seed scripts
│   ├── 001_create_credlock_tables.sql
│   ├── 002_seed_credlock_data.sql
│   └── README.md
├── src/
│   ├── app.ts                   # Express app initialization & middleware configuration
│   ├── server.ts                # Conventional HTTP server listener for local dev
│   ├── index.ts                 # Application factory for serverless environments
│   ├── config/                  # Zod environment validation (env.ts) & Supabase client
│   │   ├── env.ts
│   │   └── supabase.ts
│   ├── controllers/             # HTTP request handlers & response dispatchers
│   │   ├── dashboardController.ts
│   │   ├── breachController.ts
│   │   ├── recommendationController.ts
│   │   └── articleController.ts
│   ├── services/                # Business logic, aggregation & metric calculation
│   │   ├── dashboardService.ts
│   │   ├── breachService.ts
│   │   ├── recommendationService.ts
│   │   └── articleService.ts
│   ├── repositories/            # Database queries with strict visibility filtering
│   │   ├── dashboardRepository.ts
│   │   ├── breachRepository.ts
│   │   ├── recommendationRepository.ts
│   │   └── articleRepository.ts
│   ├── validators/              # Zod query & parameter validators
│   │   ├── breachValidator.ts
│   │   ├── recommendationValidator.ts
│   │   └── articleValidator.ts
│   ├── types/                   # TypeScript DTOs and data models
│   │   ├── dashboard.ts
│   │   ├── breach.ts
│   │   ├── recommendation.ts
│   │   └── article.ts
│   ├── middleware/              # Security (Helmet, CORS, Rate Limit), Error Handler, Logger
│   │   ├── security.ts
│   │   ├── errorHandler.ts
│   │   ├── notFoundHandler.ts
│   │   └── logger.ts
│   ├── routes/                  # Express route definitions
│   │   ├── health.ts
│   │   ├── index.ts
│   │   └── v1/
│   │       ├── dashboard.ts
│   │       ├── breaches.ts
│   │       ├── recommendations.ts
│   │       ├── articles.ts
│   │       └── index.ts
│   └── utils/                   # Standard JSON envelope helpers & text sanitizers
│       ├── response.ts
│       └── sanitize.ts
├── tests/                       # Automated test suites (Vitest + Supertest)
│   ├── health.test.ts
│   ├── dashboard.test.ts
│   ├── breaches.test.ts
│   ├── recommendations.test.ts
│   ├── articles.test.ts
│   ├── security.test.ts
│   ├── supabase.test.ts
│   ├── vercel.test.ts
│   └── audit.test.ts
├── .env.example                 # Environment configuration template
├── package.json
├── tsconfig.json                # TypeScript NodeNext ESM configuration
└── vercel.json                  # Vercel serverless routing rewrite rules
```

---

## 3. Security Middleware & Defensive Controls

1. **HTTP Security Headers (`helmet` v8.3.0)**:
   - Configured in `src/middleware/security.ts`.
   - Sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and `Cross-Origin-Resource-Policy: cross-origin`.
   - `contentSecurityPolicy` is disabled on the API backend because it serves JSON data rather than rendering HTML.
   - Dual-resolution helper ensures strict type safety under NodeNext ESM without suppressing errors with `any` or `@ts-ignore`.
2. **CORS Origin Filtering (`cors`)**:
   - Reads `FRONTEND_URL` from environment.
   - Restricts cross-origin requests to configured frontend origins (supports comma-separated origins, e.g. production domain + preview deployments).
   - Local origins `http://localhost:5173` and `http://127.0.0.1:5173` are allowed for development.
3. **Rate Limiting (`express-rate-limit`)**:
   - Limits clients to **100 requests per 15 minutes per IP**.
   - Emits standard `RateLimit-*` headers and returns HTTP 429 when exceeded.
4. **Proxy Trust**:
   - `app.set('trust proxy', 1)` enables accurate client IP resolution behind Vercel reverse proxies.
5. **Payload Size Constraints**:
   - Restricts JSON and URL-encoded request bodies to `100kb`.
6. **Supabase Privileged Key Isolation & Immutable Visibility Filters**:
   - The backend uses `SUPABASE_SECRET_KEY` (service role) isolated from browser bundles.
   - To prevent accidental exposure of draft or unverified data, the repository layer strictly enforces:
     - `breaches`: `.eq('is_published', true).eq('is_verified', true)`
     - `recommendations`: `.eq('is_published', true)`
     - `articles`: `.eq('is_published', true)`

---

## 4. Environment Variables

Configure environment variables in `.env` (or Vercel Project Settings for production):

| Variable | Required | Default / Example | Purpose |
|---|:---:|---|---|
| `NODE_ENV` | Optional | `development` | Runtime mode (`development`, `production`, `test`). |
| `PORT` | Optional | `4000` | Port for local HTTP listener (`src/server.ts`). |
| `FRONTEND_URL` | **Yes** (Prod) | `http://localhost:5173` | Allowed CORS origin(s). Supports comma-separated list. |
| `SUPABASE_URL` | **Yes** (DB) | `https://your-project.supabase.co` | Supabase project URL endpoint. |
| `SUPABASE_SECRET_KEY` | **Yes** (DB) | `sb_secret_...` | Supabase privileged service role secret key. |

---

## 5. Local Development Setup

### Prerequisites
- Node.js 18 or higher (tested on Node 20 / 22)
- npm 9 or higher

### Installation
```bash
cd backend/credlock-api
npm install
```

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your `SUPABASE_URL` and `SUPABASE_SECRET_KEY`.

### Running Locally
```bash
# Start development server with hot-reload (port 4000)
npm run dev

# Run TypeScript compilation check
npm run typecheck

# Build production bundle to dist/
npm run build

# Start compiled production server
npm start
```

---

## 6. Testing

The backend includes a comprehensive automated test suite powered by **Vitest** and **Supertest**:

```bash
# Run all backend tests once
npm test

# Run tests in watch mode
npm run test:watch
```

### Verified Test Suites (118 / 118 Tests Passed):
- `tests/health.test.ts` (6 tests): Liveness and database readiness probes.
- `tests/dashboard.test.ts` (7 tests): KPI calculations and severity distribution.
- `tests/breaches.test.ts` (18 tests): Pagination, search, severity filters, sorting, detail.
- `tests/recommendations.test.ts` (27 tests): Category and priority filtering, detail.
- `tests/articles.test.ts` (30 tests): Category filtering, search, detail.
- `tests/security.test.ts` (4 tests): CORS origin reflection, Helmet headers, rate limiting.
- `tests/supabase.test.ts` (7 tests): Client initialization and connection checks.
- `tests/vercel.test.ts` (6 tests): Serverless function export compatibility.
- `tests/audit.test.ts` (13 tests): Defensive security and schema constraints.

---

## 7. Vercel Serverless Deployment

1. **Vercel Project Setup**:
   - **Root Directory**: `backend/credlock-api`
   - **Build Command**: `npm run build` (`tsc -p tsconfig.json`)
   - **Install Command**: `npm install --include=dev`
   - **Output Directory**: `dist` (or leave default)
2. **Environment Variables**:
   - In Vercel Project Settings, add `NODE_ENV`, `FRONTEND_URL`, `SUPABASE_URL`, and `SUPABASE_SECRET_KEY`.
3. **Deployment Troubleshooting**:
   - **Issue:** `tsc: command not found` on Vercel build.  
     **Fix:** Ensure Install Command is set to `npm install --include=dev` so `typescript` is installed.
   - **Issue:** `error TS2349: This expression is not callable` with Helmet.  
     **Fix:** Resolved via explicit `HelmetCallable = typeof import('helmet').default` typing helper in `src/middleware/security.ts`.
