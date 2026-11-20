# CredLock Security Intelligence API Reference

**Live Base URL (Production):** `https://credlock-api.vercel.app`  
**Local Development URL:** `http://localhost:4000`  
**API Version:** `v1`  
**Content-Type:** `application/json`

---

## 1. Response Envelope Format

All CredLock API endpoints return standardized JSON envelopes.

### A. Success Response (Single Item & Dashboard)
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-11-20T14:00:00.000Z"
}
```

### B. Paginated Success Response (Collections)
List endpoints encapsulate collections inside `data.data` and metadata inside `data.pagination`:
```json
{
  "success": true,
  "data": {
    "data": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 12,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  },
  "timestamp": "2026-11-20T14:00:00.000Z"
}
```

### C. Standardized Error Response
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource could not be found",
    "details": null
  },
  "timestamp": "2026-11-20T14:00:00.000Z"
}
```

#### Common Error Codes
| HTTP Status | Error Code | Description |
|:---:|---|---|
| `400` | `VALIDATION_ERROR` | Request query parameters failed Zod schema validation. |
| `404` | `NOT_FOUND` | The requested slug does not exist, is unverified, or is unpublished. |
| `429` | `RATE_LIMIT_EXCEEDED` | Request ceiling reached (100 requests per 15 minutes per IP). |
| `500` | `INTERNAL_ERROR` | An unexpected server error occurred. |
| `503` | `DATABASE_UNAVAILABLE` | Database connectivity is currently degraded. |

---

## 2. Health & Diagnostic Endpoints

### `GET /` — API Status & Directory
Returns server status and top-level endpoint pointers.

- **Response:**
  ```json
  {
    "success": true,
    "name": "CredLock Security Intelligence API",
    "version": "1.0.0",
    "status": "operational",
    "endpoints": {
      "health": "/api/health",
      "dbHealth": "/api/health/db",
      "v1": "/api/v1"
    }
  }
  ```

### `GET /api/health` — Basic Liveness Probe
Probes server availability independently of database state.

- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "CredLock API is running",
    "timestamp": "2026-11-20T14:00:00.000Z",
    "environment": "production"
  }
  ```

### `GET /api/health/db` — Database Readiness Probe
Checks active connectivity and round-trip query latency to Supabase PostgreSQL.

- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Database is connected and healthy",
    "database": {
      "status": "connected",
      "latencyMs": 32
    },
    "timestamp": "2026-11-20T14:00:00.000Z"
  }
  ```

---

## 3. Security Intelligence Endpoints (`/api/v1`)

### `GET /api/v1/dashboard/summary` — Threat Telemetry Dashboard
Aggregates published cybersecurity metrics, severity breakdowns, and the 5 most recent incidents.

- **Query Parameters:** None
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "statistics": {
        "totalBreaches": 12,
        "totalExposedAccounts": 142500000,
        "totalRecommendations": 18,
        "totalArticles": 8
      },
      "breachesBySeverity": {
        "critical": 4,
        "high": 5,
        "medium": 2,
        "low": 1
      },
      "recentBreaches": [
        {
          "id": "e8b2a3d0-1234-4567-89ab-cdef01234567",
          "title": "National Health Insurance Breach",
          "slug": "national-health-insurance-2024",
          "organization": "BPJS Kesehatan",
          "domain": "bpjs-kesehatan.go.id",
          "breach_date": "2024-05-12",
          "added_date": "2024-05-15",
          "pwn_count": 279000000,
          "severity": "critical"
        }
      ]
    },
    "timestamp": "2026-11-20T14:00:00.000Z"
  }
  ```

---

### `GET /api/v1/breaches` — Breach Incident Catalog
Returns a paginated list of verified and published breach incidents.

- **Query Parameters:**
  | Parameter | Type | Default | Allowed Values / Description |
  |---|:---:|:---:|---|
  | `page` | integer | `1` | Page number ($\ge 1$). |
  | `limit` | integer | `10` | Records per page ($1 \le \text{limit} \le 50$). |
  | `search` | string | - | Case-insensitive substring match across `title`, `organization`, and `domain`. |
  | `severity` | string | - | Filter: `low`, `medium`, `high`, `critical`. |
  | `sortBy` | string | `breach_date` | Sort field: `breach_date`, `pwn_count`, `title`, `added_date`. |
  | `sortOrder` | string | `desc` | Direction: `asc`, `desc`. |

- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "data": [
        {
          "id": "b1a2c3d4-0000-0000-0000-000000000001",
          "title": "E-Commerce Market Compromise",
          "slug": "tokopedia-data-breach",
          "domain": "tokopedia.com",
          "organization": "Tokopedia",
          "breach_date": "2020-03-20",
          "added_date": "2024-01-15",
          "pwn_count": 91000000,
          "data_classes": ["Email addresses", "Passwords", "Names", "Dates of birth"],
          "severity": "critical",
          "logo_url": null
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "totalItems": 1,
        "totalPages": 1,
        "hasNextPage": false,
        "hasPreviousPage": false
      }
    },
    "timestamp": "2026-11-20T14:00:00.000Z"
  }
  ```

---

### `GET /api/v1/breaches/:slug` — Breach Incident Detail
Retrieves detailed timeline, affected data classes, and source references for a specific incident.

