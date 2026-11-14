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
  theoreticalEntropyBits: number;
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

// REST API Adapter Interface (Prepared for Module 1 Integration)
export interface IModule1Service {
  saveAnalysisRecord(record: SanitizedAnalysisRecord): Promise<boolean>;
  getAnalysisHistory(): Promise<SanitizedAnalysisRecord[]>;
  getAnalysisDetail(id: string): Promise<SanitizedAnalysisRecord | null>;
  saveBreachRecord(record: SanitizedBreachRecord): Promise<boolean>;
  getBreachHistory(): Promise<SanitizedBreachRecord[]>;
  getBreachDetail(id: string): Promise<SanitizedBreachRecord | null>;
}
