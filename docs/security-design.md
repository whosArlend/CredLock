# Security & Privacy Design — CredLock

## 1. Zero-Knowledge Principle

CredLock operates under a zero-trust model regarding credential data:
* **Local In-Memory Evaluation:** Password strength analysis runs 100% locally in the browser sandbox. No password string is ever transmitted over network sockets, written to `localStorage`, `sessionStorage`, `IndexedDB`, cookies, or persistent storage.
* **Transient Memory Scoping:** Passwords remain in component memory only while the user is actively typing or viewing the page. State is cleared upon navigation or when the user invokes the clear input control.
* **No Telemetry or Console Leakage:** Passwords or derived cryptographic strings are strictly excluded from `console.log`, analytics, error handlers, and telemetry.
* **No Hash or Prefix Persistence:** Full password hashes, hash suffixes, and SHA-1 prefixes are never stored or retained in history logs.

---

## 2. Password Strength Evaluation Engine (Phase 2.3)

CredLock integrates `@zxcvbn-ts/core` (v4.2.0), `@zxcvbn-ts/language-common` (v4.1.3), and `@zxcvbn-ts/language-en` (v4.1.1) as its core password estimation engine.

### Heuristic Scoring Methodology
The engine estimates the minimum number of guesses an attacker would require to discover a password under an optimal guessing order:

| Score | Label | Description | Estimated Guesses Range |
| :---: | :--- | :--- | :--- |
| **0** | **Very Weak** | Vulnerable to instant dictionary and automated single-word attacks. | $< 10^3$ |
| **1** | **Weak** | Insufficient protection against offline dictionary permutations. | $10^3 - 10^6$ |
| **2** | **Fair** | Moderate protection against online attacks; vulnerable to offline GPU cracking. | $10^6 - 10^8$ |
| **3** | **Strong** | Strong resistance against automated brute-force attacks across realistic threat models. | $10^8 - 10^{10}$ |
| **4** | **Very Strong** | Exceptional resistance against large-scale offline cracking clusters. | $\ge 10^{10}$ |

### Pattern Detection
The estimator actively detects and penalizes common human password habits:
* **Dictionary Matches:** Common passwords, English words, male/female names, and surnames.
* **Spatial Patterns:** Adjacent key walks and keyboard patterns (e.g. `qwerty`, `zxcvbn`).
* **Repeats & Sequences:** Repeated characters (`aaa`, `111`) and sequential runs (`abc`, `12345`).
* **L33t Substitutions:** Predictable character replacements (e.g. `@` for `a`, `0` for `o`, `$` for `s`).
* **Date Formats:** Common calendar formats and birth years (e.g. `1998`, `2024`).

---

## 3. Mathematical Precision: Entropy vs. Guess-Work Difficulty

CredLock maintains strict academic and technical precision regarding entropy terminology:

### 1. Estimated Guess-Work Difficulty (Crack Entropy)
$$\text{Crack Difficulty (bits)} = \log_2(\text{guesses})$$
* **Definition:** The number of binary bits corresponding to the estimated number of guesses an attacker must execute: $2^{\text{bits}} = \text{guesses}$.
* **Distinction:** This is **not** information-theoretic Shannon entropy. It represents the difficulty of cracking the password under realistic, modeled attacker guessing orders.

### 2. Theoretical Character-Pool Entropy
$$\text{Theoretical Pool Entropy (bits)} = L \times \log_2(R)$$
* Where $L$ is password length and $R$ is active pool size (lowercase: 26, uppercase: 26, digits: 10, symbols: 33).
* **Limitation:** This metric assumes purely uniform and independent character selection. Because humans exhibit predictable linguistic and spatial patterns, real-world passwords possess substantially lower effective entropy than their theoretical character pool suggests.

### 3. Shannon Entropy
* Defined as $H(X) = -\sum P(x) \log_2 P(x)$ over a known probability distribution of user passwords. CredLock explicitly avoids presenting raw guess numbers as Shannon entropy.

---

## 4. Multi-Scenario Threat Modeling (Crack Time Estimates)

