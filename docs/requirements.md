# Requirements & Compliance Matrix — CredLock

## 1. Academic & Functional Requirements Matrix

| Requirement | Minimum Standard | CredLock Implementation Status (Phase 2.3 Verified) |
| :--- | :--- | :--- |
| **Project Type** | Individual Application | Designed and developed for single-developer academic submission. |
| **Minimum Pages** | $\ge 5$ discrete pages | **9 Pages Verified:** Home, Analyzer (Phase 2.3 Fully Implemented), Generator, Breach Checker, Profile, Analysis History, Analysis Detail, Breach History, Breach Detail, plus 404 handler. |
| **Primary Navigation** | Bottom Navigation Bar | Persistent mobile-first 5-tab bar (`/`, `/analyzer`, `/generator`, `/breach-checker`, `/profile`) with location-aware sub-route tracking and `aria-current="page"`. |
| **List Pages** | At least 2 main list pages | 1. `/analysis-history` (Sanitized Analysis Records)<br>2. `/breach-history` (Sanitized Breach Query Records). |
| **List-to-Detail Interaction** | Every list item clickable to detail | Flow 1: `/analysis-history` $\rightarrow$ `/analysis-history/:id`<br>Flow 2: `/breach-history` $\rightarrow$ `/breach-history/:id`. Both flows support deep parameterization, empty states, and graceful fallback for missing IDs. |
| **Profile/About Page** | At least one dedicated page | `/profile` detailing developer profile, academic matrix, security statement, and cache purge. |
| **Custom REST API** | Integrate Module 1 Web Service | Abstracted `IModule1Service` interface defined. Awaiting Module 1 specifications. |
| **Source Publication** | GitHub repository | Intentionally postponed until Phase 2 completion. |
| **Deployment** | Free PWA hosting | PWA build pipeline configured; hosting postponed to deployment phase. |

## 2. Core Security Feature Implementation Status

| Core Feature | Status | Implementation Details |
| :--- | :---: | :--- |
| **1. Password Strength Analyzer** | **IMPLEMENTED (Phase 2.3)** | Local in-browser evaluation with `@zxcvbn-ts/core`, 0-4 scoring, feedback warnings/suggestions, composition breakdown, multi-scenario crack times, and sanitized history archival. |
| **2. Secure Password Generator** | *PENDING (Phase 2.4)* | Scheduled for Phase 2.4 using Web Crypto CSPRNG (`crypto.getRandomValues`). |
| **3. Password Breach Checker** | *PENDING (Phase 2.5)* | Scheduled for Phase 2.5 using k-anonymity SHA-1 prefix protocol. |

## 3. Non-Functional Constraints & Security Rules

* **Strict Zero-Knowledge:**
  - Plaintext passwords must never be stored in persistent browser storage (`localStorage`, `sessionStorage`, `IndexedDB`, or cookies) or transmitted to backend services.
  - Full SHA-1 hashes, suffixes, and SHA-1 prefixes are never persisted in history.
  - History stores strictly non-reversible metadata (record ID, timestamp, length, score, entropy bits, and breach occurrence count).
* **Cryptographic Soundness:** Only the Web Crypto API (`crypto.getRandomValues()` and `crypto.subtle`) may be used for security-critical randomness and hashing.
* **Storage Architecture:** In-memory storage abstraction with zero mock/fabricated user records. Real evaluations save sanitized records. Persistent storage using IndexedDB is scheduled for Phase 2.6.
* **Accessibility Practices:** Implements accessible design conventions (semantic HTML5 landmarks, "Skip to main content" link, `:focus-visible` emerald rings, `focus-within` on interactive cards, and reduced-motion media queries). Formal external WCAG certification is not claimed.
