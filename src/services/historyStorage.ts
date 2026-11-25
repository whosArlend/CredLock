import type { SanitizedAnalysisRecord, SanitizedBreachRecord } from '@/types';
import {
  STORES,
  isIndexedDBAvailable,
  getAllFromStore,
  getByIdFromStore,
  putInStore,
  deleteFromStore,
  clearStore,
} from './db.ts';

/**
 * Storage Repository for Sanitized CredLock Records (Phase 2.6)
 *
 * Primary storage: IndexedDB ("credlock-db")
 * In-memory cache: Maintained for instant synchronous reads and Node.js testing.
 *
 * Security Guarantee:
 * Under NO circumstances are plaintext passwords, full hashes, prefixes,
 * or suffixes persisted or cached here.
 */

let analysisCache: SanitizedAnalysisRecord[] = [];
let breachCache: SanitizedBreachRecord[] = [];
let isInitialized = false;
let initPromise: Promise<void> | null = null;

// Event emitted on window to synchronize reactive hooks across components
export const HISTORY_CHANGE_EVENT = 'credlock:history-updated';

function notifyChange(): void {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent(HISTORY_CHANGE_EVENT));
    } catch {
      // ignore in environments without CustomEvent
    }
  }
}

/**
 * Initializes persistent history from IndexedDB.
 * If in-memory records already exist (e.g. created before DB opened),
 * migrates them to IndexedDB once without duplicates.
 */
export async function initHistoryStorage(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!isIndexedDBAvailable()) {
      isInitialized = true;
      return;
    }

    try {
      const [dbAnalysis, dbBreach] = await Promise.all([
        getAllFromStore<SanitizedAnalysisRecord>(STORES.ANALYSIS),
        getAllFromStore<SanitizedBreachRecord>(STORES.BREACH),
      ]);

      // One-time session migration: if any in-memory records existed prior to DB init,
      // save them into IndexedDB if not already present
      const existingAnalysisIds = new Set(dbAnalysis.map((r) => r.id.toLowerCase()));
      for (const memRecord of analysisCache) {
        if (!existingAnalysisIds.has(memRecord.id.toLowerCase())) {
          await putInStore(STORES.ANALYSIS, memRecord);
          dbAnalysis.push(memRecord);
        }
      }

      const existingBreachIds = new Set(dbBreach.map((r) => r.id.toLowerCase()));
      for (const memRecord of breachCache) {
        if (!existingBreachIds.has(memRecord.id.toLowerCase())) {
          await putInStore(STORES.BREACH, memRecord);
          dbBreach.push(memRecord);
        }
      }

      // Sort newest first
      dbAnalysis.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      dbBreach.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      analysisCache = dbAnalysis;
      breachCache = dbBreach;
      isInitialized = true;
      notifyChange();
    } catch (err) {
      console.warn('[CredLock Storage] Failed to initialize from IndexedDB, falling back to session cache:', err);
      isInitialized = true;
    }
  })();

  return initPromise;
}

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  initHistoryStorage().catch((err) => {
    console.warn('[CredLock Storage] Auto-init error:', err);
  });
}

/* ==========================================================================
   Analysis History Operations
   ========================================================================== */

/**
 * Retrieves all sanitized analysis records (synchronous cached snapshot).
 */
export function getAnalysisRecords(): SanitizedAnalysisRecord[] {
  return [...analysisCache];
}

/**
 * Retrieves all sanitized analysis records asynchronously from IndexedDB.
 */
export async function getAnalysisRecordsAsync(): Promise<SanitizedAnalysisRecord[]> {
  await initHistoryStorage();
  if (isIndexedDBAvailable()) {
    try {
      const records = await getAllFromStore<SanitizedAnalysisRecord>(STORES.ANALYSIS);
      analysisCache = records;
      return [...records];
    } catch (err) {
      console.warn('[CredLock Storage] Error reading analysis records from IndexedDB:', err);
    }
  }
  return [...analysisCache];
}

