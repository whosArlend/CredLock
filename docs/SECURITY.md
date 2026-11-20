# CredLock Security & Privacy Architecture

This document outlines the security principles, cryptographic algorithms, privacy controls, and defensive engineering practices implemented across **CredLock**.

---

## 1. Zero-Knowledge Credential Handling Principle

CredLock operates under a zero-trust, client-first security model:

1. **Client-Side Execution Sandbox**:
   - Password analysis and password generation run **exclusively** within the browser's JavaScript memory sandbox.
   - Plaintext passwords are **never** transmitted across network sockets to the CredLock backend or any third-party service.
2. **Transient Component Scoping**:
   - In-memory password values exist only while the user interacts with the active tool view.
   - Navigating between views or clicking the clear button resets transient state, releasing references for garbage collection.
3. **Exclusion from Persistent Storage**:
   - Plaintext passwords, complete SHA-1 hashes, hash prefixes, and hash suffixes are **never written** to `localStorage`, `sessionStorage`, `IndexedDB`, cookies, service worker caches, or network telemetry logs.
4. **Sanitized History Invariant**:
   - The local history system in `src/services/historyStorage.ts` records **only** sanitized structural metadata:
     ```typescript
     export interface SanitizedAnalysisRecord {
       id: string;             // Client-generated UUIDv4
       timestamp: number;      // Epoch millisecond timestamp
       length: number;         // Password character length
       score: number;          // zxcvbn score (0 to 4)
       entropyBits: number;    // Theoretical pool entropy estimate
       crackTimeDisplay: string; // Human-readable crack time string
       hasUppercase: boolean;
       hasLowercase: boolean;
       hasNumbers: boolean;
       hasSymbols: boolean;
     }
     ```
   - Attempting to query or persist raw passwords, hashes, or credentials will fail the storage contract.

---

## 2. Cryptographic Implementations

### A. Web Crypto API CSPRNG & Rejection Sampling
CredLock uses the native **Web Crypto API** (`crypto.getRandomValues()`) for random number generation in `src/services/passwordGenerator.ts`:

- **Strict Elimination of `Math.random()`**: `Math.random()` is not a Cryptographically Secure Pseudo-Random Number Generator (CSPRNG) and is strictly disallowed in CredLock. If `crypto.getRandomValues` is unavailable in the environment, the generator aborts with a `WebCryptoUnavailableError`.
- **Modulo Bias Elimination**:
  Drawing random integers using `rand % max` introduces statistical bias toward lower numbers when the pool size is not a power of two. CredLock eliminates modulo bias using integer rejection sampling:
  $$\text{threshold} = 2^{32} - (2^{32} \pmod{\text{max}})$$
  Any 32-bit unsigned integer drawn above this threshold is discarded, ensuring a uniform distribution over $[0, \text{max} - 1]$.
- **Candidate-Level Rejection Sampling**:
  To guarantee category constraints (e.g. at least one uppercase, lowercase, digit, and symbol) without skewing the uniform distribution:
  1. Characters are selected independently and uniformly from the active character pool.
  2. The candidate string is tested against category criteria.
  3. If any required category is absent, the entire candidate is discarded and resampled independently.
  4. A hard limit (`MAX_GENERATOR_ATTEMPTS = 1000`) prevents denial-of-service in degenerate configurations.

### B. Mathematical Precision in Entropy Terminology
CredLock distinguishes among three distinct metrics to avoid misleading users:

1. **Estimated Guess-Work Difficulty (Crack Entropy)**:
   $$\text{Difficulty (bits)} = \log_2(\text{guesses})$$
   Derived from `@zxcvbn-ts/core` heuristic modeling of dictionary patterns, spatial keyboard walks, l33t speak, and common sequences under realistic attacker guessing orders.
2. **Theoretical Pool Entropy**:
   $$\text{Entropy}_{\text{pool}} = L \times \log_2(R)$$
   Where $L$ is password length and $R$ is character pool size (e.g. 94 for printable ASCII). This represents the theoretical upper bound assuming characters were chosen independently and uniformly. Real-world passwords chosen by humans exhibit significantly lower effective entropy.
