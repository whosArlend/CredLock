/**
 * CredLock Global Types and Sanitized Domain Entities
 */

// Sanitized record for password analysis (ZERO plaintext passwords stored)
export interface SanitizedAnalysisRecord {
  id: string;               // Cryptographically generated UUID
  timestamp: string;        // ISO 8601 string
  passwordLength: number;   // Length only
  entropyBits: number;      // Calculated entropy
  score: number;            // 0 (Very Weak) to 4 (Very Strong)
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasNumbers: boolean;
  hasSymbols: boolean;
  crackTimeDisplay: string;
}

// Sanitized record for breach checks (k-anonymity results)
// Notice: ZERO plaintext passwords, full hashes, prefixes, or suffixes are ever persisted.
export interface SanitizedBreachRecord {
  id: string;               // Cryptographically generated UUID
  timestamp: string;        // ISO 8601 string
  isBreached: boolean;      // Exposure status
  breachCount: number;      // Frequency of exposure found in breaches
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
