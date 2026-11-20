# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-11-20

### Added

#### Core Security Tools (Client-Side Enclave)
- **Password Strength Analyzer**:
  - Real-time password evaluation powered by `@zxcvbn-ts/core` (v4.2.0), `@zxcvbn-ts/language-common`, and `@zxcvbn-ts/language-en`.
  - Detection and categorization of dictionary matches, spatial keyboard walks, sequential runs, repeat characters, and l33t substitutions.
  - Multi-scenario crack-time threat modeling: Online Throttled (100/hr), Online Unthrottled (10/sec), Offline Slow Hash (10,000/sec), and Offline Fast Hash (10,000,000,000/sec).
  - Explicit distinction between heuristic guess difficulty ($\log_2(\text{guesses})$) and theoretical character-pool entropy ($L \times \log_2(R)$).
  - Password visibility toggle (`Eye`/`EyeOff`) with accessible aria labeling and clear-input affordance.
- **Secure Password Generator**:
  - Powered exclusively by the native Web Crypto API (`window.crypto.getRandomValues()`); strictly disallows insecure `Math.random()`.
  - Integer rejection sampling threshold algorithm eliminating modulo bias across non-power-of-two character pools.
  - Candidate-level rejection sampling guaranteeing category coverage (lowercase, uppercase, numbers, symbols) while preserving a mathematically uniform probability distribution.
  - Configurable length slider and numeric stepper (8 to 64 characters) with quick presets (12, 16, 24, 32).
  - Transient memory scoping ensuring generated credentials exist only in volatile component memory and are never persisted to storage or transmitted over network sockets.
  - Copy-to-clipboard action with explicit clipboard accessibility disclosure.
- **Password Breach Checker**:
  - Client-side SHA-1 hashing via Web Crypto `crypto.subtle.digest('SHA-1', ...)`.
  - Mathematical k-anonymity range protocol transmitting only the first 5 hexadecimal characters of the hash to Have I Been Pwned (`https://api.pwnedpasswords.com/range/{prefix}`).
  - Support for `Add-Padding: true` request header preventing packet-length traffic analysis.
  - Local hash suffix comparison in volatile RAM; raw passwords and full hashes never leave the client device.
- **Sanitized History & Data Sovereignty**:
  - Persistent client-side audit logging backed by browser IndexedDB (`credlock-db`).
  - Strict Sanitization Invariant: Persists solely non-sensitive structural metadata (record UUIDv4, timestamp, score, length, theoretical entropy, crack time string, and breach occurrence count).
  - Invariant enforcement: Plaintext passwords, full hashes, SHA-1 prefixes, and SHA-1 suffixes are strictly excluded from history stores.
  - Complete data sovereignty controls allowing granular single-record deletion and complete store purge.

#### Security Intelligence REST API (`backend/credlock-api`)
- Decoupled microservice built with Express 5, TypeScript (NodeNext ESM), Zod, and Supabase PostgreSQL.
- **Threat Telemetry Dashboard**: `GET /api/v1/dashboard/summary` providing aggregated incident counts, compromised account totals, severity distribution, and recent breaches.
- **Breach Incident Catalog**: `GET /api/v1/breaches` and `GET /api/v1/breaches/:slug` providing verified incident reports, exposed data classes, breach dates, and source citations.
- **Security Recommendations**: `GET /api/v1/recommendations` and `GET /api/v1/recommendations/:slug` providing actionable hardening playbooks, priority levels, and suggested tooling.
- **Research Advisories**: `GET /api/v1/articles` and `GET /api/v1/articles/:slug` providing peer-reviewed educational articles with Markdown formatting.
- **Diagnostic Probes**: Independent liveness probe (`GET /api/health`) and database readiness probe with latency telemetry (`GET /api/health/db`).
- **Serverless Adapter**: Native deployment support for Vercel Serverless Functions (`api/index.ts`, `vercel.json`).

#### User Interface & Experience
- **Obsidian Vault × Cipher Ledger Design System**: Industrial warm-charcoal surfaces (`#0C0D0E`, `#131517`), Safety Amber accents (`#E5A93C`), Plus Jakarta Sans, and Space Mono typography.
- **Adaptive Capsule Navigation**: Dynamic navigation bar that smoothly contracts into a floating compact capsule during scrolling and resets upon route navigation.
- **Responsive Layout**: Seamless, compact layout optimized across mobile (360px), tablet, and desktop viewports without horizontal clipping.

#### Verification & Quality Assurance
- **297 Automated Tests**:
  - 179 frontend tests across 70 test suites verifying cryptography, CSPRNG rejection sampling, zxcvbn heuristics, k-anonymity partitioning, IndexedDB persistence, and navigation state machines.
  - 118 backend tests across 9 test suites verifying liveness/readiness probes, telemetry calculations, paginated filtering, Zod schema validation, Helmet headers, CORS origin reflection, rate limiting, and Vercel serverless exports.
- **TypeScript Strict Compliance**: 0 compiler errors under strict compiler flags (`strict`, `noImplicitAny`, `noUncheckedIndexedAccess`).

### Security

- **Zero-Knowledge Architecture**: Client passwords are never transmitted across network boundaries or stored in unencrypted persistent storage.
- **HTTP Security Headers (Helmet v8.3.0)**: Enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and `Cross-Origin-Resource-Policy: cross-origin`.
- **CORS Origin Whitelisting**: Strict origin validation via `FRONTEND_URL` environment variable; disallows wildcard `*` origins in production.
- **Rate Limiting**: Enforces a ceiling of 100 requests per 15 minutes per IP via `express-rate-limit` with standard `RateLimit-*` headers.
- **Payload Size Limits**: Strict 100kb request body limit preventing resource exhaustion.
- **Supabase Service Role Isolation**: Privileged database secret keys are restricted to backend environment variables and never bundled into client applications.
- **Immutable Visibility Invariants**: Database repository layer hardcodes `.eq('is_published', true)` and `.eq('is_verified', true)` to guarantee draft or unverified telemetry is never exposed to public consumers.

### Removed

- Completely removed legacy, unused Modul 1 / Sales-API telemetry code, widgets, components, and references from both frontend and backend.