3. **Shannon Information Entropy**:
   Defined over a known probability distribution $H(X) = -\sum P(x) \log_2 P(x)$. CredLock avoids labeling raw heuristic guess numbers as "Shannon Entropy" to uphold academic rigor.

### C. k-Anonymity Breach Detection Protocol
The breach checking tool in `src/services/breachChecker.ts` queries the Have I Been Pwned (HIBP) Pwned Passwords service using the **k-anonymity mathematical model**:

1. Client computes the SHA-1 hash of the password using Web Crypto `crypto.subtle.digest('SHA-1', ...)`.
2. Hash is split into a **5-character prefix** (20 bits) and a **35-character suffix** (140 bits).
3. Only the prefix is transmitted:
   ```http
   GET https://api.pwnedpasswords.com/range/5BAA6 HTTP/1.1
   Add-Padding: true
   ```
4. The remote service returns ~500–1000 candidate suffixes that share that 5-character prefix along with synthetic padding to prevent packet length fingerprinting.
5. Suffix comparison occurs strictly in local client memory.

---

## 3. Backend API Security Controls

The CredLock Security Intelligence API (`backend/credlock-api`) enforces strict multi-tier protections:

### A. HTTP Security Headers (Helmet)
Configured via `helmet` (v8.3.0) in `src/middleware/security.ts`:
- **`X-Content-Type-Options: nosniff`**: Prevents MIME-type sniffing.
- **`X-Frame-Options: SAMEORIGIN`**: Mitigates clickjacking.
- **`X-DNS-Prefetch-Control: off`**: Restricts speculative DNS lookups.
- **`Strict-Transport-Security`**: Enforces HTTPS transport.
- **`Cross-Origin-Resource-Policy: cross-origin`**: Permits verified cross-origin consuming applications while isolating resources.
- **`Content-Security-Policy: false`**: CSP is intentionally disabled on the API backend because it serves JSON payloads, not HTML documents (CSP is managed on the frontend PWA).

### B. CORS Origin Whitelisting
CORS is restricted in `src/middleware/security.ts` using the configured `FRONTEND_URL` environment variable:
- Only explicitly whitelisted origins (such as `https://credlock.vercel.app` or `http://localhost:5173` for development) receive `Access-Control-Allow-Origin`.
- Disallows wildcard `*` origins in production.
- Handles preflight `OPTIONS` requests cleanly.

### C. Rate Limiting
Configured using `express-rate-limit`:
- Enforces a ceiling of **100 requests per 15 minutes per IP**.
- Returns HTTP 429 Too Many Requests with standardized error envelope:
  ```json
  {
    "success": false,
    "error": {
      "code": "RATE_LIMIT_EXCEEDED",
      "message": "Too many requests. Please try again later."
    }
  }
  ```
- Exposes standard headers: `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset`.

### D. Supabase Secret Key Isolation & Row-Level Visibility
- The backend communicates with Supabase PostgreSQL using the privileged service role key (`SUPABASE_SECRET_KEY`), completely isolated from client bundles.
- Because service role keys bypass Row-Level Security (RLS), the repository layer (`src/repositories/`) strictly enforces hardcoded visibility filters on every query:
  - `breaches`: `.eq('is_published', true).eq('is_verified', true)`
  - `recommendations`: `.eq('is_published', true)`
  - `articles`: `.eq('is_published', true)`
- Draft, unverified, or internal records can never be returned to public consumers.

---

## 4. Known Limitations & Security Boundaries

CredLock does not claim absolute security or formal cryptographic certification:

1. **Client Device Compromise**: If the client workstation is infected with keystroke logging malware, browser extension spyware, or memory dumping utilities, client-side cryptographic guarantees are rendered ineffective.
2. **Clipboard Interception**: When a user copies a generated password to the clipboard, other local desktop applications with clipboard monitoring permissions could potentially read the transient value.
3. **k-Anonymity Traffic Analysis**: While k-anonymity with padding hides the exact password hash, an adversary capable of inspecting network traffic can determine that a breach check took place at a given timestamp.
4. **Heuristic Strength Estimates**: Heuristic models like zxcvbn estimate brute-force search space based on known dictionaries and models. They cannot predict bespoke dictionary attacks targeting personal user information (e.g. pet names or phone numbers) unknown to the dictionary.