Crack times are estimated across four industry-standard threat models:

1. **Offline Slow Hashing ($10^4$ guesses/sec):**
   * Models adaptive, memory-hard key derivation functions such as bcrypt, Argon2, and scrypt.
2. **Offline Fast Hashing ($10^{10}$ guesses/sec):**
   * Models high-end multi-GPU cracking clusters computing raw uniterated hashes (e.g. MD5, SHA-1, SHA-256).
3. **Online Unthrottled ($10$ guesses/sec):**
   * Models an unmonitored web endpoint lacking rate-limiting, CAPTCHAs, or lockout controls.
4. **Online Throttled ($100$ guesses/hour):**
   * Models a secure web service enforcing strict rate limiting and IP/account lockouts.

**Important Security Limitation:** Crack-time estimates depend on assumed attack speed and methodology. Hardware advances, distributed botnets, and pre-computed rainbow tables can alter crack times significantly. Estimates do not constitute a guarantee of security.

---

## 5. Sanitized History Boundary

The history model strictly isolates non-reversible metadata from credentials:
* **Permitted in Analysis History:**
  - `id` (cryptographically generated random UUID)
  - `timestamp` (ISO 8601 string)
  - `passwordLength` (integer count)
  - `entropyBits` (numeric guess difficulty in bits: $\log_2(\text{guesses})$)
  - `score` (integer 0–4)
  - `strengthLabel` ("Very Weak" to "Very Strong")
  - `hasLowercase`, `hasUppercase`, `hasNumbers`, `hasSymbols` (booleans)
  - `crackTimeDisplay` (e.g. "centuries", "2 hours")
  - `warning` (actionable guidance note, e.g. "This is a commonly used password.")
* **Strictly Prohibited from Persistence:**
  - Plaintext passwords
  - Password fragments or masks
  - Full cryptographic hashes
  - Hash suffixes or SHA-1 prefixes
  - Password-derived identifiers

---

## 6. Secure Password Generation & Cryptographic Soundness (Phase 2.4)

### 1. Cryptographically Secure Pseudo-Random Number Generation (CSPRNG)
CredLock exclusively utilizes the browser's native Web Crypto API (`crypto.getRandomValues()`). Standard pseudo-random engines like `Math.random()` are strictly prohibited due to known predictability, small internal state, and vulnerability to seed recovery attacks.

If `crypto.getRandomValues()` is unavailable, CredLock throws an explicit `WebCryptoUnavailableError` rather than silently degrading to insecure fallbacks.

### 2. Elimination of Modulo Bias via Rejection Sampling
A common flaw in random character generators is naive modulo reduction (`rand % poolSize`). When mapping a uniform 32-bit unsigned integer ($M = 2^{32} = 4,294,967,296$) onto an arbitrary pool size $N$, modulo bias occurs whenever $M$ is not evenly divisible by $N$. Lower index values would possess an infinitesimally higher probability of selection:
$$P(\text{index} < (M \pmod N)) = \frac{\lfloor M/N \rfloor + 1}{M} > \frac{\lfloor M/N \rfloor}{M}$$

To eliminate this bias, CredLock implements **rejection sampling**:
$$\text{limit} = 2^{32} - (2^{32} \pmod N)$$
Any sampled integer $R \ge \text{limit}$ is discarded, and a new sample is drawn. Once $R < \text{limit}$, the value $R \pmod N$ is returned. This mathematically guarantees exact uniform probability $\frac{1}{N}$ for all elements.

### 3. Defined Character Sets
* **Lowercase Letters (`LOWERCASE_CHARS`):** 26 characters (`a-z`)
* **Uppercase Letters (`UPPERCASE_CHARS`):** 26 characters (`A-Z`)
* **Numeric Digits (`NUMBER_CHARS`):** 10 characters (`0-9`)
* **Printable ASCII Symbols (`SYMBOL_CHARS`):** 32 characters (`!@#$%^&*()_+-=[]{}|;:,.<>?/~"'\\```)
* **Maximum Combined Pool Size:** 94 printable ASCII characters (excluding space and control characters).

