# CredLock — High-Assurance Password Security Suite

> **Academic Project:** "CredLock: A Progressive Web Application for Password Strength Analysis, Secure Password Generation, and Data Breach Detection"  
> **Phase:** 2.1 — Project Foundation & Design System  
> **Architecture Standard:** Zero-Knowledge Client-Side Cryptographic Architecture

---

## Executive Summary

CredLock is a Progressive Web Application (PWA) built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**. It is designed to provide high-assurance password analysis, entropy assessment, cryptographically secure password generation, and breach verification via mathematical k-anonymity—all operating locally inside the browser client without exposing sensitive user credentials to any external service or storage medium.

---

## Core Security Features (Strict Scope)

1. **Password Strength Analyzer** *(Phase 2.2)*
   - In-browser evaluation of entropy ($H = -\sum P(x) \log_2 P(x)$), length, character diversity, and vulnerability patterns.
   - Zero transmission of passwords to remote servers.
2. **Secure Password Generator** *(Phase 2.3)*
   - CSPRNG random generation powered exclusively by `window.crypto.getRandomValues()`.
   - Never utilizes predictable `Math.random()`.
3. **Password Breach Checker** *(Phase 2.4)*
   - k-Anonymity range lookup against known breach repositories (Pwned Passwords protocol).
   - Local SHA-1 hashing, sending only the 5-character prefix to preserve privacy.

*Excluded features: AI Advisors, security quizzes, and unrelated educational modules.*

---

## Project Structure

```text
CredLock/
├── docs/                        # Formal architecture & security documentation
│   ├── project-overview.md
│   ├── requirements.md
│   ├── architecture.md
│   ├── security-design.md
│   ├── api-documentation.md
│   └── development-log.md
├── public/                      # Static assets & PWA manifest icons
│   └── favicon.svg
├── src/
│   ├── app/                     # Routing and application entry definitions
│   │   └── routes.tsx
│   ├── components/
│   │   ├── layout/              # AppLayout, Header, BottomNav, PageHeader, Container
│   │   └── ui/                  # Reusable foundational design tokens (Button, Input, Card, Badge, etc.)
│   ├── lib/                     # Utilities (cn, class merging)
│   ├── pages/                   # 9 discrete routed pages
│   ├── styles/                  # Tailwind CSS theme and design tokens
│   ├── types/                   # Sanitized domain types & API service contracts
│   ├── App.tsx                  # Root wrapper with ToastProvider and Router
│   └── main.tsx                 # React DOM mount point
├── .env.example                 # Environment configuration template
├── .gitignore                   # Comprehensive exclusion of build artifacts & secrets
├── eslint.config.js             # Modern ESLint configuration
├── index.html                   # HTML entry point with dark mode default
├── package.json                 # Dependency definitions
├── postcss.config.js            # PostCSS plugin pipeline
├── tailwind.config.ts           # Custom cybersecurity dark palette & typography tokens
├── tsconfig.json                # Strict TypeScript configuration
└── vite.config.ts               # Vite configuration with path aliases
```

---

## Getting Started

### Prerequisites
* **Node.js:** `>= 18.0.0` (Tested on `v26.7.0`)
* **npm:** `>= 9.0.0` (Tested on `11.19.0`)

### Installation & Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Execute strict type checking & production build
npm run build

# Run ESLint validation
npm run lint
```

---

## Git & Release Status

In accordance with Phase 2.1 protocol, **no Git repository or remote has been initialized or published**. All publishing is intentionally deferred until Phase 2 is verified and approved.
