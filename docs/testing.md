# Testing & Verification — CredLock

## Overview
This document tracks the testing strategies, test matrices, and verification runs executed across the development phases of CredLock.

---

## Phase 2.3 — Password Strength Analyzer Verification

### 1. Functional Test Matrix

| Test Case | Input | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Empty Input** | `""` | Score: 0, Label: "Very Weak", 0 bits, neutral composition, prompt to type | Matches expected | **PASS** |
| **Common Password** | `"password123"` | Score: 0, Warning: "This is a commonly used password.", dictionary pattern identified | Matches expected | **PASS** |
| **Sequential Run** | `"12345678"` | Score: 0, Sequence pattern identified, instant crack time | Matches expected | **PASS** |
| **Repeated Chars** | `"aaaaAAAA1111"` | Score: 1, Warning: "Repeated characters", suggestions to vary chars | Matches expected | **PASS** |
| **Passphrase** | `"correct-horse-battery-staple"` | Score: 4, Label: "Very Strong", high guess count ($\ge 10^{12}$), crack time centuries | Matches expected | **PASS** |
| **Complex Random** | `"K9#vL2$mQ8!zW5*p"` | Score: 4, Label: "Very Strong", all 4 composition badges active, high guess difficulty | Matches expected | **PASS** |
| **Password Visibility** | Click eye icon | Toggles input type between `password` and `text` with accessible `aria-label` | Verified in component inspection | **PASS** |
| **Clear Input Control** | Click X icon | Resets input to empty string; clears score, indicators, and feedback instantly | Verified in component inspection | **PASS** |
| **Sanitized Archival** | Click "Save to Analysis History" | Saves sanitized metadata (`id`, `timestamp`, `score`, `entropyBits`, flags) to storage | Verified via automated script | **PASS** |
| **Zero Plaintext Leakage** | Inspect saved record | `password`, full hash, prefix, or suffix are NOT present in record object | Confirmed (`false` on `'password' in record`) | **PASS** |

---

### 2. Automated Pipeline Verification

| Tool / Check | Command | Result | Verification Notes |
| :--- | :--- | :---: | :--- |
| **TypeScript Compiler** | `npx tsc --noEmit` | **PASS (0 errors)** | Strict compiler flags satisfied (`strict`, `noImplicitAny`, `noUncheckedIndexedAccess`). |
| **ESLint Linter** | `npm run lint` | **PASS (0 errors, 0 warnings)** | React Fast Refresh, React Hooks, and unused variables clean. |
| **Vite Production Build** | `npm run build` | **PASS** | Code chunking cleanly splits `zxcvbn-vendor` (1.66 MB / gzip: 838 kB) and main app bundle (421 kB). |

---

## Phase 2.4 — Secure Password Generator Verification

### 1. Functional & Cryptographic Test Matrix (`npm test`)

| # | Test Area | Test Description | Invariant Verified | Status |
| :-: | :--- | :--- | :--- | :---: |
| **1** | **CSPRNG Availability** | Detection of Web Crypto API | `crypto.getRandomValues` function present and accessible | **PASS** |
| **2** | **Unbiased Integer Sampling** | `getSecureRandomInt(max)` bounds | Generates uniform values strictly in $[0, \text{max}-1]$ across pools 2, 10, 26, 32, 62, 94; rejects invalid bounds ($\le 0$, floats) | **PASS** |
| **3** | **Fisher-Yates Shuffle** | `secureShuffle(array)` | Produces unbiased set-preserving permutations with identical length and elements | **PASS** |
| **4** | **Length Accuracy** | Password lengths 8, 12, 16, 20, 24, 32, 48, 64 | Output password string length strictly matches requested parameter | **PASS** |
| **5** | **Candidate-Level Rejection** | `satisfiesCategoryConstraints` | Discards candidate strings lacking any required category; accepts candidates satisfying all active categories | **PASS** |
| **6** | **Category Coverage** | Guaranteed inclusion of all active sets | Every accepted password contains $\ge 1$ lowercase, $\ge 1$ uppercase, $\ge 1$ digit, $\ge 1$ symbol across 50 consecutive runs | **PASS** |
| **7** | **Minimum Length Category Coverage** | Length 8 with 4 active categories | All 4 character types present even at minimum boundary length ($L=8$) | **PASS** |
| **8** | **Strict Pool Membership** | Every character belongs to active pool | Every character in accepted output belongs to enabled pool; excluded categories produce 0 occurrences | **PASS** |
| **9** | **Single Category Selection** | Pure symbols or pure uppercase generation | 100% of generated characters belong to the single active set | **PASS** |
| **10** | **Empty Category Validation** | Zero categories selected | Throws descriptive validation error; refuses generation | **PASS** |
| **11** | **Length Bounds Validation** | Lengths $< 8$, $> 64$, or non-integer floats | Rejected by `validateGeneratorOptions` and `generatePassword` | **PASS** |
| **12** | **Length Smaller Than Categories** | Length < number of selected sets | Throws descriptive error ($L=3$ with 4 categories selected) | **PASS** |
| **13** | **Defensive Retry Boundary** | Exceeding `maxAttempts` | Throws `GenerationAttemptLimitExceededError`; never returns invalid candidate or falls back to weaker RNG | **PASS** |
| **14** | **Web Crypto Unavailable Handling** | Simulates missing `crypto.getRandomValues` | Throws `WebCryptoUnavailableError`; strictly refuses `Math.random()` fallback | **PASS** |
| **15** | **Operational Output Independence** | Consecutive runs produce distinct keys | Operational sanity check confirming state freshness (explicitly noted: not proof of randomness) | **PASS** |
| **16** | **Theoretical Pool Entropy Calculation** | Information entropy formula $L \times \log_2(R)$ | Correctly computes 94-char pool (104.9 bits at $L=16$) and 10-char pool (26.6 bits at $L=8$) labeled as pool-based estimate | **PASS** |

