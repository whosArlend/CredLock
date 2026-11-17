# Custom REST API Integration Strategy — CredLock

## Current Integration Status: Specification Pending

> **Notice:** The actual REST API / Web Service documentation and implementation developed during the user's **Module 1 assignment** have not yet been provided.  
> In strict accordance with architectural rules, **no imaginary API endpoints, authentication mechanisms (e.g. fake JWT handlers), or mocked backend behaviors are assumed**.

---

## 1. Adapter & Repository Architecture

To prevent tight coupling and allow immediate integration the moment Module 1 specifications are supplied, CredLock defines an abstract service interface in `src/types/index.ts`:

```typescript
export interface IModule1Service {
  saveAnalysisRecord(record: SanitizedAnalysisRecord): Promise<boolean>;
  getAnalysisHistory(): Promise<SanitizedAnalysisRecord[]>;
  getAnalysisDetail(id: string): Promise<SanitizedAnalysisRecord | null>;
  saveBreachRecord(record: SanitizedBreachRecord): Promise<boolean>;
  getBreachHistory(): Promise<SanitizedBreachRecord[]>;
  getBreachDetail(id: string): Promise<SanitizedBreachRecord | null>;
}
```

---

## 2. Permitted Sanitized Payloads

When the Module 1 REST API is integrated, the data transmitted will be strictly limited to non-reversible analytical metrics:

### Example: Analysis Log Payload
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "timestamp": "2026-11-14T14:30:00Z",
  "passwordLength": 16,
  "entropyBits": 84.2,
  "score": 4,
  "hasLowercase": true,
  "hasUppercase": true,
  "hasNumbers": true,
  "hasSymbols": true,
  "crackTimeDisplay": "2.4 million years"
}
```

### Example: Breach Log Payload
```json
{
  "id": "7b89d421-2a1e-45e3-9821-6b83f0923f11",
  "timestamp": "2026-11-14T14:45:00Z",
  "isBreached": true,
  "breachCount": 38241
}
```

---

## 3. Next Steps for Module 1 Integration
1. Receive endpoint specifications, URL schema, and authentication requirements from student.
2. Implement `src/services/api/Module1HttpAdapter.ts` adhering to `IModule1Service`.
3. Configure environment variable `VITE_API_BASE_URL` in `.env`.

---

## 4. External Privacy-Preserving API: Have I Been Pwned (HIBP) Range API (Phase 2.5)

### 1. Endpoint Specification
* **URL:** `https://api.pwnedpasswords.com/range/{first5HashCharacters}`
* **Method:** `GET`
* **Protocol:** HTTPS / TLS 1.3
* **k-Anonymity Scope:** First 5 uppercase hexadecimal characters of the client-computed SHA-1 hash.

### 2. Request Headers
```http
GET /range/5BAA6 HTTP/1.1
Host: api.pwnedpasswords.com
Accept: text/plain
Add-Padding: true
```
* **`Add-Padding: true`**: Instructs the HIBP service to return synthetic padding entries (with zero or pseudo-random counts) to prevent eavesdroppers from deducing the specific prefix frequency via response packet size analysis (traffic analysis protection).

### 3. Response Format
Plaintext response where each line contains a 35-character hexadecimal suffix and an exposure count separated by a colon:
```text
003D68EB55068C33ACE09247EE4C639306B:3
012A7070EAE3A0261CB0804AEB1348F0650:12
014D735C15904D95A7FDDF7CAAC04EF8476:0
1E4C9B93F3F0682250B6CF8331B7EE68FD8:38241
```

### 4. Client-Side Evaluation
* CredLock parses all `<suffix>:<count>` pairs into a client-side hash map.
* An exact string comparison is executed between the user's computed suffix and the returned set.
* If a match exists with $\text{count} > 0$, the password is confirmed breached.
* If no match exists or $\text{count} = 0$ (padding), the password is confirmed unbreached in the queried database.

