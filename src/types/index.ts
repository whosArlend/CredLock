/**
 * CredLock Global Types and Sanitized Domain Entities
 */

// Sanitized record for password analysis (ZERO plaintext passwords stored)
export interface SanitizedAnalysisRecord {
  id: string;               // Cryptographically generated UUID
  timestamp: string;        // ISO 8601 string
  passwordLength: number;   // Character length only
  entropyBits: number;      // Estimated guess-work difficulty in bits: log2(guesses)
  score: number;            // 0 (Very Weak) to 4 (Very Strong)
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasNumbers: boolean;
  hasSymbols: boolean;
  crackTimeDisplay: string; // Human-readable crack time under standard offline slow hashing
  strengthLabel?: string;   // "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong"
  warning?: string | null;  // Actionable feedback warning from estimator
}

// Sanitized record for breach checks (k-anonymity results)
// Notice: ZERO plaintext passwords, full hashes, prefixes, or suffixes are ever persisted.
export interface SanitizedBreachRecord {
  id: string;               // Cryptographically generated UUID
  timestamp: string;        // ISO 8601 string
  isBreached: boolean;      // Exposure status
  breachCount: number;      // Frequency of exposure found in breaches
}

// In-memory result from active breach query
export interface BreachCheckResult {
  isBreached: boolean;
  breachCount: number;
  prefix: string;
  queriedAt: string;
}

export type BreachCheckStatus = 'idle' | 'loading' | 'success' | 'error';


// Configuration options for Secure Password Generator (Phase 2.4)
export interface GeneratorOptions {
  length: number;           // Target length (8 to 64)
  includeLowercase: boolean;
  includeUppercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

// Result structure from password generator (strictly in-memory)
export interface GeneratorResult {
  password: string;
  length: number;
  theoreticalPoolEntropyBits: number; // Theoretical pool-based entropy estimate: length * log2(poolSize). Upper bound; category constraints reduce exact keyspace.
  poolSize: number;
  options: GeneratorOptions;
  characterCounts: {
    lowercase: number;
    uppercase: number;
    numbers: number;
    symbols: number;
  };
}

// Validation feedback for generator configuration
export interface GeneratorValidationResult {
  isValid: boolean;
  error?: string;
}

// Dashboard Security Intelligence Types (Phase 3.4B)
export * from './dashboard.ts';

// Breach Intelligence API Types (Phase 3.4C)
export * from './breach.ts';

// Security Recommendations API Types (Phase 3.4D)
export * from './recommendation.ts';

// Security Articles API Types (Phase 3.4E)
export * from './article.ts';

