# Architecture & Component Design — CredLock

## 1. System Topology

CredLock is structured around a **Client-Side Zero-Knowledge Architecture**:

```text
[ Browser Execution Environment ]
  ├── View Layer (React 19, Tailwind CSS)
  │     ├── Header (Clickable brand, security status & accessible isolation tooltip)
  │     ├── Skip Link (Keyboard bypass directly to #main-content)
  │     ├── Content Outlet (9 discrete routed views)
  │     └── Bottom Navigation Bar (5 primary tabs with location-aware sub-route tracking)
  │
  ├── Core Cryptographic Engines (Local Browser Sandbox)
  │     ├── Analyzer Engine (@zxcvbn-ts/core heuristic estimation & guess difficulty — Phase 2.3 Implemented)
  │     ├── Generator Engine (window.crypto.getRandomValues CSPRNG with rejection sampling — Phase 2.4 Implemented)
  │     └── Breach Engine (SubtleCrypto SHA-1 & k-anonymity parser — Phase 2.5)
  │
  ├── Sanitized History State (In-Memory Abstraction in Phase 2.2/2.3; IndexedDB in Phase 2.6)
  │     ├── historyStorage.ts (Sanitized query service with empty-state & invalid ID protection)
  │     └── Stores ONLY: Record UUID, timestamp, length, score, entropy bits, and breach occurrence count
  │
  └── Module 1 REST API Integration Layer
        ├── IModule1Service (TypeScript Contract)
        └── Module1HttpAdapter (Pluggable once API docs are provided)
```

## 2. Page & Routing Architecture

1. **`HomePage` (`/`)**: High-level security center, primary feature shortcuts, and design system verification.
2. **`AnalyzerPage` (`/analyzer`)**: Real-time password strength, pattern detection, and guess-difficulty analysis powered by zxcvbn-ts (Implemented in Phase 2.3).
3. **`GeneratorPage` (`/generator`)**: Cryptographically sound password generation interface shell (Phase 2.4).
4. **`BreachCheckerPage` (`/breach-checker`)**: k-Anonymity breach detection client shell (Phase 2.5).
5. **`ProfilePage` (`/profile`)**: Academic credentials, project scope, and local privacy management.
6. **`AnalysisHistoryPage` (`/analysis-history`)**: List Page 1 displaying sanitized analysis audit logs with empty-state handling and back-link to `/analyzer`.
7. **`AnalysisDetailPage` (`/analysis-history/:id`)**: Detail Page 1 displaying deep algorithmic breakdown, with graceful fallback if `:id` is invalid or missing.
8. **`BreachHistoryPage` (`/breach-history`)**: List Page 2 displaying historical k-anonymity queries with empty-state handling and back-link to `/breach-checker`.
9. **`BreachDetailPage` (`/breach-history/:id`)**: Detail Page 2 displaying breach occurrence verification, with graceful fallback if `:id` is invalid or missing.
10. **`NotFoundPage` (`*`)**: Universal 404 handler for unrecognized routes.

### Sub-route Navigation Mapping
The persistent `BottomNav` maintains user orientation by highlighting:
* **Analyze Tab** when on `/analyzer`, `/analysis-history`, or `/analysis-history/:id`.
* **Breach Tab** when on `/breach-checker`, `/breach-history`, or `/breach-history/:id`.

## 3. History Storage Architecture (Phase 2.6: IndexedDB Enclave)

`src/services/historyStorage.ts` and `src/services/db.ts` provide persistent local storage backed by browser IndexedDB:
* **Storage Target:** Database `credlock-db` (version 1) using dedicated object stores:
  - `analysis_history`: Keyed by `id` (UUID), indexed by `timestamp` and `score`.
  - `breach_history`: Keyed by `id` (UUID), indexed by `timestamp` and `isBreached`.
