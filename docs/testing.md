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

### 3. Verification Method Distinctions

* **Automated Node & Build Checks:** Verified compilation, linting, packaging, and cryptographic/heuristic algorithm outputs using automated test runs.
* **Component Code Audits:** Verified accessible attributes (`aria-label`, `htmlFor`, `:focus-visible`, `role="progressbar"`, reduced motion media queries) directly in source code.
* **Interactive Live Browser Pass:** Manual testing will be performed in Phase 2.6 across browsers and mobile viewports.
