import type { SanitizedAnalysisRecord, SanitizedBreachRecord } from '@/types';

/**
 * In-memory storage abstraction for sanitized records in Phase 2.2.
 * 
 * Architecture Note:
 * This layer currently operates strictly in memory.
 * No mock or fabricated security records are pre-populated.
 * Persistent storage using IndexedDB will be integrated in Phase 2.6.
 * Under no circumstances are plaintext passwords, full hashes,
 * or SHA-1 hash prefixes/suffixes stored here.
 */

let analysisRecords: SanitizedAnalysisRecord[] = [];
let breachRecords: SanitizedBreachRecord[] = [];

/**
 * Retrieves all sanitized analysis records from current memory.
 */
export function getAnalysisRecords(): SanitizedAnalysisRecord[] {
  return [...analysisRecords];
}

/**
 * Retrieves a single sanitized analysis record by ID.
 * Returns undefined if ID is invalid or not found.
 */
export function getAnalysisRecordById(id: string | undefined): SanitizedAnalysisRecord | undefined {
  if (!id) return undefined;
  return analysisRecords.find((rec) => rec.id.toLowerCase() === id.toLowerCase());
}

/**
 * Adds an actual evaluated sanitized analysis record.
 */
export function addAnalysisRecord(record: SanitizedAnalysisRecord): void {
  analysisRecords = [record, ...analysisRecords];
}

/**
 * Retrieves all sanitized breach query records from current memory.
 */
export function getBreachRecords(): SanitizedBreachRecord[] {
  return [...breachRecords];
}

/**
 * Retrieves a single sanitized breach record by ID.
 * Returns undefined if ID is invalid or not found.
 */
export function getBreachRecordById(id: string | undefined): SanitizedBreachRecord | undefined {
  if (!id) return undefined;
  return breachRecords.find((rec) => rec.id.toLowerCase() === id.toLowerCase());
}

/**
 * Adds an actual sanitized breach check query result.
 */
export function addBreachRecord(record: SanitizedBreachRecord): void {
  breachRecords = [record, ...breachRecords];
}

/**
 * Clears all current in-memory history records.
 */
export function clearAllHistory(): void {
  analysisRecords = [];
  breachRecords = [];
}
