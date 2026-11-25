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
 * Storage Repository for Sanitized CredLock Records (Phase 2.6 + Phase 3 Owner Isolation)
 *
 * Primary storage: IndexedDB ("credlock-db")
 * In-memory cache: Maintained for instant synchronous reads and Node.js testing.
 *
 * Security Guarantees:
 * - Under NO circumstances are plaintext passwords, full hashes, prefixes,
 *   or suffixes persisted or cached here.
 * - Every record is strictly scoped to an ownerId ('guest' or Supabase user UUID).
 */

export const GUEST_OWNER_ID = 'guest' as const;

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
 * Resolves an owner identifier from the authenticated user UUID or defaults to 'guest'.
 */
export function resolveHistoryOwnerId(userId?: string | null): string {
  if (typeof userId === 'string' && userId.trim().length > 0) {
    return userId.trim();
  }
  return GUEST_OWNER_ID;
}

/**
 * Normalizes a persisted record's ownerId, treating legacy unowned records as 'guest'.
 */
export function normalizeRecordOwnerId(record?: { ownerId?: string | null } | null): string {
  if (record && typeof record.ownerId === 'string' && record.ownerId.trim().length > 0) {
    return record.ownerId.trim();
  }
  return GUEST_OWNER_ID;
}

function withOwner<T extends { ownerId?: string }>(record: T, ownerId: string): T & { ownerId: string } {
  return {
    ...record,
    ownerId,
  };
}

function normalizeLegacyRecord<T extends { ownerId?: string }>(record: T): T & { ownerId: string } {
  return {
    ...record,
    ownerId: normalizeRecordOwnerId(record),
  };
}

function findCrossOwnerConflict<T extends { id: string; ownerId?: string }>(
  cache: T[],
  id: string,
  targetOwnerId: string
): boolean {
  const existing = cache.find((r) => r.id.toLowerCase() === id.toLowerCase());
  return Boolean(existing && normalizeRecordOwnerId(existing) !== targetOwnerId);
}

/**
 * Initializes persistent history from IndexedDB.
 * Legacy records without ownerId are safely normalized to 'guest' without data loss.
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
      const [rawAnalysis, rawBreach] = await Promise.all([
        getAllFromStore<SanitizedAnalysisRecord>(STORES.ANALYSIS),
        getAllFromStore<SanitizedBreachRecord>(STORES.BREACH),
      ]);

      const dbAnalysis = rawAnalysis.map(normalizeLegacyRecord);
      const dbBreach = rawBreach.map(normalizeLegacyRecord);

      // One-time session migration: if any in-memory records existed prior to DB init,
      // save them into IndexedDB if not already present
      const existingAnalysisIds = new Set(dbAnalysis.map((r) => r.id.toLowerCase()));
      for (const memRecord of analysisCache) {
        if (!existingAnalysisIds.has(memRecord.id.toLowerCase())) {
          const normalized = normalizeLegacyRecord(memRecord);
          await putInStore(STORES.ANALYSIS, normalized);
          dbAnalysis.push(normalized);
        }
      }

      const existingBreachIds = new Set(dbBreach.map((r) => r.id.toLowerCase()));
      for (const memRecord of breachCache) {
        if (!existingBreachIds.has(memRecord.id.toLowerCase())) {
          const normalized = normalizeLegacyRecord(memRecord);
          await putInStore(STORES.BREACH, normalized);
          dbBreach.push(normalized);
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
   Analysis History Operations (Owner-Scoped)
   ========================================================================== */

/**
 * Retrieves sanitized analysis records belonging to the specified owner (synchronous snapshot).
 */
export function getAnalysisRecords(ownerId: string = GUEST_OWNER_ID): SanitizedAnalysisRecord[] {
  const resolvedOwner = resolveHistoryOwnerId(ownerId);
  return analysisCache.filter((r) => normalizeRecordOwnerId(r) === resolvedOwner);
}

/**
 * Retrieves sanitized analysis records belonging to the specified owner from IndexedDB.
 */
export async function getAnalysisRecordsAsync(
  ownerId: string = GUEST_OWNER_ID
): Promise<SanitizedAnalysisRecord[]> {
  const resolvedOwner = resolveHistoryOwnerId(ownerId);
  await initHistoryStorage();
  if (isIndexedDBAvailable()) {
    try {
      const records = (await getAllFromStore<SanitizedAnalysisRecord>(STORES.ANALYSIS)).map(
        normalizeLegacyRecord
      );
      analysisCache = records;
      return records.filter((r) => normalizeRecordOwnerId(r) === resolvedOwner);
    } catch (err) {
      console.warn('[CredLock Storage] Error reading analysis records from IndexedDB:', err);
    }
  }
  return getAnalysisRecords(resolvedOwner);
}