* **Zero-Knowledge Security Invariant:** Under NO circumstances are plaintext passwords, full SHA-1 hashes, suffixes, prefixes, or password-derived tokens persisted or cached.
* **Dual-Tier Architecture:** In-memory synchronous cache enables zero-delay component renders and Node.js test execution, backed by transactional IndexedDB writes, reads, single-item deletions, and complete store flushing.
* **Reactive Synchronization:** Emits `credlock:history-updated` events across browser windows/components to trigger reactive state updates in UI hooks (`useAnalysisHistory`, `useBreachHistory`).


## 4. UI Component System & Design Tokens (Redesign Stage 2: Obsidian Vault × Cipher Ledger)

The component layer implements the **Obsidian Vault × Cipher Ledger** design system, combining industrial warm-charcoal surfaces (`#0C0D0E`, `#131517`, `#1A1D20`, `#24282D`) with Safety Amber (`#E5A93C`) authorization accents, crisp typography (Plus Jakarta Sans and Space Mono), restrained radii (4px, 6px, 8px, 12px), and hairline architectural borders (`#282C32`, `#383E46`).

Located in `src/components/ui/` and `src/components/layout/`:
* **`Button`**: Precision action button with variants (`primary`, `secondary`, `outline`, `ghost`, `danger`), sizes (`sm`, `md`, `lg`), `isLoading` spinner state, icon slots, and high-contrast amber keyboard focus ring.
* **`Card`**: Multi-surface component with variants (`default`, `elevated`, `inset`, `flat`), configurable padding (`none`, `sm`, `md`, `lg`), `isInteractive` focus rings, and composable subcomponents (`Header`, `Title`, `Description`, `Content`, `Footer`).
* **`Input`**: Form field input with accessible label association, helper text, error state (`role="alert"`), disabled styling, leading/trailing slots, and password masking support.
* **`Meter`**: Generic, accessible progress and calibrated hardware meter (`role="progressbar"`) supporting continuous or discrete segment displays, semantic variants (`default`, `accent`, `success`, `warning`, `danger`), and custom labels/readouts.
* **`Badge`**: Restrained status chip with crisp 4px radius, avoiding bubbly pill shapes while supporting semantic color variants and beacon dots.
* **`Tooltip`**: Lightweight accessible hover/focus popover (`role="tooltip"`).
* **`Toast`**: Context-driven notification queue for non-blocking asynchronous user feedback (`useToast`, `ToastViewport`).
* **`LoadingIndicator`**: Accessible SVG spinner with animated shield icon.
* **`Container`**: Responsive horizontal layout boundary.

## 5. Generator Engine & Feature Components (Phase 2.4)

### Core Service (`src/services/passwordGenerator.ts`)
- **`getSecureRandomInt(max: number): number`**: Draws 32-bit unsigned integers from `crypto.getRandomValues()`. Implements rejection sampling using threshold $\text{limit} = 2^{32} - (2^{32} \pmod{\text{max}})$, completely eliminating modulo bias.
- **`secureShuffle<T>(array: T[]): T[]`**: Unbiased Fisher-Yates shuffle utilizing `getSecureRandomInt` at every index step.
- **`generatePassword(options: GeneratorOptions, maxAttempts: number): GeneratorResult`**: Candidate-level rejection sampling algorithm:
  1. Validates options ($8 \le \text{length} \le 64$, at least 1 category, length $\ge$ active category count).
  2. Constructs candidate string by drawing each position independently and uniformly from the active combined character pool.
  3. Verifies that the candidate satisfies all enabled category requirements using `satisfiesCategoryConstraints`.
  4. Discards candidates missing any required category and resamples independently, mathematically guaranteeing a uniform distribution over the valid category-constrained password space.
  5. Enforces defensive retry limit (`MAX_GENERATOR_ATTEMPTS = 1000`). If exceeded, throws `GenerationAttemptLimitExceededError` without falling back.
  6. Computes theoretical pool-based entropy estimate ($L \times \log_2(R)$), clearly labeled as an upper bound.
