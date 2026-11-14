# Requirements & Compliance Matrix — CredLock

## 1. Academic & Functional Requirements Matrix

| Requirement | Minimum Standard | CredLock Implementation Status (Phase 2.1) |
| :--- | :--- | :--- |
| **Project Type** | Individual Application | Designed and developed for single-developer academic submission. |
| **Minimum Pages** | $\ge 5$ discrete pages | **9 Pages Configured:** Home, Analyzer, Generator, Breach Checker, Profile, Analysis History, Analysis Detail, Breach History, Breach Detail. |
| **Primary Navigation** | Bottom Navigation Bar | Persistent mobile-first 5-tab bar (`/`, `/analyzer`, `/generator`, `/breach-checker`, `/profile`). |
| **List Pages** | At least 2 main list pages | 1. `/analysis-history` (Sanitized Analysis Records)<br>2. `/breach-history` (Sanitized Breach Query Records). |
| **List-to-Detail Interaction** | Every list item clickable to detail | Flow 1: `/analysis-history` $\rightarrow$ `/analysis-history/:id`<br>Flow 2: `/breach-history` $\rightarrow$ `/breach-history/:id`. |
| **Profile/About Page** | At least one dedicated page | `/profile` detailing developer profile, academic matrix, security statement, and cache purge. |
| **Custom REST API** | Integrate Module 1 Web Service | Abstracted `IModule1Service` interface defined. Awaiting Module 1 specifications. |
| **Source Publication** | GitHub repository | Intentionally postponed until Phase 2 completion. |
| **Deployment** | Free PWA hosting | PWA build pipeline configured; hosting postponed to deployment phase. |

## 2. Non-Functional Constraints

* **Strict Zero-Knowledge:** Plaintext passwords must never be stored in persistent browser storage (`localStorage`, `sessionStorage`, `IndexedDB`, or cookies) or transmitted to backend services.
* **Cryptographic Soundness:** Only the Web Crypto API (`crypto.getRandomValues()` and `crypto.subtle`) may be used for security-critical randomness and hashing.
* **Accessibility:** High-contrast color tokens, keyboard navigation outlines (`:focus-visible`), and ARIA landmarks (`role="status"`, `aria-label`, `aria-describedby`).
