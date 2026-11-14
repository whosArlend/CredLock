# Development Log — CredLock

## Entry: Phase 2.4 — Security Audit & Mathematical Corrections
**Date:** 2026-11-14  
**Status:** Completed & Verified

### Actions Taken:
1. **Candidate-Level Rejection Sampling Distribution:**
   - Identified non-uniformity in the initial forced-category-slot approach (which biased permutations where categories appeared multiple times).
   - Replaced with candidate-level rejection sampling: selects all positions independently and uniformly from the active combined pool, tests candidates against active categories (`satisfiesCategoryConstraints`), and rejects candidates missing any category.
   - Mathematically proven uniform: because all candidate strings in $\Sigma^L$ have equal unconditional probability $(1/|\Sigma|)^L$, conditional probability given acceptance is $1/|V|$ for every valid password.
   - Enforced defensive retry limit `MAX_GENERATOR_ATTEMPTS = 1000` throwing `GenerationAttemptLimitExceededError` without falling back.
2. **Entropy Terminology Recalibration:**
   - Replaced all instances of "Theoretical Entropy" with "Theoretical Pool Entropy" / "Pool-Based Entropy Estimate".
   - Documented that $L \times \log_2(\text{Pool})$ is a theoretical upper-bound estimate assuming unconstrained uniform selection, and category requirements slightly constrain the valid keyspace.
   - Ensured no claims are made regarding measured entropy.
3. **Navigation State Lifecycle Security:**
   - Audited the "Test in Analyzer" transition from `GeneratorPage` to `AnalyzerPage`.
   - Verified that credentials are never stored in URLs, query parameters, `localStorage`, `sessionStorage`, or `IndexedDB`.
   - Added immediate history state purge in `AnalyzerPage.tsx`: executes `navigate(location.pathname, { replace: true, state: null })` on component mount, wiping `prefillPassword` from `window.history.state` so that browser refresh (F5) or back/forward navigation does not restore the secret.
4. **Test Suite Enhancements (`tests/generator.test.ts`):**
   - Expanded test suite from 20 to 24 tests across 10 suites.
   - Added tests for candidate rejection, strict pool membership, defensive retry limit, and accurate pool-based entropy calculation.
   - Added explicit comments documenting that consecutive output variance is an operational check, not mathematical proof of cryptographic quality.
5. **Verification Pipeline:**
   - `npm test`: 24/24 tests passed in ~325 ms.
   - `npx tsc --noEmit`: 0 errors.
   - `npm run lint`: 0 errors, 0 warnings.
   - `npm run build`: Compiled cleanly in 5.7s.

---

## Entry: Phase 2.4 — Secure Password Generator Implementation
**Date:** 2026-11-14  
**Status:** Completed & Verified

### Actions Taken:
1. **Cryptographic Engine Implementation (`src/services/passwordGenerator.ts`):**
   - Utilized native Web Crypto API (`crypto.getRandomValues()`). Strictly prohibited `Math.random()`.
   - Implemented rejection sampling algorithm (`getSecureRandomInt`) to eliminate modulo bias when mapping 32-bit uints onto arbitrary character pool sizes ($N$).
   - Implemented unbiased Fisher-Yates shuffle (`secureShuffle`) utilizing CSPRNG.
   - Defined 4 character categories: Lowercase (26), Uppercase (26), Numbers (10), and Symbols (32 printable ASCII characters).
   - Enforced guaranteed category coverage: at least 1 character is picked from each active category, remaining slots are filled from the combined pool, and the entire array is shuffled securely.
   - Implemented `WebCryptoUnavailableError` to prevent silent fallback to insecure PRNGs.
   - Calculated theoretical character pool size and theoretical entropy bits ($L \times \log_2(R)$).
2. **UI Component Implementation (`src/features/generator/components/`):**
   - `PasswordDisplay.tsx`: High-contrast monospace password display with show/hide toggle (`Eye`/`EyeOff`), copy action with non-absolute clipboard disclosure, regenerate action (`RotateCw`), and memory-clear action (`Trash2`).
   - `LengthControl.tsx`: Range slider (8 to 64) with stepper controls, visual length tier badge (Basic, Strong, High Entropy), and quick presets (12, 16, 24, 32).
   - `CategoryToggles.tsx`: Checkbox toggles with character examples, pool size badges, live total pool count, and theoretical entropy indicators.
   - `GeneratorNoticeCard.tsx`: Educational card outlining CSPRNG rejection sampling, in-memory zero-knowledge lifecycle, and clipboard security trade-offs.
