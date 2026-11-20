# CredLock Security Intelligence API — Architecture & Planning Specification

**Project:** CredLock  
**Document ID:** `CRDLOCK-API-PLAN-V1`  
**Phase:** Phase 1 — Architecture, Database Schema & Integration Planning  
**Target Backend Workspace:** `backend/credlock-api/`  
**Date:** 2026-11-20  
**Status:** PROPOSED & READY FOR APPROVAL  

---

## 1. Project Overview

### 1.1 Executive Summary
CredLock is an academic Progressive Web Application (PWA) focused on client-side password security, entropy evaluation, unbiased cryptographic generation, and privacy-preserving data breach detection. To fulfill the advanced requirements of practical web service engineering (extending concepts learned in *Praktikum Pemrograman Perangkat Bergerak / PPB Modul 1*), CredLock will introduce a self-owned and self-developed RESTful Web Service: the **CredLock Security Intelligence API**.

### 1.2 Core Capabilities
The CredLock Security Intelligence API will deliver structured, domain-aligned cybersecurity intelligence to the CredLock PWA client across four functional domains:
1. **Breach Intelligence:** Curated public data breach incident archives, tracking affected organizations, compromised data classes, timeline metrics, and exposure impact.
2. **Security Recommendations:** Actionable, risk-categorized hardening guidelines (authentication, MFA, password hygiene, credential management) that dynamically advise users based on modern threat postures.
3. **Security Articles & Advisories:** Technical and educational articles, vulnerability disclosures, and password security best practices presented in structured markdown format.
4. **Dashboard Summary:** Aggregated intelligence telemetry (total active breaches tracked, cumulative exposed accounts, critical recommendations, and service health) for instant dashboard surfacing.

---

## 2. Motivation & Objectives

### 2.1 Academic & Technical Justification
* **Self-Developed Web Service:** Rather than solely consuming third-party external APIs (such as Have I Been Pwned), CredLock will demonstrate complete full-stack competence by architecting, implementing, documenting, testing, and deploying its own dedicated backend service.
* **Domain Synergy:** The previous minimal integration (Sales-API from Modul 1) demonstrated cross-origin client-to-backend communication, but suffered from domain divergence (e-commerce POS vs. cybersecurity). The CredLock Security Intelligence API aligns 100% with CredLock's cybersecurity mission.
* **Monorepo Independence:** The backend will reside within the existing repository under `backend/credlock-api/`. Both frontend and backend maintain isolated package dependencies, independent build/lint/test scripts, and separate deployment targets while sharing version control.

### 2.2 Key Engineering Objectives
* **Zero-Knowledge Invariant Preservation:** The backend will **never** receive, process, log, or persist user passwords, cryptographic keys, or personal credentials. It functions strictly as an intelligence provider and advisory hub.
* **Separation of Concerns:** Clean layered architecture (Routes $\to$ Controllers $\to$ Services $\to$ Database) implemented in TypeScript.
* **Resilient Client Consumption:** The CredLock PWA must remain fully operational even if the backend is offline, spinning down on free-tier infrastructure, or unreachable.

---

## 3. Existing Project Audit

### 3.1 Frontend Stack & Design Tokens
* **UI Layer:** React 19, TypeScript 5.7, Vite 6, Tailwind CSS 3.4, React Router 7, Lucide React.
* **Design System:** *Obsidian Vault × Cipher Ledger* (warm charcoal surfaces `#0C0D0E`, `#131517`, `#1A1D20`; Crucible Gold/Amber `#E5A93C` accents; Plus Jakarta Sans & Space Mono typography).
* **Navigation:** Floating Adaptive Capsule Navigation (`useAdaptiveScrollNav`), supporting 5 canonical destinations: Home (`/`), Analyze (`/analyzer`), Generate (`/generator`), Breach (`/breach-checker`), and About (`/profile`).
* **Client Persistence:** Native IndexedDB (`credlock-db`, version 1) with isolated stores `analysis_history` and `breach_history`. Completely sanitized; zero plaintext credentials stored.