/**
 * Retrieves a single sanitized analysis record by ID (synchronous cached snapshot).
 */
export function getAnalysisRecordById(id: string | undefined): SanitizedAnalysisRecord | undefined {
  if (!id) return undefined;
  return analysisCache.find((rec) => rec.id.toLowerCase() === id.toLowerCase());
}

/**
 * Retrieves a single sanitized analysis record by ID asynchronously from IndexedDB.
 */
export async function getAnalysisRecordByIdAsync(id: string | undefined): Promise<SanitizedAnalysisRecord | undefined> {
  if (!id) return undefined;
  await initHistoryStorage();

  if (isIndexedDBAvailable()) {
    try {
      const record = await getByIdFromStore<SanitizedAnalysisRecord>(STORES.ANALYSIS, id);
      if (record) return record;
    } catch (err) {
      console.warn(`[CredLock Storage] Error reading analysis record ${id} from IndexedDB:`, err);
    }
  }

  return getAnalysisRecordById(id);
}

/**
 * Adds an actual evaluated sanitized analysis record.
 * Updates both the in-memory cache and IndexedDB.
 */
export function addAnalysisRecord(record: SanitizedAnalysisRecord): void {
  // Update in-memory cache immediately
  analysisCache = [record, ...analysisCache.filter((r) => r.id !== record.id)];
  notifyChange();

  // Persist to IndexedDB asynchronously
  if (isIndexedDBAvailable()) {
    putInStore(STORES.ANALYSIS, record).catch((err) => {
      console.warn('[CredLock Storage] Failed to persist analysis record to IndexedDB:', err);
    });
  }
}

/**
 * Asynchronous version of addAnalysisRecord awaiting IndexedDB write.
 */
export async function addAnalysisRecordAsync(record: SanitizedAnalysisRecord): Promise<void> {
  analysisCache = [record, ...analysisCache.filter((r) => r.id !== record.id)];
  notifyChange();

  if (isIndexedDBAvailable()) {
    await putInStore(STORES.ANALYSIS, record);
  }
}

/**
 * Deletes a single analysis record by ID from cache and IndexedDB.
 */
export async function deleteAnalysisRecordAsync(id: string): Promise<void> {
  analysisCache = analysisCache.filter((r) => r.id.toLowerCase() !== id.toLowerCase());
  notifyChange();

  if (isIndexedDBAvailable()) {
    await deleteFromStore(STORES.ANALYSIS, id);
  }
}

/* ==========================================================================
   Breach History Operations
   ========================================================================== */

/**
 * Retrieves all sanitized breach query records (synchronous cached snapshot).
 */
export function getBreachRecords(): SanitizedBreachRecord[] {
  return [...breachCache];
}

/**
 * Retrieves all sanitized breach query records asynchronously from IndexedDB.
 */
export async function getBreachRecordsAsync(): Promise<SanitizedBreachRecord[]> {
  await initHistoryStorage();
  if (isIndexedDBAvailable()) {
    try {
      const records = await getAllFromStore<SanitizedBreachRecord>(STORES.BREACH);
      breachCache = records;
      return [...records];
    } catch (err) {
      console.warn('[CredLock Storage] Error reading breach records from IndexedDB:', err);
    }
  }
  return [...breachCache];
}

/**
 * Retrieves a single sanitized breach record by ID (synchronous cached snapshot).
 */
export function getBreachRecordById(id: string | undefined): SanitizedBreachRecord | undefined {
  if (!id) return undefined;
  return breachCache.find((rec) => rec.id.toLowerCase() === id.toLowerCase());
}

/**
 * Retrieves a single sanitized breach record by ID asynchronously from IndexedDB.
 */
export async function getBreachRecordByIdAsync(id: string | undefined): Promise<SanitizedBreachRecord | undefined> {
  if (!id) return undefined;
  await initHistoryStorage();

  if (isIndexedDBAvailable()) {
    try {
      const record = await getByIdFromStore<SanitizedBreachRecord>(STORES.BREACH, id);
      if (record) return record;
    } catch (err) {
      console.warn(`[CredLock Storage] Error reading breach record ${id} from IndexedDB:`, err);
    }
  }

  return getBreachRecordById(id);
}

