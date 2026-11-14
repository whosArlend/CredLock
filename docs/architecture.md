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
  ├── Core Cryptographic Engines (Local Browser Sandbox — Upcoming Phases)
  │     ├── Analyzer Engine (Shannon entropy & pattern heuristics — Phase 2.3)
  │     ├── Generator Engine (window.crypto.getRandomValues CSPRNG — Phase 2.4)
  │     └── Breach Engine (SubtleCrypto SHA-1 & k-anonymity parser — Phase 2.5)
  │
  ├── Sanitized History State (In-Memory Abstraction in Phase 2.2; IndexedDB in Phase 2.6)
  │     ├── historyStorage.ts (Sanitized query service with empty-state & invalid ID protection)
  │     └── Stores ONLY: Record UUID, timestamp, length, entropy score, and breach occurrence count
  │
  └── Module 1 REST API Integration Layer
        ├── IModule1Service (TypeScript Contract)
        └── Module1HttpAdapter (Pluggable once API docs are provided)
```

## 2. Page & Routing Architecture

1. **`HomePage` (`/`)**: High-level security center, primary feature shortcuts, and design system verification.
2. **`AnalyzerPage` (`/analyzer`)**: Real-time password strength and entropy inspection shell.
3. **`GeneratorPage` (`/generator`)**: Cryptographically sound password generation interface shell.
4. **`BreachCheckerPage` (`/breach-checker`)**: k-Anonymity breach detection client shell.
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
* **Current Mechanism (Phase 2.2):** Module-scoped in-memory storage initialized to an empty state (`[]`). No fabricated or mock security results are pre-populated.
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
