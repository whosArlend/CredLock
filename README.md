# CredLock

**A Progressive Web Application for Password Security and Privacy.**

CredLock is a privacy-focused Progressive Web Application (PWA) designed to help users understand and improve their password security through password strength analysis, secure password generation, and data breach detection.

The application prioritizes client-side processing to minimize the exposure of sensitive credentials while providing practical password security tools in a single interface.

## Features

### 1. Password Strength Analyzer

Evaluate password strength based on length, character diversity, common patterns, and estimated password strength.

- Analyze passwords directly in the browser.
- Display strength scores and security indicators.
- Provide estimated entropy and crack-time information with appropriate limitations.
- Avoid transmitting plaintext passwords to external servers.
- Provide contextual feedback to help users improve password quality.
- Store only sanitized analysis metrics in local history.

### 2. Secure Password Generator

Generate strong and cryptographically secure random passwords using the browser's Web Crypto API (`crypto.getRandomValues()`).

- Exclusively powered by Web Crypto CSPRNG; strictly prohibits `Math.random()`.
- Implements candidate-level rejection sampling to ensure uniform distribution over valid category-constrained passwords.
- Eliminates modulo bias at the integer level via CSPRNG rejection sampling.
- Enforces category coverage, requiring at least one character from every active character set.
- Includes a defensive retry limit.
- Displays a clearly labeled **Theoretical Pool Entropy Estimate** (`L × log₂(Pool)`) as an upper bound, noting that category constraints slightly restrict the keyspace.
- Configurable length from 8 to 64 characters.
- Supports slider, stepper, and preset controls.
- Selectable character categories:
  - Lowercase (`a-z`)
  - Uppercase (`A-Z`)
  - Digits (`0-9`)
  - Printable ASCII symbols
- Generated passwords exist only in transient component memory.
- Generated passwords are never persisted to history, local storage, or external networks.
- Secure copy action with an explicit clipboard accessibility disclosure.
- Safe transition to Analyzer with sensitive navigation state cleared upon consumption.

### 3. Password Breach Checker

Check whether a password appears in known data breaches through the Have I Been Pwned Pwned Passwords service.

- Uses SHA-1 hashing locally in the browser.
- Implements the k-anonymity range protocol.
- Sends only the first five hexadecimal characters of the password hash.
- Compares the returned hash suffix locally.
- Displays breach occurrence information where available.

> **Privacy note:** K-anonymity reduces the amount of information disclosed during a breach lookup, but does not guarantee complete anonymity.

### 4. Sanitized History & Persistence

Review previous password security analysis results without storing sensitive credentials.

- Persistent local storage using IndexedDB.
- Stores sanitized security metrics rather than actual passwords or cryptographic digests.
- Records include UUID, timestamp, score, password length, and breach count where applicable.
- Provides history browsing and analysis detail views.
- Passwords, full hashes, and SHA-1 prefixes or suffixes are not stored in history.

### 5. Dashboard & Profile

A unified interface for navigating CredLock's security tools and viewing application information.

- Dashboard with access to the main security features.
- Profile and application information.
- Responsive navigation.
- Adaptive capsule navigation that changes appearance during scrolling.
- Minimal, privacy-oriented interface.

### 6. Security Intelligence REST API Integration

CredLock integrates with the **CredLock Security Intelligence API**, an Express.js + TypeScript service connected to Supabase PostgreSQL.

- Provides live cybersecurity intelligence including breach incident feeds, security recommendations, and research advisories.
- Live dashboard KPIs summarizing global threat telemetry.
- Published-only visibility with Row-Level Security (RLS) policies.
- Type-safe centralized API client with structured error mapping and exponential backoff retry.

**Integration flow:**

```text
CredLock Frontend (PWA)
       │
       ▼
CredLock Security Intelligence API (Express.js / TypeScript)
       │
       ▼
Supabase Managed PostgreSQL
```

## Technology Stack

| Technology | Purpose |
|---|---|
| React | User interface |
| TypeScript | Type safety |
| Vite | Development server and build tooling |
| Tailwind CSS | Styling |
| React Router | Application routing |
| Web Crypto API | Cryptographically secure password generation and hashing operations |
| zxcvbn-ts | Password strength estimation |
| IndexedDB | Local sanitized history persistence |
| PWA | Installable web application |
| Express.js | CredLock Security Intelligence backend |
| Supabase | Database for Security Intelligence |
| Vitest / Node test runner | Automated testing |

