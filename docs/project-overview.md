# Project Overview — CredLock

## 1. Identity & Purpose

* **Official Title:** "CredLock: A Progressive Web Application for Password Strength Analysis, Secure Password Generation, and Data Breach Detection"
* **Application Category:** Individual Academic Project / Practical Cybersecurity PWA
* **Target Environment:** Responsive web application optimized for mobile (Bottom Navigation) and desktop form factors.

CredLock provides a client-side cryptographic security utility empowering users to inspect, generate, and evaluate passwords without exposing them to intermediate proxies, telemetry engines, or cloud backends.

## 2. Technical Stack Selection

| Layer | Technology | Rational Selection |
| :--- | :--- | :--- |
| **Runtime & Core** | React 19 + TypeScript 5.7 | Strict static type safety, component modularity, and modern rendering. |
| **Bundler** | Vite 6 | Rapid Hot Module Replacement (HMR) and optimized ES bundle generation. |
| **Styling & Design Tokens** | Tailwind CSS 3.4 | Utility-first architecture, consistent spacing, and custom dark navy palette. |
| **Routing** | React Router 7 | Declarative routing supporting persistent layout shells and parameterized `:id` routes. |
| **Icons** | Lucide React | High-performance, tree-shakable SVG iconography. |
| **Password Estimator** | @zxcvbn-ts/core (v4.2.0) | Local heuristic strength estimation, pattern detection, and guess-difficulty modeling. |
| **Random Number Generation** | Web Crypto API (CSPRNG) | `crypto.getRandomValues()` with rejection sampling for unbiased password generation. |
| **Test Runner** | Node.js Test Runner | Native ESM automated test execution (`node --test`). |

## 3. Strict Scope Enforcement

CredLock strictly delivers three security capabilities:
1. **Password Strength Analyzer (IMPLEMENTED - Phase 2.3):** Local entropy, composition breakdown, multi-scenario crack modeling, and heuristic pattern inspection via `@zxcvbn-ts`.
2. **Secure Password Generator (IMPLEMENTED - Phase 2.4):** Cryptographically secure uniform randomness using Web Crypto API rejection sampling, CSPRNG Fisher-Yates shuffle, guaranteed category coverage, and in-memory zero-knowledge handling.
3. **Password Breach Checker (SCHEDULED - Phase 2.5):** k-Anonymity privacy-preserving verification using SHA-1 range queries against Have I Been Pwned.

Unrelated modules (such as AI advisors, educational quizzes, or generic marketing portals) are explicitly excluded from this system.