### 2. Automated Pipeline Verification

| Tool / Check | Command | Result | Verification Notes |
| :--- | :--- | :---: | :--- |
| **Unit Test Suite** | `npm test` | **PASS (24/24 tests pass)** | Runs 10 test suites covering all cryptographic constraints in ~325 ms. |
| **TypeScript Compiler** | `npx tsc --noEmit` | **PASS (0 errors)** | Strict compiler flags satisfied with zero warnings or type casts. |
| **ESLint Linter** | `npm run lint` | **PASS (0 errors, 0 warnings)** | Clean linting pass with React hooks and unused vars enforced. |
| **Vite Production Build** | `npm run build` | **PASS** | Compiles 1696 modules; bundles vendor chunks cleanly in 5.7s. |

---

## Phase 2.5 — Password Breach Checker Verification

### 1. Functional & Privacy Test Matrix (`tests/breach.test.ts`)

| # | Test Area | Test Description | Invariant Verified | Status |
| :-: | :--- | :--- | :--- | :---: |
| **1** | **SHA-1 Hashing** | RFC 3174 standard vector (`"abc"`) & artificial fixtures | Produces exact 40-character uppercase hexadecimal digest via `crypto.subtle.digest` | **PASS** |
| **2** | **Digest Determinism** | Consecutive hash evaluations | Produces identical uppercase hex strings across identical inputs | **PASS** |
| **3** | **Hash Splitting** | `splitSha1Hash` 40-char decomposition | Exactly 5 characters for prefix, 35 characters for suffix, and $\text{prefix} + \text{suffix} = \text{hash}$ | **PASS** |
| **4** | **Malformed Hash Handling** | Hashes $<40$, $>40$, or non-hex characters | Explicitly throws `BreachCheckError` without proceeding | **PASS** |
| **5** | **Request Confidentiality** | Outgoing fetch URL inspection | Transmits ONLY `https://api.pwnedpasswords.com/range/{prefix}`; plaintext password, full hash, and suffix NEVER appear in URL or headers | **PASS** |
| **6** | **Traffic Padding Header** | Request header verification | Verifies `Add-Padding: true` is set on every HIBP range query | **PASS** |
| **7** | **Range Response Parsing** | Suffix list extraction (`<suffix>:<count>`) | Correctly parses CRLF/LF separated lines into typed map; ignores whitespace and padding entries | **PASS** |
| **8** | **Breached Match Detection** | Matching suffix with count $>0$ | Correctly flags `isBreached: true` and extracts exact numerical breach frequency | **PASS** |
| **9** | **Unbreached Match Detection** | Suffix absent from range response | Correctly flags `isBreached: false` and sets `breachCount: 0` | **PASS** |
| **10** | **Synthetic Padding Filtering** | Matching suffix with $\text{count} = 0$ | Correctly treats count 0 as unbreached padding entry | **PASS** |
| **11** | **Empty Input Rejection** | Empty string `""` and whitespace-only `" "` | Throws `EmptyPasswordError` immediately without making any network request | **PASS** |
| **12** | **HTTP Error Handling** | Mocked 429 Too Many Requests and 500 responses | Throws `BreachApiError` with exact status code and user-actionable message | **PASS** |
| **13** | **Network Failure Handling** | Network disconnect (`TypeError: Failed to fetch`) | Throws `BreachNetworkError` with actionable connection guidance | **PASS** |
| **14** | **Timeout & Cancellation** | `AbortSignal` triggering or timeout | Throws `BreachTimeoutError` and cleanly terminates query | **PASS** |
| **15** | **Malformed Response Resiliency** | Garbage API text without colons or hex | Gracefully handles malformed content without crashing or false positives | **PASS** |
| **16** | **Sanitized History Guarantee** | `SanitizedBreachRecord` storage inspection | Stored record contains strictly `id`, `timestamp`, `isBreached`, `breachCount`. Plaintext password, full hash, prefix, and suffix are completely excluded | **PASS** |