### 3.2 Existing Services & Integration Conventions
* `src/services/passwordAnalyzer.ts`: Client-side `@zxcvbn-ts` heuristic scoring.
* `src/services/passwordGenerator.ts`: Browser Web Crypto API CSPRNG rejection sampling.
* `src/services/breachChecker.ts`: HIBP k-Anonymity range lookup via SHA-1 5-character prefix.
* `src/services/api/module1Service.ts`: Minimal read-only adapter connecting to Sales-API via Vite development reverse proxy (`/modul1-api`).
* `src/types/index.ts`: Strongly typed domain entities, result wrappers, and adapter interfaces (`IModule1Service`).

### 3.3 Integration Audit Findings & Avoidance Rules
1. **No Routing Collisions:** The existing 9 client routes must remain undisturbed. New intelligence features will be integrated into contextual cards or a dedicated Intelligence hub route (`/intelligence` or `/security-feed`).
2. **Proxy Separation:** The existing `/modul1-api` proxy rule in `vite.config.ts` must remain intact or be complemented by a dedicated `/api/v1` proxy for the new CredLock API during development.
3. **No Credential Leakage:** No database service keys or secret environment variables may be placed in the frontend `.env`.

---

## 4. Proposed Backend Architecture

### 4.1 Technology Stack

| Layer | Component | Selection & Justification |
| :--- | :--- | :--- |
| **Runtime Environment** | Node.js (LTS v22) | High performance, native ECMAScript Modules (ESM), unified language across stack. |
| **Language** | TypeScript 5.7 | Strict compile-time typing, interface contracts, automated type inference. |
| **Web Framework** | Express.js 5 | Lightweight, battle-tested, robust middleware ecosystem, standard routing model. |
| **Database** | Supabase (PostgreSQL) | Managed cloud PostgreSQL with Row-Level Security (RLS), connection pooling, relational integrity. |
| **Database Client** | `@supabase/supabase-js` v2 | Official SDK providing typed query builder, RPC calls, and transactional execution. |
| **Validation Layer** | Zod (v3) | Schema declaration, static type inference, and runtime validation for incoming payloads. |
| **Security Middleware** | Helmet, CORS, express-rate-limit | HTTP header hardening, origin whitelisting, and brute-force/DoS mitigation. |
| **Test Runner** | Node.js Test Runner / Supertest | Native ESM integration testing (`node --test`) without heavyweight test harnesses. |

### 4.2 Layered System Topology

```text
[ Incoming HTTP Client Request (CredLock PWA / REST Consumers) ]
                           │
                           ▼
             [ Security & Utility Middlewares ]
  ├── CORS (Origin Verification: Localhost 5173 & Production Origin)
  ├── Helmet (HTTP Security Headers)
  ├── Rate Limiter (Request Throttling per IP)
  └── Request Logger (Sanitized Structured Log)
                           │
                           ▼
                  [ Route Dispatcher ]
  ├── /api/health             ──> HealthController
  └── /api/v1                 ──> Versioned Resource Routers
        ├── /breaches         ──> BreachRouter (Validation Middleware)
        ├── /recommendations  ──> RecommendationRouter (Validation Middleware)
        ├── /articles         ──> ArticleRouter (Validation Middleware)
        └── /dashboard        ──> DashboardRouter
                           │
                           ▼
                     [ Controllers ]
  (Request Parsing, Status Code Management, JSON Envelope Formatting)
                           │
                           ▼
                  [ Service / Model Layer ]
  (Business Rules, Data Transformation, Sorting, Search Logic)
                           │
                           ▼
               [ Supabase Client Layer ]
  (PostgreSQL Connection, RLS Enforcement, Parameterized Queries)
                           │
                           ▼
         [ Supabase Managed Cloud PostgreSQL Database ]
```

---

## 5. Proposed Backend Folder Structure

The backend will reside in a dedicated directory at the repository root: `backend/credlock-api/`.

