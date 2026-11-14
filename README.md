# CredLock

**A Progressive Web Application for Password Security and Privacy.**

CredLock is a privacy-focused Progressive Web Application (PWA) designed to help users understand and improve their password security through password strength analysis, secure password generation, and data breach detection.

The application focuses on client-side processing to minimize the exposure of sensitive credentials while providing practical password security tools in a single interface.

## Features

### 1. Password Strength Analyzer
Evaluate password strength based on length, character diversity, common patterns, and estimated password strength.

- Analyze passwords directly in the browser.
- Display strength scores and security indicators.
- Provide estimated entropy and crack-time information with appropriate limitations.
- Avoid transmitting plaintext passwords to external servers.

### 2. Secure Password Generator
Generate strong and unpredictable passwords using the browser's cryptographically secure random number generator.

- Uses the Web Crypto API.
- Supports configurable password length.
- Allows users to select character types.
- Avoids predictable random number generation methods.

### 3. Password Breach Checker
Check whether a password appears in known data breaches through the Have I Been Pwned Pwned Passwords service.

- Uses SHA-1 hashing locally in the browser.
- Implements the k-anonymity range protocol.
- Sends only the first five hexadecimal characters of the password hash.
- Compares the returned hash suffix locally.

*Note: K-anonymity reduces the amount of information disclosed during a breach lookup, but does not guarantee complete anonymity.*

## Technology Stack

| Technology | Purpose |
|---|---|
| React | User interface |
| TypeScript | Type safety |
| Vite | Development and build tooling |
| Tailwind CSS | Styling |
| React Router | Application routing |
| Web Crypto API | Cryptographically secure operations |
| IndexedDB | Local sanitized history storage |
| PWA | Installable web application |

## Project Architecture

CredLock follows a modular architecture that separates application layout, user interface components, feature logic, services, and data models.

```text
CredLock/
├── docs/
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── styles/
│   └── types/
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
git clone https://github.com/YOUR_USERNAME/CredLock.git
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
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
```

## Security and Privacy

CredLock is designed with a privacy-oriented approach:

- Password analysis and generation are performed locally.
- Plaintext passwords are not intentionally stored in application history.
- History records contain sanitized security metrics rather than actual passwords.
- Breach checking uses the k-anonymity protocol.
- Sensitive API responses and password inputs must not be cached by the PWA.

Read [Security Design](docs/security-design.md) for more information.

## Project Documentation

- [Project Overview](docs/project-overview.md)
- [Requirements](docs/requirements.md)
- [Architecture](docs/architecture.md)
- [Security Design](docs/security-design.md)
- [API Documentation](docs/api-documentation.md)
- [Development Log](docs/development-log.md)

## Project Status

CredLock is currently under active development as an academic project.

The project is being developed incrementally, with each feature implemented and verified in separate development phases.

**Planned core features:**
- Password Strength Analyzer
- Secure Password Generator
- Password Breach Checker

## Academic Information

**Project Title:**

*CredLock: A Progressive Web Application for Password Strength Analysis, Secure Password Generation, and Data Breach Detection.*

**Platform:** Progressive Web Application (PWA)

**Developer:** Alif Arlendi

---

*Built as an academic project in Computer Engineering.*