### 4. Candidate-Level Rejection Sampling & Uniform Distribution
To satisfy the requirement that generated passwords contain at least one character from every active category without introducing distribution bias, CredLock implements **Candidate-Level Rejection Sampling**:

1. **Unrestricted Generation:** A candidate sequence $w$ of length $L$ is generated by independently selecting every character uniformly from the combined active pool $\Sigma$ using `getSecureRandomInt(poolSize)`.
   Because each position is selected independently and uniformly:
   $$\forall w \in \Sigma^L, \quad P(w) = \left(\frac{1}{|\Sigma|}\right)^L = \frac{1}{|\Sigma|^L}$$
2. **Category Constraint Verification:** The candidate is checked against the active categories. Let $V \subset \Sigma^L$ be the set of sequences containing at least one character from each enabled category.
3. **Rejection & Resampling:** If the candidate lacks any active category, it is discarded, and a fresh candidate is independently generated.
4. **Mathematical Uniformity:**
   By Bayes' theorem and conditional probability:
   $$\forall w \in V, \quad P(w \mid w \in V) = \frac{P(w \cap \{w \in V\})}{P(w \in V)} = \frac{1 / |\Sigma|^L}{|V| / |\Sigma|^L} = \frac{1}{|V|}$$
   $$\forall w \notin V, \quad P(w \mid w \in V) = 0$$
   Because every valid candidate in $V$ has identical probability $\frac{1}{|V|}$, this approach guarantees a strictly uniform distribution over the set of category-compliant passwords.
5. **Defensive Retry Boundary:** A defensive threshold `MAX_GENERATOR_ATTEMPTS = 1000` is enforced. If exceeded, an explicit `GenerationAttemptLimitExceededError` is thrown. The system never falls back to an invalid candidate or a weaker pseudo-random generator.

### 5. Theoretical Pool-Based Entropy vs. Category Constraints
CredLock maintains strict precision regarding entropy terminology:
- **Metric Label:** `Theoretical Pool Entropy` or `Pool-Based Entropy Estimate`.
- **Formula:** $\text{Entropy Estimate} = L \times \log_2(|\Sigma|)$
- **Clarification:** This metric is a theoretical upper-bound estimate assuming unconstrained, independent uniform character selection from the combined pool. Because enforcing category requirements restricts the space of valid outputs ($|V| < |\Sigma|^L$), true category-constrained keyspace entropy is slightly lower: $H = \log_2(|V|) \le L \times \log_2(|\Sigma|)$.
- CredLock explicitly avoids presenting this metric as a measured entropy value.

### 6. In-Memory Lifecycle, Zero Persistence & Navigation State Security
Generated passwords exist solely within transient React component state:
- Never written to `localStorage`, `sessionStorage`, or `IndexedDB`.
- Excluded from application history logs.
- Never output to `console.log` or error monitoring.
- Immediately discarded when the user clicks "Clear" or navigates away.
- **Test in Analyzer Transition Security:** When transferring a generated password from `GeneratorPage` to `AnalyzerPage`, the secret is passed via React Router navigation state. To prevent the secret from lingering in browser session history (e.g., across F5 page reloads or back/forward navigation), `AnalyzerPage` executes `navigate(location.pathname, { replace: true, state: null })` immediately upon component mount. This purges `prefillPassword` from `window.history.state`.

### 7. Clipboard Security Realities
When the user clicks "Copy", the password is written to the operating system clipboard via `navigator.clipboard.writeText()`. CredLock avoids false security claims:
- CredLock explicitly notifies users that clipboard contents can be inspected by other running desktop/mobile applications and system clipboard history managers.
- CredLock does not claim that clipboard contents can be guaranteed to self-destruct or be safely erased across different OS architectures. Users are advised to paste the credential and clear their clipboard manually.

---

## 8. Password Breach Checker Security & Privacy Model (Phase 2.5)