### 2. Automated Pipeline Verification

| Tool / Check | Command | Result | Verification Notes |
| :--- | :--- | :---: | :--- |
| **Unit Test Suite** | `npm test` | **PASS (42/42 tests pass)** | Runs 18 test suites covering Analyzer, Generator, Meter, and Breach Checker in ~260 ms. |
| **TypeScript Compiler** | `npx tsc --noEmit` | **PASS (0 errors)** | Strict compiler validation passed with zero type errors. |
| **ESLint Linter** | `npm run lint` | **PASS (0 errors, 0 warnings)** | Clean linting pass with React hooks and unused vars enforced. |
| **Vite Production Build** | `npm run build` | **PASS** | Production bundle compiled cleanly in ~5.2s. |

---

## Phase 2.6 — History, Detail & IndexedDB Persistence Verification

### 1. Functional & Storage Test Matrix (`tests/history.test.ts`)

| # | Test Area | Test Description | Invariant Verified | Status |
| :-: | :--- | :--- | :--- | :---: |
| **1** | **Database Configuration** | Database name & version constants | Verifies `DB_NAME === 'credlock-db'` and `DB_VERSION === 1` | **PASS** |
| **2** | **Store Separation** | Dedicated object stores | Confirms distinct stores for `analysis_history` and `breach_history` | **PASS** |
| **3** | **Chronological Sorting** | Multiple records retrieval | Asserts records are sorted descending by `timestamp` (newest first) | **PASS** |
| **4** | **Record Retrieval by ID** | `getAnalysisRecordById` / `getBreachRecordById` | Accurately retrieves the target record matching unique UUID | **PASS** |
| **5** | **Single Item Deletion** | `deleteAnalysisRecordAsync` / `deleteBreachRecordAsync` | Removes target record without mutating or corrupting remaining entries | **PASS** |
| **6** | **Global Store Flush** | `clearAllHistoryAsync` / `clearAllCredLockData` | Wipes both `analysis_history` and `breach_history` completely | **PASS** |
| **7** | **Zero-Knowledge Sanitization** | Stored record property assertion | Verifies `password`, `hash`, `sha1`, `prefix`, and `suffix` are strictly absent | **PASS** |
| **8** | **IndexedDB Availability Check** | Runtime detection | Accurately detects `window.indexedDB` support | **PASS** |
| **9** | **Transactional Read/Write** | Mocked IndexedDB transactions | Verifies `openCredLockDatabase`, `putInStore`, `getByIdFromStore`, `getAllFromStore` lifecycle | **PASS** |
| **10** | **Complete Store Cleanup** | `clearAllCredLockData` execution | Wipes all object stores within the database | **PASS** |

### 2. Automated Pipeline Verification

| Tool / Check | Command | Result | Verification Notes |
| :--- | :--- | :---: | :--- |
| **Unit Test Suite** | `npm test` | **PASS (52/52 tests pass)** | Runs 23 test suites covering Analyzer, Generator, Meter, Breach, and IndexedDB History in ~580 ms. |
| **TypeScript Compiler** | `npx tsc --noEmit` | **PASS (0 errors)** | Strict compiler validation passed with zero type errors. |
| **ESLint Linter** | `npm run lint` | **PASS (0 errors, 0 warnings)** | Clean linting pass with React hooks and unused vars enforced. |
| **Vite Production Build** | `npm run build` | **PASS** | Production bundle compiled cleanly in 20.63s. |

---

## Verification Method Distinctions



* **Automated Node & Build Checks:** Verified compilation, linting, packaging, and cryptographic/heuristic algorithm outputs using automated test runs.
* **Component Code Audits:** Verified accessible attributes (`aria-label`, `htmlFor`, `:focus-visible`, `role="progressbar"`, reduced motion media queries) directly in source code.
* **Interactive Live Browser Pass:** Manual testing will be performed in Phase 2.6 across browsers and mobile viewports.