/**
 * Retrieves a single sanitized analysis record by ID only if owned by ownerId (synchronous).
 */
export function getAnalysisRecordById(
  id: string | undefined,
  ownerId: string = GUEST_OWNER_ID
): SanitizedAnalysisRecord | undefined {
  if (!id) return undefined;
  const resolvedOwner = resolveHistoryOwnerId(ownerId);
  const found = analysisCache.find((rec) => rec.id.toLowerCase() === id.toLowerCase());
  if (!found || normalizeRecordOwnerId(found) !== resolvedOwner) {
    return undefined;
  }
  return found;
}

/**
 * Retrieves a single sanitized analysis record by ID only if owned by ownerId (async).
 */
export async function getAnalysisRecordByIdAsync(
  id: string | undefined,
  ownerId: string = GUEST_OWNER_ID
): Promise<SanitizedAnalysisRecord | undefined> {
  if (!id) return undefined;
  const resolvedOwner = resolveHistoryOwnerId(ownerId);
  await initHistoryStorage();

  if (isIndexedDBAvailable()) {
    try {
      const record = await getByIdFromStore<SanitizedAnalysisRecord>(STORES.ANALYSIS, id);
      if (record) {
        const normalized = normalizeLegacyRecord(record);
        return normalizeRecordOwnerId(normalized) === resolvedOwner ? normalized : undefined;
      }
    } catch (err) {
      console.warn(`[CredLock Storage] Error reading analysis record ${id} from IndexedDB:`, err);
    }
  }

  return getAnalysisRecordById(id, resolvedOwner);
}

/**
 * Adds an evaluated sanitized analysis record under the specified owner scope.
 */
export function addAnalysisRecord(
  record: SanitizedAnalysisRecord,
  ownerId?: string | null
): void {
  const resolvedOwner = resolveHistoryOwnerId(ownerId ?? record.ownerId);
  if (findCrossOwnerConflict(analysisCache, record.id, resolvedOwner)) {
    return;
  }

  const ownedRecord = withOwner(record, resolvedOwner);
  analysisCache = [
    ownedRecord,
    ...analysisCache.filter((r) => r.id.toLowerCase() !== ownedRecord.id.toLowerCase()),
  ];
  notifyChange();

  if (isIndexedDBAvailable()) {
    getByIdFromStore<SanitizedAnalysisRecord>(STORES.ANALYSIS, ownedRecord.id)
      .then((existing) => {
        if (existing && normalizeRecordOwnerId(existing) !== resolvedOwner) {
          return;
        }
        return putInStore(STORES.ANALYSIS, ownedRecord);
      })
      .catch((err) => {
        console.warn('[CredLock Storage] Failed to persist analysis record to IndexedDB:', err);
      });
  }
}

/**
 * Asynchronous version of addAnalysisRecord awaiting IndexedDB write and enforcing ownership.
 */
export async function addAnalysisRecordAsync(
  record: SanitizedAnalysisRecord,
  ownerId?: string | null
): Promise<void> {
  const resolvedOwner = resolveHistoryOwnerId(ownerId ?? record.ownerId);
  if (findCrossOwnerConflict(analysisCache, record.id, resolvedOwner)) {
    throw new Error('Cannot overwrite an analysis record owned by another user.');
  }

  if (isIndexedDBAvailable()) {
    const existing = await getByIdFromStore<SanitizedAnalysisRecord>(STORES.ANALYSIS, record.id);
    if (existing && normalizeRecordOwnerId(existing) !== resolvedOwner) {
      throw new Error('Cannot overwrite an analysis record owned by another user.');
    }
  }

  const ownedRecord = withOwner(record, resolvedOwner);
  analysisCache = [
    ownedRecord,
    ...analysisCache.filter((r) => r.id.toLowerCase() !== ownedRecord.id.toLowerCase()),
  ];
  notifyChange();

  if (isIndexedDBAvailable()) {
    await putInStore(STORES.ANALYSIS, ownedRecord);
  }
}

/**
 * Deletes a single analysis record by ID only if it belongs to the specified owner.
 * Returns true if deleted, false if not found or owned by another user.
 */