/**
 * Adds an actual sanitized breach check query result.
 * Updates both the in-memory cache and IndexedDB.
 */
export function addBreachRecord(record: SanitizedBreachRecord): void {
  breachCache = [record, ...breachCache.filter((r) => r.id !== record.id)];
  notifyChange();

  if (isIndexedDBAvailable()) {
    putInStore(STORES.BREACH, record).catch((err) => {
      console.warn('[CredLock Storage] Failed to persist breach record to IndexedDB:', err);
    });
  }
}

/**
 * Asynchronous version of addBreachRecord awaiting IndexedDB write.
 */
export async function addBreachRecordAsync(record: SanitizedBreachRecord): Promise<void> {
  breachCache = [record, ...breachCache.filter((r) => r.id !== record.id)];
  notifyChange();

  if (isIndexedDBAvailable()) {
    await putInStore(STORES.BREACH, record);
  }
}

/**
 * Deletes a single breach record by ID from cache and IndexedDB.
 */
export async function deleteBreachRecordAsync(id: string): Promise<void> {
  breachCache = breachCache.filter((r) => r.id.toLowerCase() !== id.toLowerCase());
  notifyChange();

  if (isIndexedDBAvailable()) {
    await deleteFromStore(STORES.BREACH, id);
  }
}

/* ==========================================================================
   Full History Clear Operations
   ========================================================================== */

/**
 * Clears all current in-memory history records and wipes IndexedDB stores.
 */
export function clearAllHistory(): void {
  analysisCache = [];
  breachCache = [];
  notifyChange();

  if (isIndexedDBAvailable()) {
    Promise.all([
      clearStore(STORES.ANALYSIS),
      clearStore(STORES.BREACH),
    ]).catch((err) => {
      console.warn('[CredLock Storage] Error clearing IndexedDB stores:', err);
    });
  }
}

/**
 * Asynchronously clears all current in-memory history records and wipes IndexedDB stores.
 */
export async function clearAllHistoryAsync(): Promise<void> {
  analysisCache = [];
  breachCache = [];
  notifyChange();

  if (isIndexedDBAvailable()) {
    await Promise.all([
      clearStore(STORES.ANALYSIS),
      clearStore(STORES.BREACH),
    ]);
  }
}

/**
 * Explicit allowlist of non-authentication localStorage keys designated for local history cleanup.
 * Broad prefixes (e.g., 'credlock') are intentionally avoided so Supabase auth tokens
 * and unrelated preferences are never removed.
 */
export const CLEARABLE_LOCAL_STORAGE_KEYS = [
  'credlock_analysis_history',
  'credlock_breach_history',
  'analysis_history',
  'breach_history',
] as const;

/**
 * Protected authentication storage keys that must NEVER be removed by local data cleanup.
 */
export const PROTECTED_AUTH_STORAGE_KEYS = ['credlock-auth-token'] as const;

export function isProtectedAuthStorageKey(key: string): boolean {
  return (
    (PROTECTED_AUTH_STORAGE_KEYS as readonly string[]).includes(key) ||
    /^sb-.*-auth-token$/i.test(key)
  );
}

/**
 * Safely clears all local analysis and breach history from IndexedDB and
 * explicitly allowlisted localStorage keys, strictly preserving Supabase Auth tokens
 * and unrelated application data.
 */
export async function clearLocalUserDataAsync(
  storage?: Pick<Storage, 'removeItem'> | null
): Promise<void> {
  await clearAllHistoryAsync();

  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined' && window.localStorage
        ? window.localStorage
        : null;

  if (targetStorage) {
    for (const key of CLEARABLE_LOCAL_STORAGE_KEYS) {
      if (!isProtectedAuthStorageKey(key)) {
        targetStorage.removeItem(key);
      }
    }
  }
}
