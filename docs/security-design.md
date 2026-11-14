# Security & Privacy Design — CredLock

## 1. Zero-Knowledge Principle

CredLock operates under a zero-trust model regarding credential data:
* **No Plaintext Persistence:** The browser never writes plaintext passwords to `localStorage`, `sessionStorage`, `IndexedDB`, cookies, or temporary files.
* **No Hash or Prefix Persistence:** Full password hashes, hash suffixes, and SHA-1 prefixes are never stored or retained in history logs. The k-anonymity range lookup occurs entirely in transient memory during query execution.
* **Transient Memory Scoping:** Passwords and cryptographic digests remain in memory solely during active user interaction and are dereferenced upon unmounting.
* **No Telemetry Leakage:** Passwords or credentials are strictly excluded from console logging, analytics payloads, or error monitoring tools.

## 2. Cryptographic Randomness (CSPRNG)

The Secure Password Generator strictly invokes the browser's native **Web Crypto API**:
```typescript
const array = new Uint32Array(length);
window.crypto.getRandomValues(array);
```
* **Prohibition:** Standard `Math.random()` uses pseudo-random number generators (PRNG) with predictable seeds and insufficient entropy. Its use is strictly prohibited for security features.

## 3. k-Anonymity Breach Detection Protocol

To determine if a password has been compromised without disclosing it to an external server:
1. The client computes the SHA-1 digest locally:
   $$\text{Digest} = \text{SHA-1}(\text{password})$$
   (Example: `5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8`)
2. The client extracts the 5-character prefix in transient memory:
   $$\text{Prefix} = \text{Digest}[0..4] = \text{"5BAA6"}$$
   $$\text{Suffix} = \text{Digest}[5..39] = \text{"1E4C9B93F3F0682250B6CF8331B7EE68FD8"}$$
3. The client queries the Pwned Passwords range endpoint:
   `GET https://api.pwnedpasswords.com/range/5BAA6`
4. The API returns the list of all matching suffixes and their breach frequencies.
5. The client performs an exact match comparison against the local suffix.
6. Once the evaluation completes, all hash fragments are discarded from memory.
7. **Result:** Neither the external API nor any network observer learns the original password or the full hash.

## 4. Sanitized History Boundary

The history model strictly isolates non-reversible metadata from credentials:
* **Permitted in Analysis History:** `id` (random UUID), `timestamp` (ISO 8601), `passwordLength`, `entropyBits`, `score` (0-4), character composition flags (`hasLowercase`, `hasUppercase`, `hasNumbers`, `hasSymbols`), `crackTimeDisplay`.
* **Permitted in Breach History:** `id` (random UUID), `timestamp` (ISO 8601), `isBreached` (boolean), `breachCount` (numeric occurrence count).
* **Strictly Prohibited from Persistence:**
  - Plaintext passwords
  - Full SHA-1 hashes
  - SHA-1 suffixes
  - SHA-1 prefixes
  - Password-derived identifiers or masked password strings
