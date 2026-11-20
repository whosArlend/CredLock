# REST API Integration Strategy — CredLock

## Current Integration Status: Security Intelligence API (Phases 3.4A–3.4F) & HIBP Range API

CredLock integrates with:
1. **CredLock Security Intelligence API**: Dedicated Express.js + TypeScript service backed by Supabase PostgreSQL.
2. **Have I Been Pwned (HIBP) Range API**: Zero-knowledge k-anonymity breach verification service.

---

## 1. CredLock Security Intelligence API Overview

* **Service Name:** CredLock API (`backend/credlock-api`)
* **Base URL:** `http://localhost:4000/api/v1` (configurable via `VITE_CREDLOCK_API_URL`)
* **Technology:** Express.js, TypeScript, Supabase Managed PostgreSQL
* **Security Model:** Row-Level Security (RLS) policies, CORS origin whitelisting, published-only visibility

### Endpoints:
* `GET /api/v1/dashboard/summary` — Aggregated KPIs, global threat metrics, and cataloged intelligence telemetry.
* `GET /api/v1/breaches` — Paginated list of verified cybersecurity breach incidents with search, filtering, and sorting.
* `GET /api/v1/breaches/:slug` — Comprehensive incident detail by slug.
* `GET /api/v1/recommendations` — Actionable hardening playbooks and guidance by category/priority.
* `GET /api/v1/recommendations/:slug` — Recommendation detail and step-by-step implementation playbooks.
* `GET /api/v1/articles` — Peer-reviewed cybersecurity research advisories.
* `GET /api/v1/articles/:slug` — Full Markdown advisory content with math formulas and syntax blocks.
* `GET /health` — Service health probe.

---

## 2. External Privacy-Preserving API: Have I Been Pwned (HIBP) Range API

### 1. Endpoint Specification
* **URL:** `https://api.pwnedpasswords.com/range/{first5HashCharacters}`
* **Method:** `GET`
* **Protocol:** HTTPS / TLS 1.3
* **k-Anonymity Scope:** First 5 uppercase hexadecimal characters of the client-computed SHA-1 hash.

### 2. Request Headers
```http
GET /range/5BAA6 HTTP/1.1
Host: api.pwnedpasswords.com
Accept: text/plain
Add-Padding: true
```
* **`Add-Padding: true`**: Instructs the HIBP service to return synthetic padding entries to protect against packet size traffic analysis.

### 3. Response Format
Plaintext response where each line contains a 35-character hexadecimal suffix and an exposure count separated by a colon:
```text
003D68EB55068C33ACE09247EE4C639306B:3
012A7070EAE3A0261CB0804AEB1348F0650:12
014D735C15904D95A7FDDF7CAAC04EF8476:0
1E4C9B93F3F0682250B6CF8331B7EE68FD8:38241
```

### 4. Client-Side Evaluation
* CredLock parses all `<suffix>:<count>` pairs into a client-side hash map.
* An exact string comparison is executed between the user's computed suffix and the returned set.
* If a match exists with $\text{count} > 0$, the password is confirmed breached.
* If no match exists or $\text{count} = 0$ (padding), the password is confirmed unbreached in the queried database.