export async function deleteAnalysisRecordAsync(
  id: string,
  ownerId: string = GUEST_OWNER_ID
): Promise<boolean> {
  if (!id) return false;
  const resolvedOwner = resolveHistoryOwnerId(ownerId);

  const cached = analysisCache.find((r) => r.id.toLowerCase() === id.toLowerCase());
  if (cached && normalizeRecordOwnerId(cached) !== resolvedOwner) {
    return false;
  }

  if (isIndexedDBAvailable()) {
    const stored = await getByIdFromStore<SanitizedAnalysisRecord>(STORES.ANALYSIS, id);
    if (stored && normalizeRecordOwnerId(stored) !== resolvedOwner) {
      return false;
    }
    if (!cached && !stored) {
      return false;
    }
    await deleteFromStore(STORES.ANALYSIS, id);
  } else if (!cached) {
    return false;
  }

  analysisCache = analysisCache.filter((r) => r.id.toLowerCase() !== id.toLowerCase());
  notifyChange();
  return true;
}

/* ==========================================================================
   Breach History Operations (Owner-Scoped)
   ========================================================================== */

/**
 * Retrieves sanitized breach query records belonging to the specified owner (synchronous).
 */
export function getBreachRecords(ownerId: string = GUEST_OWNER_ID): SanitizedBreachRecord[] {
  const resolvedOwner = resolveHistoryOwnerId(ownerId);
  return breachCache.filter((r) => normalizeRecordOwnerId(r) === resolvedOwner);
}

/**
 * Retrieves sanitized breach query records belonging to the specified owner from IndexedDB.
 */
export async function getBreachRecordsAsync(
  ownerId: string = GUEST_OWNER_ID
): Promise<SanitizedBreachRecord[]> {
  const resolvedOwner = resolveHistoryOwnerId(ownerId);
  await initHistoryStorage();
  if (isIndexedDBAvailable()) {
    try {
      const records = (await getAllFromStore<SanitizedBreachRecord>(STORES.BREACH)).map(
        normalizeLegacyRecord
      );
      breachCache = records;
      return records.filter((r) => normalizeRecordOwnerId(r) === resolvedOwner);
    } catch (err) {
      console.warn('[CredLock Storage] Error reading breach records from IndexedDB:', err);
    }
  }
  return getBreachRecords(resolvedOwner);
}

/**
 * Retrieves a single sanitized breach record by ID only if owned by ownerId (synchronous).
 */
export function getBreachRecordById(
  id: string | undefined,
  ownerId: string = GUEST_OWNER_ID
): SanitizedBreachRecord | undefined {
  if (!id) return undefined;
  const resolvedOwner = resolveHistoryOwnerId(ownerId);
  const found = breachCache.find((rec) => rec.id.toLowerCase() === id.toLowerCase());
  if (!found || normalizeRecordOwnerId(found) !== resolvedOwner) {
    return undefined;
  }
  return found;
}

/**
 * Retrieves a single sanitized breach record by ID only if owned by ownerId (async).
 */
export async function getBreachRecordByIdAsync(
  id: string | undefined,
  ownerId: string = GUEST_OWNER_ID
): Promise<SanitizedBreachRecord | undefined> {
  if (!id) return undefined;
  const resolvedOwner = resolveHistoryOwnerId(ownerId);
  await initHistoryStorage();

  if (isIndexedDBAvailable()) {
    try {
      const record = await getByIdFromStore<SanitizedBreachRecord>(STORES.BREACH, id);
      if (record) {
        const normalized = normalizeLegacyRecord(record);
        return normalizeRecordOwnerId(normalized) === resolvedOwner ? normalized : undefined;
      }
    } catch (err) {
      console.warn(`[CredLock Storage] Error reading breach record ${id} from IndexedDB:`, err);
    }
  }

  return getBreachRecordById(id, resolvedOwner);
}

/**
 * Adds a sanitized breach check query result under the specified owner scope.
 */
