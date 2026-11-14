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

## 3. History Storage Architecture

`src/services/historyStorage.ts` manages sanitized history operations:
* **Current Mechanism (Phase 2.3):** Module-scoped in-memory storage initialized to an empty state (`[]`). User-initiated saves from `/analyzer` append sanitized evaluation records.
* **Security Guard:** Never retains plaintext passwords, full hashes, suffixes, prefixes, or password-derived tokens.
* **Extensibility:** The abstraction defines asynchronous/synchronous methods (`getAnalysisRecords`, `getAnalysisRecordById`, `getBreachRecords`, `getBreachRecordById`, `addAnalysisRecord`, `addBreachRecord`, `clearAllHistory`) designed for seamless replacement with IndexedDB in Phase 2.6 without changing view components.

## 4. UI Component System

Located in `src/components/ui/` and `src/components/layout/`:
* **`Button`**: Accessible button with variants (`primary`, `secondary`, `outline`, `ghost`, `danger`), sizes, loading states, and keyboard focus rings.
* **`Input`**: Text input with accessible labels, helper text, error text, and left/right icon slots.
* **`Card`**: Structured surface component (`Header`, `Title`, `Description`, `Content`, `Footer`) with `focus-within` keyboard indicator.
* **`Badge`**: Status chips with variant tokens (`emerald`, `amber`, `rose`, `cyan`, `neutral`) and pulsing dot indicators.
* **`Tooltip`**: Lightweight accessible hover/focus popover (`role="tooltip"`).
* **`Toast`**: Context-driven notification queue for non-blocking asynchronous user feedback (`useToast`, `ToastViewport`).
* **`LoadingIndicator`**: Accessible SVG spinner with animated shield icon.
* **`Container`**: Responsive horizontal layout boundary.

## 5. Generator Engine & Feature Components (Phase 2.4)

### Core Service (`src/services/passwordGenerator.ts`)
- **`getSecureRandomInt(max: number): number`**: Draws 32-bit unsigned integers from `crypto.getRandomValues()`. Implements rejection sampling using threshold $\text{limit} = 2^{32} - (2^{32} \pmod{\text{max}})$, completely eliminating modulo bias.
- **`secureShuffle<T>(array: T[]): T[]`**: Unbiased Fisher-Yates shuffle utilizing `getSecureRandomInt` at every index step.
- **`generatePassword(options: GeneratorOptions): GeneratorResult`**: Multi-stage generation that:
  1. Validates options ($8 \le \text{length} \le 64$, at least 1 category, length $\ge$ active category count).
  2. Guarantees inclusion of at least 1 character from each selected category.
  3. Fills remaining positions uniformly from the combined active character pool.
  4. Shuffles all positions with `secureShuffle`.
  5. Computes theoretical character pool size and theoretical entropy ($L \times \log_2(R)$).
- **`WebCryptoUnavailableError`**: Thrown if `crypto.getRandomValues` is absent; strictly prohibits insecure fallback to `Math.random()`.

### Feature Components (`src/features/generator/components/`)
- **`PasswordDisplay`**: Monospace password display with character visibility toggle (`Eye`/`EyeOff`), copy action with clipboard disclaimer, regeneration trigger (`RotateCw`), and in-memory clear (`Trash2`).
- **`LengthControl`**: Slider control coupled with numeric stepper and quick presets (12, 16, 24, 32) spanning 8 to 64 characters.
- **`CategoryToggles`**: Category selectors for Lowercase (26), Uppercase (26), Numbers (10), and Symbols (32) with live pool size and theoretical entropy indicators.
- **`GeneratorNoticeCard`**: Transparency card outlining CSPRNG rejection sampling, zero persistence, and real-world clipboard security trade-offs.