## Project Architecture

CredLock follows a modular architecture that separates application layout, user interface components, feature logic, services, and data models.

```text
CredLock/
├── docs/
│   ├── project-overview.md
│   ├── requirements.md
│   ├── architecture.md
│   ├── security-design.md
│   ├── api-documentation.md
│   ├── testing.md
│   └── development-log.md
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── services/
│   ├── styles/
│   └── types/
├── tests/
├── .env.example
├── package.json
├── tsconfig.json
└── vite.config.ts
```

For detailed technical information, see the documentation in the `docs/` directory.

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Installation

Clone the repository:

```bash
git clone https://github.com/whosArlend/CredLock.git
cd CredLock
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL provided by Vite, usually:

```text
http://localhost:5173
```

### Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Type-check and build production bundle
npm run lint      # Run ESLint checks
npm test          # Run automated test suite
```

### Running the Backend API Locally

CredLock Security Intelligence API runs alongside the frontend:

1. Navigate to the backend directory: `cd backend/credlock-api`
2. Configure `.env` with your Supabase credentials.
3. Start the API service: `npm run dev` (starts on port `4000`).
4. Start the frontend: `npm run dev` (starts on port `5173`).
5. Open CredLock in your browser to see live Security Intelligence telemetry.

**Important:** Never expose Supabase Secret Keys in the frontend, source code, public repository, or client-side environment variables.

## Security and Privacy

CredLock is designed with a privacy-oriented approach:

- Password analysis and generation are performed locally.
- Plaintext passwords are not transmitted to external servers.
- Plaintext passwords, full hashes, and SHA-1 prefixes or suffixes are never stored in application history.
- History records contain sanitized security metrics rather than actual passwords or cryptographic digests.
- Generated passwords exist strictly in client RAM and are never written to storage, logs, or history.
- Breach checking uses the k-anonymity protocol in transient memory.
- Sensitive API responses and password inputs must not be cached by the PWA.
- Supabase backend credentials are isolated from the frontend.

CredLock does not claim absolute security or complete anonymity. Password strength estimates and breach detection results should be interpreted within their technical limitations.

Read [Security Design](docs/security-design.md) for more information.

## Project Documentation

- [Project Overview](docs/project-overview.md)
- [Requirements](docs/requirements.md)
- [Architecture](docs/architecture.md)
- [Security Design](docs/security-design.md)
- [API Documentation](docs/api-documentation.md)
- [Testing & Verification](docs/testing.md)
- [Development Log](docs/development-log.md)

## Project Status

CredLock is currently under active development as an academic project.

| Phase | Description | Status |
|---|---|---|
| 2.1 | Project Foundation & Design System | Completed & Verified |
| 2.2 | Application Shell & Navigation | Completed & Verified |
| 2.3 | Password Strength Analyzer | Completed & Verified |
| 2.4 | Secure Password Generator | Completed & Verified |
| 2.5 | Password Breach Checker | Completed & Verified |
| 2.6 | IndexedDB Persistence & PWA Offline Pipeline | Completed & Verified |
| 2.7A | Dashboard, Profile & Navigation | Completed & Verified |
| 2.7A.1 | Adaptive Capsule Navigation | Completed & Verified |
| 2.7B.1 | Minimal Modul 1 API Integration | Completed & Approved |

### Latest Verification

- **Automated tests:** 77/77 passed across 33 test suites.
- **TypeScript:** 0 errors.
- **ESLint:** 0 errors and 0 warnings.
- **Production build:** Successful.
- **Manual API integration testing:** Successful end-to-end verification.

The Modul 1 API integration was manually verified through the local development environment, including API connectivity, returned data, loading state, refresh behavior, and error handling.

See [Development Log](docs/development-log.md) and [Testing & Verification](docs/testing.md) for detailed progress and test records.

## Academic Information

**Project Title:**

*CredLock: A Progressive Web Application for Password Strength Analysis, Secure Password Generation, and Data Breach Detection.*

**Platform:** Progressive Web Application (PWA)

**Developer:** Alif Arlendi

---

*Built as an academic project in Computer Engineering.*