export function addBreachRecord(
  record: SanitizedBreachRecord,
  ownerId?: string | null
): void {
  const resolvedOwner = resolveHistoryOwnerId(ownerId ?? record.ownerId);
  if (findCrossOwnerConflict(breachCache, record.id, resolvedOwner)) {
    return;
  }

  const ownedRecord = withOwner(record, resolvedOwner);
  breachCache = [
    ownedRecord,
    ...breachCache.filter((r) => r.id.toLowerCase() !== ownedRecord.id.toLowerCase()),
  ];
  notifyChange();

  if (isIndexedDBAvailable()) {
    getByIdFromStore<SanitizedBreachRecord>(STORES.BREACH, ownedRecord.id)
      .then((existing) => {
        if (existing && normalizeRecordOwnerId(existing) !== resolvedOwner) {
          return;
        }
        return putInStore(STORES.BREACH, ownedRecord);
      })
      .catch((err) => {
        console.warn('[CredLock Storage] Failed to persist breach record to IndexedDB:', err);
      });
  }
}

/**
 * Asynchronous version of addBreachRecord awaiting IndexedDB write and enforcing ownership.
 */
export async function addBreachRecordAsync(
  record: SanitizedBreachRecord,
  ownerId?: string | null
): Promise<void> {
  const resolvedOwner = resolveHistoryOwnerId(ownerId ?? record.ownerId);
  if (findCrossOwnerConflict(breachCache, record.id, resolvedOwner)) {
    throw new Error('Cannot overwrite a breach record owned by another user.');
  }

  if (isIndexedDBAvailable()) {
    const existing = await getByIdFromStore<SanitizedBreachRecord>(STORES.BREACH, record.id);
    if (existing && normalizeRecordOwnerId(existing) !== resolvedOwner) {
      throw new Error('Cannot overwrite a breach record owned by another user.');
    }
  }

  const ownedRecord = withOwner(record, resolvedOwner);
  breachCache = [
    ownedRecord,
    ...breachCache.filter((r) => r.id.toLowerCase() !== ownedRecord.id.toLowerCase()),
  ];
  notifyChange();

  if (isIndexedDBAvailable()) {
    await putInStore(STORES.BREACH, ownedRecord);
  }
}

/**
 * Deletes a single breach record by ID only if it belongs to the specified owner.
 * Returns true if deleted, false if not found or owned by another user.
 */
export async function deleteBreachRecordAsync(
  id: string,
  ownerId: string = GUEST_OWNER_ID
): Promise<boolean> {
  if (!id) return false;
  const resolvedOwner = resolveHistoryOwnerId(ownerId);

  const cached = breachCache.find((r) => r.id.toLowerCase() === id.toLowerCase());
  if (cached && normalizeRecordOwnerId(cached) !== resolvedOwner) {
    return false;
  }

  if (isIndexedDBAvailable()) {
    const stored = await getByIdFromStore<SanitizedBreachRecord>(STORES.BREACH, id);
    if (stored && normalizeRecordOwnerId(stored) !== resolvedOwner) {
      return false;
    }
    if (!cached && !stored) {
      return false;
    }
    await deleteFromStore(STORES.BREACH, id);
  } else if (!cached) {
    return false;
  }

  breachCache = breachCache.filter((r) => r.id.toLowerCase() !== id.toLowerCase());
  notifyChange();
  return true;
}

/* ==========================================================================
   Owner-Scoped & Full History Clear Operations
   ========================================================================== */

/**
 * Clears all analysis and breach history belonging ONLY to the specified owner,
 * preserving records owned by all other users and guest scopes.
 */
export async function clearOwnerHistoryAsync(
  ownerId: string = GUEST_OWNER_ID
): Promise<void> {
  const resolvedOwner = resolveHistoryOwnerId(ownerId);

  if (isIndexedDBAvailable()) {
    const [dbAnalysis, dbBreach] = await Promise.all([
      getAllFromStore<SanitizedAnalysisRecord>(STORES.ANALYSIS),
      getAllFromStore<SanitizedBreachRecord>(STORES.BREACH),
    ]);

    const analysisIdsToDelete = dbAnalysis
      .filter((r) => normalizeRecordOwnerId(r) === resolvedOwner)
      .map((r) => r.id);
    const breachIdsToDelete = dbBreach
      .filter((r) => normalizeRecordOwnerId(r) === resolvedOwner)
      .map((r) => r.id);

    await Promise.all([
      ...analysisIdsToDelete.map((id) => deleteFromStore(STORES.ANALYSIS, id)),
      ...breachIdsToDelete.map((id) => deleteFromStore(STORES.BREACH, id)),
    ]);
  }

  analysisCache = analysisCache.filter((r) => normalizeRecordOwnerId(r) !== resolvedOwner);
  breachCache = breachCache.filter((r) => normalizeRecordOwnerId(r) !== resolvedOwner);
  notifyChange();
}

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
