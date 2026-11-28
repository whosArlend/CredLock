# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.0] - 2026-11-28

### Added

#### Multi-Method Password Analysis & Sequence Modeling
- **Method Selector Segmented Interface**: Introduced a tactical 4-mode analysis workbench (`Zxcvbn`, `Keyspace Entropy`, `Markov Chain (Experimental)`, and `Compare All`).
- **Theoretical Keyspace Entropy Engine**: Calculates theoretical Shannon-style entropy $H = L \times \log_2(R)$ across detected character categories ($26+26+10+33$), explicitly highlighting the uniform-randomness assumption and contrasting it with human selection bias.
- **1st-Order Markov Chain Sequence Estimator (Experimental)**:
  - Probabilistic character transition analysis using base-2 log-probabilities ($\log_2 P$) to prevent underflow.
  - Metrics include total surprisal bits ($-\log_2 P$), average surprisal ($\overline{S} = -\log_2 P / L$ bits/char), sequence perplexity ($2^{\overline{S}}$), and a normalized predictability index (0–100).
  - Diagnostic breakdown identifying top predictable transitions and unusual/surprising character sequences.
  - Fully transparent heuristic baseline model incorporating English digraph frequencies, keyboard walks, and decimal sequences with Laplace smoothing for unseen pairs.
  - Transparent academic caveats: clearly labeled as an experimental heuristic rather than a validated empirical crack model, with zero reliance on unvetted leak corpora.
- **Multi-Method Comparative Synthesis**:
  - Simultaneous evaluation across all three methodologies in a side-by-side dashboard.
  - Automated divergence detection highlighting when passwords appear strong under theoretical keyspace ($H$) but fail pattern or sequence checks (e.g. `Password123!`).
  - Side-by-side methodological matrix contrasting core assumptions, threat models, and recommended application contexts.
- **Enhanced Sanitized Dossier Archiving**:
  - Extended local IndexedDB audit ledger records to capture selected method, theoretical entropy, and Markov surprisal metrics.
  - Invariant maintained: zero plaintext passwords or character sequences are ever saved or transmitted.

---

## [2.0.0] - 2026-11-25

### Added

#### Identity Enclave & Owner Isolation (Phases 1–5)
- **Username-Only Authentication**: Client-side authentication via Supabase Auth requiring only a username and master passphrase (zero email/phone number collection).
- **PostgreSQL Least Privilege & RLS**: Enforced strict Row Level Security policies and column-level privileges on user profiles.
- **Dynamic Profile Enclave Indicator**: Real-time identification of active session identity (`@username` authenticated session vs Guest mode) with account-scoped storage details.
- **Owner-Scoped Local Storage Isolation**: Partitioned browser IndexedDB storage (`credlock-db`) by user ID, ensuring audit history remains strictly isolated between accounts and guest mode on shared devices.
- **History Privacy Scope Badges**: Dedicated visual scope indicators (`Scope: @username` or `Scope: Guest Session`) across Analysis History and Breach History views.
- **Shared-Device Privacy Notices**: Persistent contextual warnings reminding users that local history persists past logout on shared machines unless explicitly purged.
- **Data Sovereignty Warning Clarity**: Enhanced confirmation dialog explaining local scope, deletion impact, and authentication session preservation.

#### Backend Security Hardening (Phase 6)
- **Distributed Serverless Rate Limiting (BE-01)**: Implemented distributed rate-limiting store backed by Upstash Redis REST API using native `fetch` (zero external dependencies) with atomic pipeline execution (`INCR`, `PEXPIRE NX`, `PTTL`).
- **Supabase Least-Privilege API Client (BE-02)**: Switched backend API queries to use Supabase anonymous key subject to Row Level Security, eliminating unrestricted service role admin key usage.
- **Strict Slug Parameter Validation (BE-03)**: Centralized regex validation (`^[a-z0-9]+(?:-[a-z0-9]+)*$`, 1–100 chars) preventing SQL injection, path traversal, and malicious input before repository queries.
- **Hardened Health Diagnostics (BE-04)**: Omitted database query latency metrics from public `/api/health/db` responses to prevent infrastructure profiling and side-channel timing analysis.

#### Repository & Architecture Accuracy
- **Centralized Versioning**: Introduced single source of truth for application versions across UI banners, metadata, PWA manifest, and backend discovery endpoints.
- **Defensible Privacy Declarations**: Fully aligned About and Profile pages with the actual implemented architecture, clarifying local IndexedDB boundaries and distinguishing current capabilities from future research roadmaps.

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