- **Path Parameters:**
  - `slug` (string, required): Unique URL-safe identifier of the breach.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "b1a2c3d4-0000-0000-0000-000000000001",
      "title": "E-Commerce Market Compromise",
      "slug": "tokopedia-data-breach",
      "domain": "tokopedia.com",
      "organization": "Tokopedia",
      "breach_date": "2020-03-20",
      "added_date": "2024-01-15",
      "pwn_count": 91000000,
      "description": "In March 2020, user records were extracted and offered on illicit forums...",
      "data_classes": ["Email addresses", "Passwords", "Names", "Dates of birth"],
      "severity": "critical",
      "is_verified": true,
      "source_url": "https://example.com/incident-report",
      "logo_url": null
    },
    "timestamp": "2026-11-20T14:00:00.000Z"
  }
  ```

---

### `GET /api/v1/recommendations` — Hardening Guidance Catalog
Returns a paginated collection of security recommendations and hardening guidance.

- **Query Parameters:**
  | Parameter | Type | Default | Allowed Values / Description |
  |---|:---:|:---:|---|
  | `page` | integer | `1` | Page number ($\ge 1$). |
  | `limit` | integer | `10` | Records per page ($1 \le \text{limit} \le 50$). |
  | `category` | string | - | Filter: `password`, `auth`, `device`, `network`, `incident_response`. |
  | `priority` | string | - | Filter: `critical`, `high`, `medium`, `low`. |
  | `search` | string | - | Substring search across `title` and `summary`. |
  | `sortBy` | string | `priority` | Sort field: `priority`, `title`, `created_at`. |
  | `sortOrder` | string | `desc` | Direction: `asc`, `desc`. |

- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "data": [
        {
          "id": "r1a2c3d4-0000-0000-0000-000000000001",
          "title": "Enforce Multi-Factor Authentication",
          "slug": "enforce-mfa-authenticator-apps",
          "category": "auth",
          "priority": "critical",
          "summary": "Mandate hardware security keys or TOTP authenticators across primary accounts.",
          "target_audience": "All Users",
          "tags": ["mfa", "passkeys", "authentication"],
          "action_steps": [
            "Audit existing accounts for SMS-based 2FA.",
            "Enroll a FIDO2 hardware key or TOTP authenticator.",
            "Save offline encrypted backup codes."
          ]
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "totalItems": 1,
        "totalPages": 1,
        "hasNextPage": false,
        "hasPreviousPage": false
      }
    },
    "timestamp": "2026-11-20T14:00:00.000Z"
  }
  ```

---

### `GET /api/v1/recommendations/:slug` — Playbook Detail
Retrieves the complete actionable implementation playbook for a specific recommendation.

- **Path Parameters:**
  - `slug` (string, required): Unique identifier of the recommendation.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "r1a2c3d4-0000-0000-0000-000000000001",
      "title": "Enforce Multi-Factor Authentication",
      "slug": "enforce-mfa-authenticator-apps",
      "category": "auth",
      "priority": "critical",
      "summary": "Mandate hardware security keys or TOTP authenticators across primary accounts.",
      "action_steps": [
        "Audit existing accounts for SMS-based 2FA.",
        "Enroll a FIDO2 hardware key or TOTP authenticator.",
        "Save offline encrypted backup codes."
      ],
      "target_audience": "All Users",
      "tags": ["mfa", "passkeys", "authentication"]
    },
    "timestamp": "2026-11-20T14:00:00.000Z"
  }
  ```

---

### `GET /api/v1/articles` — Cybersecurity Research Advisories
Returns a paginated collection of published research articles and technical advisories.

- **Query Parameters:**
  | Parameter | Type | Default | Allowed Values / Description |
  |---|:---:|:---:|---|
  | `page` | integer | `1` | Page number ($\ge 1$). |
  | `limit` | integer | `10` | Records per page ($1 \le \text{limit} \le 50$). |
  | `category` | string | - | Filter: `guide`, `analysis`, `news`, `explainer`. |
  | `search` | string | - | Substring search across `title` and `summary`. |
  | `sortBy` | string | `published_at` | Sort field: `title`, `category`, `published_at`, `read_time_minutes`. |
  | `sortOrder` | string | `desc` | Direction: `asc`, `desc`. |

- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "data": [
        {
          "id": "a1a2c3d4-0000-0000-0000-000000000001",
          "title": "Understanding k-Anonymity in Credential Exposure Audits",
          "slug": "understanding-k-anonymity-in-breach-audits",
          "category": "explainer",
          "summary": "A technical breakdown of how hash-prefix range partitioning enables private breach audits.",
          "author_name": "CredLock Security Team",
          "read_time_minutes": 5,
          "tags": ["k-anonymity", "cryptography", "privacy"],
          "published_at": "2024-03-15T08:00:00.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "totalItems": 1,
        "totalPages": 1,
        "hasNextPage": false,
        "hasPreviousPage": false
      }
    },
    "timestamp": "2026-11-20T14:00:00.000Z"
  }
  ```

---

### `GET /api/v1/articles/:slug` — Article Detail
Retrieves the complete research advisory content including Markdown formatting and citations.

- **Path Parameters:**
  - `slug` (string, required): Unique identifier of the article.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "a1a2c3d4-0000-0000-0000-000000000001",
      "title": "Understanding k-Anonymity in Credential Exposure Audits",
      "slug": "understanding-k-anonymity-in-breach-audits",
      "category": "explainer",
      "summary": "A technical breakdown of how hash-prefix range partitioning enables private breach audits.",
      "content": "## Introduction\n\nk-Anonymity provides a formal privacy guarantee...",
      "author_name": "CredLock Security Team",
      "read_time_minutes": 5,
      "tags": ["k-anonymity", "cryptography", "privacy"],
      "published_at": "2024-03-15T08:00:00.000Z"
    },
    "timestamp": "2026-11-20T14:00:00.000Z"
  }
  ```
