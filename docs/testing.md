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
| **2** | **Rejection Sampling** | `getSecureRandomInt(max)` bounds | Generates uniform values strictly in $[0, \text{max}-1]$ across pools 2, 10, 26, 32, 62, 94; rejects invalid bounds ($\le 0$, floats) | **PASS** |
| **3** | **Fisher-Yates Shuffle** | `secureShuffle(array)` | Produces unbiased set-preserving permutations with identical length and elements | **PASS** |
| **4** | **Length Accuracy** | Password lengths 8, 12, 16, 20, 24, 32, 48, 64 | Output password string length strictly matches requested parameter | **PASS** |
| **5** | **Category Coverage** | Guaranteed inclusion of all 4 active sets | Every generated password contains $\ge 1$ lowercase, $\ge 1$ uppercase, $\ge 1$ digit, $\ge 1$ symbol across 50 consecutive runs | **PASS** |
| **6** | **Minimum Length Category Coverage** | Length 8 with 4 active categories | All 4 character types present even at minimum boundary length ($L=8$) | **PASS** |
| **7** | **Category Exclusion** | Strict exclusion of unselected sets | When uppercase and symbols are disabled, output contains exactly 0 uppercase and 0 symbols across 30 runs | **PASS** |
| **8** | **Single Category Selection** | Pure symbols or pure uppercase generation | 100% of generated characters belong to the single active set | **PASS** |
| **9** | **Empty Category Validation** | Zero categories selected | Throws descriptive validation error; refuses generation | **PASS** |
| **10** | **Length Bounds Validation** | Lengths $< 8$, $> 64$, or non-integer floats | Rejected by `validateGeneratorOptions` and `generatePassword` | **PASS** |
| **11** | **Length Smaller Than Categories** | Length < number of selected sets | Throws descriptive error ($L=3$ with 4 categories selected) | **PASS** |
| **12** | **Web Crypto Unavailable Handling** | Simulates missing `crypto.getRandomValues` | Throws `WebCryptoUnavailableError`; strictly refuses `Math.random()` fallback | **PASS** |
| **13** | **Regenerate Behavior** | Consecutive runs with identical options | Generates distinct, independent cryptographic output keys | **PASS** |
| **14** | **Theoretical Entropy Calculation** | Information entropy formula $L \times \log_2(R)$ | Correctly computes 94-char pool (104.9 bits at $L=16$) and 10-char pool (26.6 bits at $L=8$) | **PASS** |

### 2. Automated Pipeline Verification

| Tool / Check | Command | Result | Verification Notes |
| :--- | :--- | :---: | :--- |
| **Unit Test Suite** | `npm test` | **PASS (20/20 tests pass)** | Runs 10 test suites covering all cryptographic constraints in 124 ms. |
| **TypeScript Compiler** | `npx tsc --noEmit` | **PASS (0 errors)** | Strict compiler flags satisfied with zero warnings or type casts. |
| **ESLint Linter** | `npm run lint` | **PASS (0 errors, 0 warnings)** | Clean linting pass with React hooks and unused vars enforced. |
| **Vite Production Build** | `npm run build` | **PASS** | Compiles 1696 modules; bundles vendor chunks cleanly in 5.8s. |

---

## Verification Method Distinctions

* **Automated Node & Build Checks:** Verified compilation, linting, packaging, and cryptographic/heuristic algorithm outputs using automated test runs.
* **Component Code Audits:** Verified accessible attributes (`aria-label`, `htmlFor`, `:focus-visible`, `role="progressbar"`, reduced motion media queries) directly in source code.
* **Interactive Live Browser Pass:** Manual testing will be performed in Phase 2.6 across browsers and mobile viewports.
