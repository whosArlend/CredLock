# Architecture & Component Design — CredLock

## 1. System Topology

CredLock is structured around a **Client-Side Zero-Knowledge Architecture**:

```text
[ Browser Execution Environment ]
  ├── View Layer (React 19, Tailwind CSS)
  │     ├── Header (Security badge & status)
  │     ├── Content Outlet (9 discrete views)
  │     └── Bottom Navigation Bar (5 primary tabs)
  │
  ├── Core Cryptographic Engines (Local Browser Sandbox)
  │     ├── Analyzer Engine (Shannon entropy & pattern heuristics)
  │     ├── Generator Engine (window.crypto.getRandomValues CSPRNG)
  │     └── Breach Engine (SubtleCrypto SHA-1 & k-anonymity parser)
  │
  ├── Sanitized History State (Local & API)
  │     └── Stores ONLY: UUID, timestamp, entropy score, length, breach count, 5-char prefix
  │
  └── Module 1 REST API Integration Layer
        ├── IModule1Service (TypeScript Contract)
        └── Module1HttpAdapter (Pluggable once API docs are provided)
```

## 2. Page & Routing Architecture

1. **`HomePage` (`/`)**: High-level security center, primary feature shortcuts, and design system verification.
2. **`AnalyzerPage` (`/analyzer`)**: Real-time password strength and entropy inspection.
3. **`GeneratorPage` (`/generator`)**: Cryptographically sound password generation interface.
4. **`BreachCheckerPage` (`/breach-checker`)**: k-Anonymity breach detection client.
5. **`ProfilePage` (`/profile`)**: Academic credentials, project scope, and local privacy management.
6. **`AnalysisHistoryPage` (`/analysis-history`)**: List Page 1 displaying sanitized analysis audit logs.
7. **`AnalysisDetailPage` (`/analysis-history/:id`)**: Detail Page 1 displaying deep algorithmic breakdown.
8. **`BreachHistoryPage` (`/breach-history`)**: List Page 2 displaying historical k-anonymity queries.
9. **`BreachDetailPage` (`/breach-history/:id`)**: Detail Page 2 displaying breach occurrence verification.

## 3. UI Component System

Located in `src/components/ui/` and `src/components/layout/`:
* **`Button`**: Accessible button with variants (`primary`, `secondary`, `outline`, `ghost`, `danger`), sizes, loading states, and keyboard focus rings.
* **`Input`**: Text input with accessible labels, helper text, error text, and left/right icon slots.
* **`Card`**: Structured surface component (`Header`, `Title`, `Description`, `Content`, `Footer`).
* **`Badge`**: Status chips with variant tokens (`emerald`, `amber`, `rose`, `cyan`, `neutral`) and pulsing dot indicators.
* **`Tooltip`**: Lightweight accessible hover/focus popover.
* **`Toast`**: Context-driven notification queue for non-blocking asynchronous user feedback.
* **`LoadingIndicator`**: Accessible SVG spinner with animated shield icon.
* **`Container`**: Responsive horizontal layout boundary.
