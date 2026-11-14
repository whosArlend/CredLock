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
  "hashPrefix": "5BAA6",
  "isBreached": true,
  "breachCount": 38241
}
```

---

## 3. Next Steps for Module 1 Integration
1. Receive endpoint specifications, URL schema, and authentication requirements from student.
2. Implement `src/services/api/Module1HttpAdapter.ts` adhering to `IModule1Service`.
3. Configure environment variable `VITE_API_BASE_URL` in `.env`.
