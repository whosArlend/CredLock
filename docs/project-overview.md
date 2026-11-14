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

## 3. Strict Scope Enforcement

CredLock strictly delivers three security capabilities:
1. **Password Strength Analyzer:** Local entropy and pattern inspection.
2. **Secure Password Generator:** Web Crypto API uniform randomness.
3. **Password Breach Checker:** k-Anonymity privacy-preserving verification.

Unrelated modules (such as AI advisors, educational quizzes, or generic marketing portals) are explicitly excluded from this system.