```text
backend/credlock-api/
├── package.json                   # Independent backend dependencies and scripts
├── tsconfig.json                  # Strict TypeScript backend configuration
├── .env.example                   # Template for port, Supabase credentials, API secrets
├── .gitignore                     # Backend-specific ignore rules (node_modules, .env, dist)
├── README.md                      # Backend setup and local execution guide
├── src/
│   ├── index.ts                   # Application bootstrap and server entry point
│   ├── app.ts                     # Express app configuration and middleware pipeline
│   ├── config/
│   │   ├── env.ts                 # Validated environment variables (Zod schema)
│   │   └── supabase.ts            # Initialized Supabase client instance
│   ├── types/
│   │   ├── index.ts               # Shared backend types and database models
│   │   └── api.ts                 # API response envelope and pagination types
│   ├── middlewares/
│   │   ├── errorHandler.ts        # Centralized HTTP error handler & formatter
│   │   ├── validate.ts            # Generic Zod request schema validation middleware
│   │   ├── rateLimiter.ts         # DoS and rate limiting configuration
│   │   └── authGuard.ts           # Simple API-Key guard for write operations (POST/PUT/DELETE)
│   ├── controllers/
│   │   ├── healthController.ts    # Service ping and uptime monitoring
│   │   ├── breachController.ts    # Breach incident CRUD controller
│   │   ├── recommendationController.ts # Security recommendations CRUD controller
│   │   ├── articleController.ts   # Educational articles CRUD controller
│   │   └── dashboardController.ts # Aggregated summary intelligence controller
│   ├── services/
│   │   ├── breachService.ts       # Database queries for breaches
│   │   ├── recommendationService.ts # Database queries for recommendations
│   │   ├── articleService.ts      # Database queries for articles
│   │   └── dashboardService.ts    # Aggregation & metrics computation
│   ├── routes/
│   │   ├── index.ts               # Master router aggregating all endpoints
│   │   ├── healthRoutes.ts        # Health check router
│   │   └── v1/
│   │       ├── breachRoutes.ts
│   │       ├── recommendationRoutes.ts
│   │       ├── articleRoutes.ts
│   │       └── dashboardRoutes.ts
│   └── validators/
│       ├── breachSchemas.ts       # Zod schemas for breach creation and updates
│       ├── recommendationSchemas.ts # Zod schemas for recommendation payloads
│       └── articleSchemas.ts      # Zod schemas for article publishing
└── tests/
    ├── health.test.ts             # Health check endpoint tests
    ├── breaches.test.ts           # Breach CRUD integration tests
    ├── recommendations.test.ts    # Recommendations integration tests
    ├── articles.test.ts           # Articles integration tests
    └── dashboard.test.ts          # Aggregated summary integration tests
```

---

## 6. Database Schema Proposal (Supabase PostgreSQL)

### 6.1 Entity Relational Strategy
To keep the schema clean, resilient, and achievable within an academic project scope, the three primary resources are modeled as independent relational tables with standard PostgreSQL types, appropriate constraints, and automatic audit timestamps (`created_at`, `updated_at`).

### 6.2 Table 1: `breaches` (Breach Intelligence)
Stores public cybersecurity breach records, tracking incident scope, affected entities, and exposure details.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique record identifier |
| `name` | `VARCHAR(150)` | `NOT NULL` | Incident or entity name (e.g. "Equifax Data Leak") |
| `organization` | `VARCHAR(150)` | `NOT NULL` | Affected company or institution |
| `domain` | `VARCHAR(100)` | `NOT NULL` | Primary internet domain (e.g. "equifax.com") |
| `description` | `TEXT` | `NOT NULL` | Comprehensive incident summary |
| `breach_date` | `DATE` | `NOT NULL` | Estimated date when breach occurred |
| `discovery_date` | `DATE` | `NULLABLE` | Date when incident was formally identified |
| `affected_accounts` | `BIGINT` | `NOT NULL DEFAULT 0 CHECK (affected_accounts >= 0)` | Approximate number of compromised accounts |
| `exposed_data` | `TEXT[]` | `NOT NULL DEFAULT '{}'` | Array of data classes (e.g. `['Passwords', 'Emails', 'SSN']`) |
| `severity` | `VARCHAR(20)` | `NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical'))` | Impact classification level |
| `source_url` | `TEXT` | `NULLABLE` | Authoritative report or disclosure URL |
| `remediation_advice`| `TEXT` | `NOT NULL` | Guidance for affected users |
| `is_verified` | `BOOLEAN` | `NOT NULL DEFAULT true` | Incident verification flag |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Record last modification timestamp |

