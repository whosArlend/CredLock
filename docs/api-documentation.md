# Custom REST API Integration Strategy — CredLock

## Current Integration Status: Phase 2.7B.1 Minimal Integration Verified

CredLock integrates with the user's **Modul 1 (Sales-API)** REST Web Service via a decoupled, read-only adapter architecture.

---

## 1. Modul 1 (Sales-API) Integration Overview

* **Service Name:** Sales-API (Express.js + Supabase backend)
* **Integration Phase:** Phase 2.7B.1 Minimal Integration
* **Integrated Endpoint:** `GET /api/reports/total`
* **Purpose:** Demonstrates live client-to-backend REST API communication by retrieving the aggregate customer count from the Modul 1 database and surfacing live connection telemetry on the CredLock Home Dashboard.

### Technical Contract:
* **HTTP Method:** `GET`
* **Request Headers:** `Accept: application/json`
* **Request Body:** None (zero payload)
* **Response Format:** Numeric count (e.g. `42`) or JSON object with count (`{ "count": 42 }` or `{ "total": 42 }`)
* **Error Response:** JSON with error message (`{ "error": "..." }`) or standard HTTP status codes

---

## 2. Local Development & Vite Proxy Configuration

Because Sales-API operates locally on port `3000` without Cross-Origin Resource Sharing (`cors`) headers, CredLock configures a **Vite development proxy** to eliminate browser origin blocks during local evaluation:

```typescript
// vite.config.ts
server: {
  port: 5173,
  host: true,
  proxy: {
    '/modul1-api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/modul1-api/, ''),
    },
  },
}
```

### Running the Services Locally:
1. **Start Sales-API (Backend):**
   Navigate to `Praktikum PPB/Mod. 1/Sales-API` and run:
   ```bash
   npm run dev
   # Starts Express server on http://localhost:3000
   ```
2. **Start CredLock (Frontend):**
   In the CredLock workspace, run:
   ```bash
   npm run dev
   # Starts Vite PWA dev server on http://localhost:5173
   ```
3. **Local Route Resolution:**
   The frontend requests `/modul1-api/api/reports/total`. Vite proxies the request to `http://localhost:3000/api/reports/total`.

### Known Production Limitation:
> **Important:** The Vite development proxy (`server.proxy`) exists **only** during local development (`npm run dev`). In a production static deployment (e.g., Vercel, Netlify, GitHub Pages), this proxy is not present. For production deployment, a dedicated reverse proxy rule, serverless proxy route, or backend CORS configuration must be provisioned.

---

## 3. Privacy & Zero-Knowledge Invariants

The Modul 1 integration strictly maintains CredLock's local security boundaries:
* **Read-Only Scope:** Only the aggregate non-sensitive total customer count is queried.
* **Zero Credential Exposure:** Plaintext passwords, hashes, prefixes, and breach records are NEVER transmitted to Sales-API.
* **No Persistence:** API telemetry and customer counts exist solely in transient React component state and are never written to IndexedDB or localStorage.
* **Timeout Guarantee:** All requests use an `AbortController` signal enforcing a strict 5-second deadline, preventing UI hangs.
* **Graceful Degradation:** When Sales-API is offline, the widget displays a clean `Sales-API Offline` indicator without breaking any core security features.

---

## 4. External Privacy-Preserving API: Have I Been Pwned (HIBP) Range API

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
