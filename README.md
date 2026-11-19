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

### 6. REST API Integration

CredLock integrates with **Sales-API Modul 1**, an external Express.js REST API connected to a Supabase database.

The integration demonstrates real-world API communication as part of the application's academic requirements.

- Retrieves total customer count through `GET /api/reports/total`.
- Uses a Vite development proxy to communicate with the local Sales-API backend.
- Displays API connection status and returned customer count.
- Supports manual refresh.
- Includes loading, timeout, and error-handling states.
- Read-only integration scope.
- Does not access or display individual customer records.
- Does not persist API data in CredLock's local history.

**Integration flow:**

```text
CredLock Frontend
       │
       ▼
Vite Development Proxy
       │
       ▼
Sales-API (Express.js)
       │
       ▼
Supabase Database
```

> **Deployment limitation:** The current Vite proxy is development-only. Production deployment requires an appropriate backend, serverless function, reverse proxy, or secure API configuration. The Sales-API backend must not be exposed publicly without appropriate authentication and security controls.

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
| Express.js | External Sales-API backend |
| Supabase | Database for Sales-API integration |
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

### Running the Modul 1 API Integration Locally

The Modul 1 API integration requires the Sales-API backend to be running separately.

1. Start the Sales-API backend in its own terminal, configured with the required Supabase environment variables.
2. Ensure Sales-API is running on the expected local port (`3000`).
3. Start CredLock using `npm run dev`.
4. Open CredLock in your browser.
5. Navigate to the Home Dashboard and verify the Modul 1 API integration widget.

The integration uses the Vite development proxy to forward requests to the local Sales-API backend.

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
- External API integration is limited to read-only customer count retrieval.
- Supabase backend credentials are isolated from the frontend.
- The current Modul 1 integration is intended for local development and academic demonstration.

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