- **`WebCryptoUnavailableError`**: Thrown if `crypto.getRandomValues` is absent; strictly prohibits insecure fallback to `Math.random()`.
- **`GenerationAttemptLimitExceededError`**: Thrown if rejection sampling exceeds retry limit; prevents infinite loops while guaranteeing valid outputs.

### Feature Components (`src/features/generator/components/`)
- **`PasswordDisplay`**: Monospace password display with character visibility toggle (`Eye`/`EyeOff`), copy action with clipboard disclaimer, regeneration trigger (`RotateCw`), in-memory clear (`Trash2`), and tooltip-annotated Pool Entropy Estimate badge.
- **`LengthControl`**: Slider control coupled with numeric stepper and quick presets (12, 16, 24, 32) spanning 8 to 64 characters.
- **`CategoryToggles`**: Category selectors for Lowercase (26), Uppercase (26), Numbers (10), and Symbols (32) with live pool size and pool-based entropy estimate indicator.
- **`GeneratorNoticeCard`**: Transparency card outlining CSPRNG candidate rejection sampling, pool entropy estimate boundaries, zero persistence, and real-world clipboard security trade-offs.

## 6. Breach Checker Engine & Feature Components (Phase 2.5)

### Core Service (`src/services/breachChecker.ts`)
- **`computeSha1Hex(text: string): Promise<string>`**: Computes 40-character uppercase hexadecimal SHA-1 digest client-side via `crypto.subtle.digest('SHA-1', data)`.
- **`splitSha1Hash(hashHex: string): { prefix: string; suffix: string }`**: Separates the 40-character hash into a 5-character prefix (sent to HIBP) and a 35-character suffix (retained locally).
- **`parseRangeResponse(responseText: string): Map<string, number>`**: Parses the HIBP range response containing `<suffix>:<count>` lines into a fast in-memory hash map.
- **`checkPasswordBreach(password: string, options?: BreachCheckOptions): Promise<BreachCheckResult>`**: Orchestrates the k-anonymity breach verification query:
  1. Validates input non-emptiness (throws `EmptyPasswordError` if empty or whitespace-only).
  2. Computes SHA-1 hash locally in transient memory.
  3. Sends `GET https://api.pwnedpasswords.com/range/{prefix}` with `Add-Padding: true` to prevent response-size traffic analysis attacks.
  4. Manages timeout (default 10s) and cancellation via `AbortController`.
  5. Performs local suffix lookup against returned dataset.
  6. Returns sanitized result containing `isBreached: boolean`, `breachCount: number`, `prefix: string`, and `queriedAt: string`.
- **Granular Error Handling**: Defines `BreachCheckError`, `EmptyPasswordError`, `WebCryptoUnavailableError`, `BreachNetworkError`, `BreachTimeoutError`, `BreachApiError`, and `BreachMalformedResponseError`.

### Feature Components (`src/features/breach/components/`)
- **`BreachPasswordInput`**: Credential query chamber featuring monospace input, password visibility toggle (`Eye`/`EyeOff`), clear action (`X`), keyboard Enter submission, and disabled state during query execution.
- **`BreachResult`**: Multi-state visual display handling:
  - *Loading*: Monospace pulse indicator `[ HIBP RANGE QUERY // IN PROGRESS ]`.
  - *Compromised*: Crimson hazard alert with formatted occurrence count, urgent remediation advice, and direct link to Secure Password Generator.
  - *Clean / Not Found*: Emerald confirmation with explicit caveat that absence from public breaches does not guarantee security against targeted brute-force attacks.
  - *Network/API Error*: Amber alert with descriptive failure details and a one-click retry trigger.
  - *Save to History Action*: Explicit user-triggered archival saving only `SanitizedBreachRecord` (`id`, `timestamp`, `isBreached`, `breachCount`).
- **`BreachPrivacyNotice`**: Architectural transparency card explaining the 3-step k-anonymity protocol (Local Hash $\to$ 5-Character Prefix Range Query $\to$ Local Suffix Matching) and protocol context for SHA-1.