### 6.3 Table 2: `recommendations` (Security Recommendations)
Stores actionable, risk-categorized hardening guidance.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique recommendation identifier |
| `title` | `VARCHAR(200)` | `NOT NULL` | Concise rule name (e.g. "Enforce Multi-Factor Authentication") |
| `summary` | `TEXT` | `NOT NULL` | Executive single-paragraph summary |
| `category` | `VARCHAR(50)` | `NOT NULL CHECK (category IN ('authentication', 'password_hygiene', 'mfa', 'storage', 'network'))` | Domain category |
| `risk_level` | `VARCHAR(20)` | `NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical'))` | Associated risk addressed |
| `priority` | `SMALLINT` | `NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5)` | Implementation priority (1 = highest) |
| `action_steps` | `JSONB` | `NOT NULL DEFAULT '[]'` | Ordered array of step strings `["Step 1", "Step 2"]` |
| `target_audience` | `VARCHAR(50)` | `NOT NULL DEFAULT 'general'` | Intended user tier (`general`, `power_user`, `admin`) |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT true` | Visibility flag |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Last update timestamp |

### 6.4 Table 3: `articles` (Security Articles & Advisories)
Stores educational cybersecurity content and technical advisories.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique article identifier |
| `title` | `VARCHAR(250)` | `NOT NULL` | Editorial article title |
| `slug` | `VARCHAR(250)` | `NOT NULL UNIQUE` | URL-safe identifier (e.g. "why-length-beats-complexity") |
| `summary` | `TEXT` | `NOT NULL` | Brief teaser paragraph |
| `content` | `TEXT` | `NOT NULL` | Full article body formatted in Markdown |
| `category` | `VARCHAR(50)` | `NOT NULL` | Thematic category (e.g. "Cryptography", "Breach Analysis") |
| `tags` | `TEXT[]` | `NOT NULL DEFAULT '{}'` | Search and categorization tags |
| `author_name` | `VARCHAR(100)` | `NOT NULL DEFAULT 'CredLock Security Team'` | Author attribution |
| `read_time_minutes`| `SMALLINT` | `NOT NULL DEFAULT 3 CHECK (read_time_minutes > 0)` | Estimated reading time in minutes |
| `is_published` | `BOOLEAN` | `NOT NULL DEFAULT false` | Publication flag |
| `published_at` | `TIMESTAMPTZ` | `NULLABLE` | Public release timestamp |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Last update timestamp |

---

## 7. API Endpoint Specification

### 7.1 Unified JSON Response Envelope
All endpoints consistently return responses adhering to standard envelope contracts:

**Success Response (Single Item):**
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-11-20T12:00:00.000Z"
}
```