### 1. The k-Anonymity Range Query Protocol
To verify credentials against compromised databases without exposing the secret to the verification service or network eavesdroppers, CredLock implements the **k-Anonymity mathematical model**:
1. **Local Digest Computation:** The candidate password $P$ is converted to UTF-8 bytes and hashed using `crypto.subtle.digest('SHA-1', data)` client-side, yielding a 160-bit (40 hex characters) digest $H(P)$.
2. **Prefix Partitioning:** The digest is split into:
   - **Prefix:** The first 5 hexadecimal characters ($H_1 = H[0..4]$), representing $16^5 = 1,048,576$ possible buckets.
   - **Suffix:** The remaining 35 hexadecimal characters ($H_2 = H[5..39]$), representing a space of $16^{35} \approx 6.3 \times 10^{41}$ possibilities.
3. **Range Query:** The browser requests `GET https://api.pwnedpasswords.com/range/{H_1}`. Because the prefix matches hundreds of thousands of unrelated passwords across Have I Been Pwned's dataset of 800M+ hashes, the remote service learns only that the user possesses *one of the thousands of passwords* sharing that prefix. The specific password cannot be identified.
4. **Padding Header Protection:** The request includes `Add-Padding: true`. HIBP includes synthetic padding records in the response, preventing eavesdroppers from deducing the specific prefix frequency through network packet size analysis (traffic analysis mitigation).
5. **Local Suffix Matching:** The remote service returns a list of candidate suffixes and their breach frequencies. CredLock parses this list client-side and performs an exact string comparison between $H_2$ and the returned suffixes.
6. **Mathematical Privacy Guarantee:**
   - Plaintext passwords are never transmitted.
   - Complete 40-character SHA-1 digests are never transmitted.
   - The 35-character suffix is never transmitted.
   - Neither the password nor any hash is stored in browser cache, cookies, `localStorage`, `sessionStorage`, or `IndexedDB`.

### 2. Protocol Role of SHA-1
- SHA-1 is used strictly because it is mandated by the Have I Been Pwned Pwned Passwords range lookup API.
- CredLock explicitly does **not** advocate or use SHA-1 for modern password storage or cryptographic integrity protection.

### 3. Sanitized History Storage
When users explicitly save a breach query result, the record contains only:
- `id`: Random UUID generated via `crypto.randomUUID()`
- `timestamp`: ISO 8601 creation string
- `isBreached`: Exposure status boolean
- `breachCount`: Public database frequency count
- **Prohibited Fields:** The record strictly excludes plaintext passwords, password fragments, full hashes, prefixes, suffixes, or raw API response payloads.

---

## 9. Persistent Storage & Client Privacy Model (Phase 2.6: IndexedDB)

### 1. Dedicated IndexedDB Enclave (`credlock-db`)
CredLock implements persistent storage exclusively using the browser's structured IndexedDB API:
* **Object Store Isolation:** Two dedicated stores (`analysis_history` and `breach_history`) isolate data domains.
* **No `localStorage` for Sensitive Metadata:** `localStorage` is completely prohibited for credential or evaluation persistence to avoid insecure synchronous disk writes, quota limits, and plain text inspection vectors.
* **Non-Reversible Schema Enforced:**
  - *Analysis Records:* Retain only length, estimated guess difficulty bits, score (0-4), character composition flags, and crack time label.
  - *Breach Records:* Retain only exposure status boolean, occurrence count, and timestamp.
* **Prohibited Attributes:** The storage subsystem asserts that properties `password`, `hash`, `sha1`, `prefix`, `suffix`, and `rawResponse` are strictly absent.

### 2. Client-Side Data Purge Security
* **Single-Item Deletion:** Users can delete individual audit logs from IndexedDB transactions with immediate cache and reactive UI synchronization.
* **Clear Local Data:** Provides a confirmation modal before triggering an asynchronous database flush. CredLock flushes only its own IndexedDB stores (`credlock-db`) and CredLock-scoped keys, strictly preventing deletion of data from other origins or applications sharing localhost.
* **Memory Security Disclaimer:** CredLock explicitly clarifies to users that while IndexedDB records are deleted from storage, JavaScript runtime environments cannot guarantee immediate zeroization of garbage-collected hardware RAM.


