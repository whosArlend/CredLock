/**
 * IndexedDB Centralized Storage Module — CredLock (Phase 2.6)
 *
 * Implements persistent, client-side storage for sanitized CredLock history
 * using native browser IndexedDB.
 *
 * Architecture Principles:
 * 1. Single database: "credlock-db"
 * 2. Dedicated object stores: "analysis_history" and "breach_history"
 * 3. Strict schema versioning and transactional operations.
 * 4. Zero sensitive data (no passwords, hashes, prefixes, or suffixes).
 * 5. Robust fallback and error handling when IndexedDB is unavailable or restricted.
 */

export const DB_NAME = 'credlock-db';
export const DB_VERSION = 2;
export const LEGACY_DEFAULT_OWNER_ID = 'guest';

export const STORES = {
  ANALYSIS: 'analysis_history',
  BREACH: 'breach_history',
} as const;

export type StoreName = typeof STORES[keyof typeof STORES];

/**
 * Checks whether IndexedDB is available and functional in the current runtime.
 */
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined' && window.indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Opens or initializes the CredLock IndexedDB database.
 */
export function openCredLockDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB is not supported or accessible in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const openReq = event.target as IDBOpenDBRequest;
      const db = openReq.result;
      const upgradeTx = openReq.transaction;

      // Object Store 1: Analysis History
      let analysisStore: IDBObjectStore;
      if (!db.objectStoreNames.contains(STORES.ANALYSIS)) {
        analysisStore = db.createObjectStore(STORES.ANALYSIS, { keyPath: 'id' });
        analysisStore.createIndex('timestamp', 'timestamp', { unique: false });
        analysisStore.createIndex('score', 'score', { unique: false });
        analysisStore.createIndex('ownerId', 'ownerId', { unique: false });
      } else if (upgradeTx) {
        analysisStore = upgradeTx.objectStore(STORES.ANALYSIS);
        if (!analysisStore.indexNames.contains('ownerId')) {
          analysisStore.createIndex('ownerId', 'ownerId', { unique: false });
        }
        migrateLegacyStoreOwnership(analysisStore);
      }

      // Object Store 2: Breach History
      let breachStore: IDBObjectStore;
      if (!db.objectStoreNames.contains(STORES.BREACH)) {
        breachStore = db.createObjectStore(STORES.BREACH, { keyPath: 'id' });
        breachStore.createIndex('timestamp', 'timestamp', { unique: false });
        breachStore.createIndex('isBreached', 'isBreached', { unique: false });
        breachStore.createIndex('ownerId', 'ownerId', { unique: false });
      } else if (upgradeTx) {
        breachStore = upgradeTx.objectStore(STORES.BREACH);
        if (!breachStore.indexNames.contains('ownerId')) {
          breachStore.createIndex('ownerId', 'ownerId', { unique: false });
        }
        migrateLegacyStoreOwnership(breachStore);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open CredLock IndexedDB database.'));
    };

    request.onblocked = () => {
      // Handle blocked event (e.g. database open in another tab with older version)
      console.warn('[CredLock DB] Database upgrade blocked by another active connection.');
    };
  });
}

/**
 * Idempotently assigns legacy records (without ownerId) to the 'guest' scope
 * inside the atomic IndexedDB versionchange transaction without deleting any records.
 */
function migrateLegacyStoreOwnership(store: IDBObjectStore): void {
  if (typeof store.openCursor !== 'function') return;

  const cursorReq = store.openCursor();
  cursorReq.onsuccess = () => {
    const cursor = cursorReq.result;
    if (!cursor) return;

    const record = cursor.value as { ownerId?: unknown } | undefined;
    if (record && (typeof record.ownerId !== 'string' || record.ownerId.trim() === '')) {
      record.ownerId = LEGACY_DEFAULT_OWNER_ID;
      cursor.update(record);
    }
    cursor.continue();
  };
}

/**
 * Executes a transactional operation on an object store.
 */
async function withStore<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => Promise<T>
): Promise<T> {
  const db = await openCredLockDatabase();
  return new Promise<T>((resolve, reject) => {
    let completed = false;
    let opResult: T;

    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);

    transaction.oncomplete = () => {
      db.close();
      if (!completed) {
        completed = true;
        resolve(opResult);
      }
    };

    transaction.onerror = () => {
      db.close();
      if (!completed) {
        completed = true;
        reject(transaction.error || new Error(`IndexedDB transaction failed on ${storeName}.`));
      }
    };

    transaction.onabort = () => {
      db.close();
      if (!completed) {
        completed = true;
        reject(new Error(`IndexedDB transaction was aborted on ${storeName}.`));
      }
    };

    operation(store)
      .then((result) => {
        opResult = result;
      })
      .catch((err) => {
        try {
          transaction.abort();
        } catch {
          // ignore if transaction is already ending
        }
        db.close();
        if (!completed) {
          completed = true;
          reject(err);
        }
      });
  });
}

/**
 * Retrieves all records from an object store, sorted by timestamp descending (newest first).
 */
export async function getAllFromStore<T extends { timestamp: string }>(
  storeName: StoreName
): Promise<T[]> {
  if (!isIndexedDBAvailable()) {
    return [];
  }

  return withStore(storeName, 'readonly', (store) => {
    return new Promise<T[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const records = (request.result as T[]) || [];
        // Sort descending by timestamp (newest first)
        records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(records);
      };
      request.onerror = () => reject(request.error);
    });
  });
}

/**
 * Retrieves a single record by its unique ID.
 */
export async function getByIdFromStore<T>(
  storeName: StoreName,
  id: string
): Promise<T | undefined> {
  if (!isIndexedDBAvailable() || !id) {
    return undefined;
  }

  return withStore(storeName, 'readonly', (store) => {
    return new Promise<T | undefined>((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error);
    });
  });
}

/**
 * Inserts or replaces a record in the specified store.
 */
export async function putInStore<T extends { id: string }>(
  storeName: StoreName,
  record: T
): Promise<void> {
  if (!isIndexedDBAvailable()) {
    throw new Error('IndexedDB is not available. Cannot persist record.');
  }

  return withStore(storeName, 'readwrite', (store) => {
    return new Promise<void>((resolve, reject) => {
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

/**
 * Deletes a single record by its ID.
 */
export async function deleteFromStore(
  storeName: StoreName,
  id: string
): Promise<void> {
  if (!isIndexedDBAvailable() || !id) {
    return;
  }

  return withStore(storeName, 'readwrite', (store) => {
    return new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

/**
 * Clears all records from a specific object store.
 */
export async function clearStore(storeName: StoreName): Promise<void> {
  if (!isIndexedDBAvailable()) {
    return;
  }

  return withStore(storeName, 'readwrite', (store) => {
    return new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

/**
 * Completely wipes all CredLock object stores in the database.
 */
export async function clearAllCredLockData(): Promise<void> {
  if (!isIndexedDBAvailable()) {
    return;
  }

  await Promise.all([
    clearStore(STORES.ANALYSIS),
    clearStore(STORES.BREACH),
  ]);
}

/**
 * Deletes the entire IndexedDB database (useful for factory reset).
 */
export function deleteCredLockDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      resolve();
      return;
    }

    const request = window.indexedDB.deleteDatabase(DB_NAME);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to delete CredLock database.'));
    };

    request.onblocked = () => {
      console.warn('[CredLock DB] Database deletion blocked by an open connection.');
    };
  });
}