**Success Response (Paginated Collection):**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalRecords": 45,
    "totalPages": 5
  },
  "timestamp": "2026-11-20T12:00:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested breach record with ID ... was not found."
  },
  "timestamp": "2026-11-20T12:00:00.000Z"
}
```

### 7.2 Detailed Endpoints Matrix

| Domain | Method | Path | Access | Query / Body Params | Status Codes | Description |
| :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| **System** | `GET` | `/api/health` | Public | None | `200` | Health check & uptime telemetry |
| **Dashboard** | `GET` | `/api/v1/dashboard/summary` | Public | None | `200`, `500` | Aggregated intelligence overview |
| **Breaches** | `GET` | `/api/v1/breaches` | Public | `?search=&severity=&page=1&limit=10` | `200`, `400`, `500` | Paginated breach incidents list |
| | `GET` | `/api/v1/breaches/:id` | Public | Path: `id` (UUID) | `200`, `400`, `404` | Specific breach details |
| | `POST` | `/api/v1/breaches` | Protected | Body: Full breach payload (Zod validated) | `201`, `400`, `401` | Insert new breach incident |
| | `PUT` | `/api/v1/breaches/:id` | Protected | Path: `id`, Body: Partial/Full payload | `200`, `400`, `401`, `404` | Update existing breach incident |
| | `DELETE`| `/api/v1/breaches/:id` | Protected | Path: `id` (UUID) | `200`, `401`, `404` | Remove breach incident |
| **Recommendations**| `GET` | `/api/v1/recommendations` | Public | `?category=&risk_level=&priority=` | `200`, `400`, `500` | List security recommendations |
| | `GET` | `/api/v1/recommendations/:id` | Public | Path: `id` (UUID) | `200`, `400`, `404` | Specific recommendation |
| | `POST` | `/api/v1/recommendations` | Protected | Body: Recommendation payload | `201`, `400`, `401` | Insert new recommendation |
| | `PUT` | `/api/v1/recommendations/:id`| Protected | Path: `id`, Body: Partial update | `200`, `400`, `401`, `404` | Update recommendation |
| | `DELETE`| `/api/v1/recommendations/:id`| Protected | Path: `id` (UUID) | `200`, `401`, `404` | Remove recommendation |
| **Articles** | `GET` | `/api/v1/articles` | Public | `?category=&tag=&search=&page=1&limit=6` | `200`, `400`, `500` | List published articles |
| | `GET` | `/api/v1/articles/:id` | Public | Path: `id` (UUID or slug) | `200`, `404` | Read full article in markdown |
| | `POST` | `/api/v1/articles` | Protected | Body: Article payload | `201`, `400`, `401` | Create new article |
| | `PUT` | `/api/v1/articles/:id` | Protected | Path: `id`, Body: Article update | `200`, `400`, `401`, `404` | Edit article content |
| | `DELETE`| `/api/v1/articles/:id` | Protected | Path: `id` (UUID) | `200`, `401`, `404` | Delete article |

---

## 8. Frontend Integration Plan

### 8.1 Integration Strategy
To preserve the current 5-tab mobile-first Adaptive Capsule Navigation and avoid disrupting existing workflows, the new backend capabilities will be integrated non-destructively:

1. **Home Dashboard (`HomePage.tsx`)**:
   - Introduce an **Intelligence Telemetry Widget** (`SecurityIntelligenceWidget.tsx`) replacing or upgrading the existing Modul 1 widget.
   - Shows: Tracked breaches count, total exposed accounts across verified incidents, recent advisories, and backend status badge.
2. **Contextual In-App Guidance (Analyzer & Breach Checker)**:
   - **Analyzer Page:** When password strength score is low ($\le 2$), query `GET /api/v1/recommendations?category=password_hygiene&risk_level=high` and present high-priority action cards.
   - **Breach Checker Page:** When an exposure is identified via HIBP, offer a direct link to explore verified incident histories from `GET /api/v1/breaches`.
3. **Dedicated Security Intelligence Hub (`/intelligence` or `/security-feed`)**:
   - A clean editorial view showcasing recent public breaches and security articles with search and filtering.
   - Accessible via quick-action links from the Home Dashboard or Header without breaking bottom nav orientation.
4. **Detail Pages**:
   - `/intelligence/breaches/:id` (Incident overview, affected data classes, and remediation guide).
   - `/intelligence/articles/:slug` (Clean markdown reading experience formatted in Obsidian Vault style).

---

## 9. Security & Privacy Considerations

### 9.1 Zero-Knowledge Boundaries
* **Strict Privacy Invariant:** No plaintext passwords, generated passwords, hashes, or user account identifiers are ever sent to the CredLock Security Intelligence API.
* **Separation of Concerns:** The API is purely an information provider (read-only for normal users) and administrative data store for cybersecurity facts.

### 9.2 Credential & Secret Management
* **Client Frontend (`CredLock PWA`):** Never holds Supabase secret service-role keys or database passwords. Only public API endpoints are requested.
* **Backend API (`backend/credlock-api`):** Stores `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` exclusively inside server-side `.env`. The `.env` file is strictly ignored by Git.

### 9.3 Write Operation Protection (Admin Guard)
* While `GET` endpoints are open for public consumption by the PWA, all state-modifying operations (`POST`, `PUT`, `DELETE`) require a valid header:
  `X-API-KEY: <SECRET_ADMIN_KEY>`
* This prevents unauthorized tampering with public security data or article feeds without requiring a heavy, complex user authentication system.

### 9.4 Robustness & Hardening
* **CORS Whitelist:** Explicitly allows requests only from `http://localhost:5173` (dev) and verified production PWA domains.
* **Rate Limiting:** Protects against automated scraping and denial-of-service via `express-rate-limit` (e.g. 100 requests per 15 minutes per IP).
* **Sanitized Errors:** Internal stack traces and raw PostgreSQL error codes are never returned in JSON error responses.