3. **Page Integration (`src/pages/GeneratorPage.tsx`):**
   - Wired options, real-time generation, validation alerts, toast feedback, and memory-clear handling.
   - Connected optional transition "Test in Analyzer" which passes the generated password directly via React Router navigation state (preventing URL query leakage).
   - Updated `AnalyzerPage.tsx` to accept prefilled passwords from router state without persistent storage.
4. **Automated Testing Suite (`tests/generator.test.ts` & `package.json`):**
   - Added `"test": "node --test tests/**/*.test.ts"` script.
   - Implemented 20 automated unit tests covering all 10 cryptographic, validation, and boundary conditions.
5. **Testing & Verification:**
   - `npm test`: 20/20 tests passed across 10 test suites in 124 ms.
   - `npx tsc --noEmit`: 0 errors.
   - `npm run lint`: 0 errors, 0 warnings.
   - `npm run build`: Compiled 1696 modules successfully in 5.8s.

---

## Entry: Phase 2.3 — Password Strength Analyzer Implementation
**Date:** 2026-11-14  
**Status:** Completed & Verified

### Actions Taken:
1. **Dependency Integration:**
   - Installed `@zxcvbn-ts/core` (v4.2.0), `@zxcvbn-ts/language-common` (v4.1.3), and `@zxcvbn-ts/language-en` (v4.1.1).
   - Configured Vite code splitting in `vite.config.ts` (`zxcvbn-vendor` chunk) to isolate dictionary data and optimize app load performance.
2. **Password Analysis Engine (`src/services/passwordAnalyzer.ts`):**
   - Initialized `ZxcvbnFactory` with combined common and English dictionaries.
   - Implemented heuristic evaluation generating score (0 to 4), score labels, crack difficulty bits ($\log_2(\text{guesses})$), four multi-scenario crack times, and pattern extraction.
   - Enforced strict privacy: evaluation operates exclusively in local browser memory. No console logs, network payloads, or storage writes occur.
3. **UI Components (`src/features/analyzer/components/`):**
   - Implemented `PasswordInput` with password visibility toggle (`Eye`/`EyeOff`), clear input button (`X`), character counter, accessible ARIA labels, and `autocomplete="off"`.
   - Implemented `StrengthMeter` with 4-segment color progress indicator, score label badge, and crack difficulty metrics.
   - Implemented `CharacterCompositionBadges` with real-time counts for lowercase, uppercase, numbers, and symbols, plus theoretical pool entropy calculation.
   - Implemented `CrackTimeScenarios` showing estimated crack times across 4 attack models (Offline Slow, Offline Fast, Online Unthrottled, Online Throttled) with methodology disclaimer.
   - Implemented `FeedbackCard` presenting actionable warnings, suggestions, and detected patterns (dictionary matches, sequence runs, spatial key walks).
   - Implemented `PrivacyNoticeCard` explaining local zero-knowledge evaluation without false guarantees.
4. **History Integration:**
   - Implemented "Save to Analysis History" user action in `AnalyzerPage`.
   - Generates sanitized record (`createSanitizedAnalysisRecord()`) containing UUID, timestamp, length, score, entropy bits, composition booleans, and crack time.
   - Appends to in-memory history (`addAnalysisRecord()`).
   - Verified that saved entries appear in `/analysis-history` and navigate to parameterized `/analysis-history/:id` detail views.
5. **Testing & Verification:**
   - Automated script verified empty, weak ("password123"), and strong ("Tr0ub4dor&3_Horse!") password evaluations.
   - Confirmed sanitized record contains zero plaintext password, hash, or password-derived identifiers.
   - `npx tsc --noEmit` passed with 0 errors.
   - `npm run lint` passed with 0 errors and 0 warnings.
   - `npm run build` compiled successfully (1691 modules, vendor chunks cleanly emitted).

---

## Entry: Phase 2.2 — Security Review & Final Correction
**Date:** 2026-11-14  
**Status:** Completed & Verified

### Actions Taken:
1. **Removal of SHA-1 Prefixes from History:**
   - Removed `hashPrefix` from `SanitizedBreachRecord` and all UI/data layers.
2. **Purge of Mock / Fabricated Security Records:**
   - Removed hardcoded demonstration records; initialized history storage as an empty in-memory store with dedicated empty-state cards.
3. **Storage Architecture Calibration:**
   - Clarified in-memory storage abstraction; corrected premature IndexedDB claims.

---

## Entry: Phase 2.2 — Application Shell & Navigation
**Date:** 2026-11-14  
**Status:** Completed & Verified

---

## Entry: Phase 2.1 — Project Foundation & Design System
**Date:** 2026-11-14  
**Status:** Completed & Verified