---

## 10. Deployment Strategy

### 10.1 Architecture Deployment Matrix

| Component | Target Platform | Free-Tier Feasibility | Deployment Architecture |
| :--- | :--- | :---: | :--- |
| **CredLock Frontend (PWA)** | **Vercel** or **Netlify** | **High** | Static PWA build (`dist/`) distributed via global CDN. Automatic HTTPS and PWA Service Worker caching. |
| **CredLock Backend API** | **Render** or **Vercel Serverless** | **High** | Containerized Node.js Web Service on Render (Free tier) or Vercel Node Serverless functions (`/api/*`). |
| **Database** | **Supabase (PostgreSQL)** | **High** | Managed PostgreSQL on Supabase free tier (500 MB storage, active connection pooling). |

### 10.2 Production Connectivity
* In local development, the Vite reverse proxy handles `/api/v1` $\to$ `http://localhost:4000`.
* In production, the PWA client is configured with environment variable:
  `VITE_SECURITY_API_URL=https://credlock-api.onrender.com`
  accompanied by appropriate CORS origin headers on the backend.

---

## 11. Proposed Development Phases & Milestones

* **Phase 1: Architecture, Planning & Schema Design (CURRENT)**
  - Repository audit, system topology, database schema proposal, and API specification.
  - Deliverable: `docs/credlock-api-plan.md` (Review & Approval Gate).
* **Phase 2: Backend Workspace Initialization & Supabase Setup**
  - Scaffold `backend/credlock-api/` with TypeScript, Express, and ESLint.
  - Provision Supabase tables (`breaches`, `recommendations`, `articles`) and seed baseline cybersecurity data.
  - Setup environment configuration and Supabase client adapter.
* **Phase 3: Core API Endpoints & CRUD Implementation**
  - Implement health check and dashboard summary endpoints.
  - Implement controllers, validation schemas (Zod), and services for Breaches, Recommendations, and Articles.
  - Add API-key guard for write operations.
* **Phase 4: Backend Automated Testing & Documentation**
  - Implement automated test suite covering endpoints, validation errors, and status codes (`tests/*.test.ts`).
  - Generate OpenAPI / Swagger or Postman specification document.
* **Phase 5: Frontend PWA Integration**
  - Implement client HTTP service adapters in `src/services/api/securityIntelligenceService.ts`.
  - Add Home Dashboard telemetry widget and contextual recommendation cards in Analyzer/Breach Checker.
  - Verify PWA offline resilience and error boundaries.
* **Phase 6: End-to-End Verification & Cloud Deployment**
  - Verify cross-service communication, CORS, build scripts, and cloud hosting deployment.

---

## 12. Risks, Constraints & Scope Recommendations

1. **Scope Creep Defense:** The API must not attempt to become a complex user account system or password vault. It must remain focused on security intelligence and guidance.
2. **Cold-Start Latency:** Free-tier cloud hosting (e.g., Render free web services) may take 20–30 seconds to wake from idle. The frontend PWA must display informative, non-blocking loading states and cache responses locally in transient state or IndexedDB.
3. **Database Maintenance:** Use clean database migration scripts (`supabase/migrations/`) to ensure reproducible database provisioning across development environments.
