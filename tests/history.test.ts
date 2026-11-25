import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  DB_NAME,
  DB_VERSION,
  STORES,
  isIndexedDBAvailable,
  openCredLockDatabase,
  getAllFromStore,
  getByIdFromStore,
  putInStore,
  deleteFromStore,
  clearAllCredLockData,
} from '../src/services/db.ts';
import {
  addAnalysisRecord,
  getAnalysisRecords,
  getAnalysisRecordById,
  deleteAnalysisRecordAsync,
  addBreachRecord,
  getBreachRecords,
  getBreachRecordById,
  deleteBreachRecordAsync,
  clearAllHistory,
  clearAllHistoryAsync,
  clearLocalUserDataAsync,
  CLEARABLE_LOCAL_STORAGE_KEYS,
  isProtectedAuthStorageKey,
} from '../src/services/historyStorage.ts';
import type { SanitizedAnalysisRecord, SanitizedBreachRecord } from '../src/types/index.ts';

/**
 * Phase 2.6 — History, Detail & IndexedDB Persistence Test Suite
 */

describe('Phase 2.6 — History, Detail & Data Persistence Test Suite', () => {
  // Test 1: Database Constants & Schema Configuration
  describe('1. Database Constants & Object Store Names', () => {
    it('uses the canonical credlock-db database name and version 1', () => {
      assert.strictEqual(DB_NAME, 'credlock-db');
      assert.strictEqual(DB_VERSION, 1);
    });

    it('defines distinct object stores for analysis and breach verification', () => {
      assert.strictEqual(STORES.ANALYSIS, 'analysis_history');
      assert.strictEqual(STORES.BREACH, 'breach_history');
    });
  });

  // Test 2: Sanitized In-Memory & Storage Repository Operations
  describe('2. Sanitized Repository Operations & Chronological Ordering', () => {
    beforeEach(() => {
      clearAllHistory();
    });

    afterEach(() => {
      clearAllHistory();
    });

    it('adds and retrieves sanitized analysis records with newest first ordering', () => {
      const olderRecord: SanitizedAnalysisRecord = {
        id: 'analysis-001',
        timestamp: '2026-11-18T10:00:00.000Z',
        passwordLength: 12,
        entropyBits: 45.5,
        score: 2,
        hasLowercase: true,
        hasUppercase: true,
        hasNumbers: true,
        hasSymbols: false,
        crackTimeDisplay: '2 hours',
      };

      const newerRecord: SanitizedAnalysisRecord = {
        id: 'analysis-002',
        timestamp: '2026-11-18T12:00:00.000Z',
        passwordLength: 18,
        entropyBits: 88.2,
        score: 4,
        hasLowercase: true,
        hasUppercase: true,
        hasNumbers: true,
        hasSymbols: true,
        crackTimeDisplay: 'centuries',
      };

      addAnalysisRecord(olderRecord);
      addAnalysisRecord(newerRecord);

      const records = getAnalysisRecords();
      assert.strictEqual(records.length, 2);
      // Newest first
      assert.strictEqual(records[0]!.id, 'analysis-002');
      assert.strictEqual(records[1]!.id, 'analysis-001');

      // Lookup by ID
      const fetched = getAnalysisRecordById('analysis-001');
      assert.ok(fetched);
      assert.strictEqual(fetched.entropyBits, 45.5);
    });

    it('adds and retrieves sanitized breach records', () => {
      const breachRecord: SanitizedBreachRecord = {
        id: 'breach-001',
        timestamp: '2026-11-18T14:00:00.000Z',
        isBreached: true,
        breachCount: 4218,
      };

      addBreachRecord(breachRecord);

      const records = getBreachRecords();
      assert.strictEqual(records.length, 1);
      assert.strictEqual(records[0]!.id, 'breach-001');
      assert.strictEqual(records[0]!.isBreached, true);
      assert.strictEqual(records[0]!.breachCount, 4218);

      const fetched = getBreachRecordById('breach-001');
      assert.ok(fetched);
      assert.strictEqual(fetched.breachCount, 4218);
    });

    it('supports deleting individual records without affecting others', async () => {
      const recordA: SanitizedAnalysisRecord = {
        id: 'del-analysis-A',
        timestamp: '2026-11-18T11:00:00.000Z',
        passwordLength: 10,
        entropyBits: 35,
        score: 1,
        hasLowercase: true,
        hasUppercase: false,
        hasNumbers: true,
        hasSymbols: false,
        crackTimeDisplay: '5 mins',
      };

      const recordB: SanitizedAnalysisRecord = {
        id: 'del-analysis-B',
        timestamp: '2026-11-18T11:05:00.000Z',
        passwordLength: 16,
        entropyBits: 75,
        score: 3,
        hasLowercase: true,
        hasUppercase: true,
        hasNumbers: true,
        hasSymbols: true,
        crackTimeDisplay: '2 months',
      };

      addAnalysisRecord(recordA);
      addAnalysisRecord(recordB);

      assert.strictEqual(getAnalysisRecords().length, 2);

      await deleteAnalysisRecordAsync('del-analysis-A');

      const remaining = getAnalysisRecords();
      assert.strictEqual(remaining.length, 1);
      assert.strictEqual(remaining[0]!.id, 'del-analysis-B');
      assert.strictEqual(getAnalysisRecordById('del-analysis-A'), undefined);

      // Same for breach records
      const breachRec: SanitizedBreachRecord = {
        id: 'del-breach-A',
        timestamp: '2026-11-18T11:10:00.000Z',
        isBreached: false,
        breachCount: 0,
      };
      addBreachRecord(breachRec);
      assert.strictEqual(getBreachRecords().length, 1);

      await deleteBreachRecordAsync('del-breach-A');
      assert.strictEqual(getBreachRecords().length, 0);
    });

    it('clears all history across analysis and breach stores', async () => {
      addAnalysisRecord({
        id: 'clear-analysis-1',
        timestamp: '2026-11-18T09:00:00.000Z',
        passwordLength: 14,
        entropyBits: 60,
        score: 3,
        hasLowercase: true,
        hasUppercase: true,
        hasNumbers: true,
        hasSymbols: true,
        crackTimeDisplay: '1 year',
      });

      addBreachRecord({
        id: 'clear-breach-1',
        timestamp: '2026-11-18T09:01:00.000Z',
        isBreached: false,
        breachCount: 0,
      });

      assert.strictEqual(getAnalysisRecords().length, 1);
      assert.strictEqual(getBreachRecords().length, 1);

      await clearAllHistoryAsync();

      assert.strictEqual(getAnalysisRecords().length, 0);
      assert.strictEqual(getBreachRecords().length, 0);
    });
  });

  // Test 3: Zero-Knowledge Sanitization Audit
  describe('3. Strict Zero-Knowledge Sanitization Audit', () => {
    it('strictly forbids plaintext passwords, hashes, prefixes, and suffixes from stored records', () => {
      const mockRecord: SanitizedAnalysisRecord = {
        id: 'security-audit-uuid',
        timestamp: new Date().toISOString(),
        passwordLength: 16,
        entropyBits: 80.5,
        score: 4,
        hasLowercase: true,
        hasUppercase: true,
        hasNumbers: true,
        hasSymbols: true,
        crackTimeDisplay: 'centuries',
      };

      addAnalysisRecord(mockRecord);
      const stored = getAnalysisRecordById('security-audit-uuid')!;

      assert.strictEqual('password' in stored, false, 'Plaintext password must NOT exist in analysis record');
      assert.strictEqual('hash' in stored, false, 'Hash must NOT exist in analysis record');
      assert.strictEqual('sha1' in stored, false, 'SHA-1 must NOT exist in analysis record');
      assert.strictEqual('prefix' in stored, false, 'Prefix must NOT exist in analysis record');
      assert.strictEqual('suffix' in stored, false, 'Suffix must NOT exist in analysis record');
    });
  });

  // Test 4: Mocked IndexedDB Operations & Transaction Lifecycle
  describe('4. Mocked IndexedDB Transaction Lifecycle', () => {
    let mockStores: Record<string, Map<string, unknown>> = {};

    beforeEach(() => {
      mockStores = {
        [STORES.ANALYSIS]: new Map(),
        [STORES.BREACH]: new Map(),
      };

      // Mock IndexedDB Factory in Node global
      const mockDB: unknown = {
        objectStoreNames: {
          contains: (name: string) => name in mockStores,
        },
        createObjectStore: (name: string) => {
          mockStores[name] = new Map();
          return {
            createIndex: () => {},
          };
        },
        transaction: (storeName: string, _mode: string) => {
          const targetMap = mockStores[storeName] || new Map();
          const tx = {
            objectStore: () => ({
              getAll: () => {
                const req: { result?: unknown[]; onsuccess?: () => void; onerror?: () => void } = {
                  result: Array.from(targetMap.values()),
                };
                setTimeout(() => {
                  req.onsuccess?.();
                  setTimeout(() => tx.oncomplete?.(), 0);
                }, 0);
                return req;
              },
              get: (key: string) => {
                const req: { result?: unknown; onsuccess?: () => void; onerror?: () => void } = {
                  result: targetMap.get(key),
                };
                setTimeout(() => {
                  req.onsuccess?.();
                  setTimeout(() => tx.oncomplete?.(), 0);
                }, 0);
                return req;
              },
              put: (item: { id: string }) => {
                targetMap.set(item.id, item);
                const req: { onsuccess?: () => void; onerror?: () => void } = {};
                setTimeout(() => {
                  req.onsuccess?.();
                  setTimeout(() => tx.oncomplete?.(), 0);
                }, 0);
                return req;
              },
              delete: (key: string) => {
                targetMap.delete(key);
                const req: { onsuccess?: () => void; onerror?: () => void } = {};
                setTimeout(() => {
                  req.onsuccess?.();
                  setTimeout(() => tx.oncomplete?.(), 0);
                }, 0);
                return req;
              },
              clear: () => {
                targetMap.clear();
                const req: { onsuccess?: () => void; onerror?: () => void } = {};
                setTimeout(() => {
                  req.onsuccess?.();
                  setTimeout(() => tx.oncomplete?.(), 0);
                }, 0);
                return req;
              },
            }),
            oncomplete: null as (() => void) | null,
            onerror: null as (() => void) | null,
            onabort: null as (() => void) | null,
          };
          return tx;
        },

        close: () => {},
      };

      // Assign to global window
      (globalThis as unknown as { window: { indexedDB: unknown } }).window = {
        indexedDB: {
          open: () => {
            const req: {
              result?: unknown;
              onsuccess?: () => void;
              onerror?: () => void;
              onupgradeneeded?: (ev: { target: { result: unknown } }) => void;
            } = {
              result: mockDB,
            };
            setTimeout(() => {
              req.onupgradeneeded?.({ target: { result: mockDB } });
              req.onsuccess?.();
            }, 0);
            return req;
          },
          deleteDatabase: () => {
            const req: { onsuccess?: () => void } = {};
            setTimeout(() => req.onsuccess?.(), 0);
            return req;
          },
        },
      };
    });

    afterEach(() => {
      delete (globalThis as unknown as { window?: unknown }).window;
    });

    it('confirms isIndexedDBAvailable returns true when window.indexedDB is defined', () => {
      assert.strictEqual(isIndexedDBAvailable(), true);
    });

    it('opens database and writes/reads items through IndexedDB transactions', async () => {
      const db = await openCredLockDatabase();
      assert.ok(db);

      const testRecord: SanitizedAnalysisRecord = {
        id: 'idb-test-record-1',
        timestamp: '2026-11-18T15:00:00.000Z',
        passwordLength: 20,
        entropyBits: 95.0,
        score: 4,
        hasLowercase: true,
        hasUppercase: true,
        hasNumbers: true,
        hasSymbols: true,
        crackTimeDisplay: 'millennia',
      };

      await putInStore(STORES.ANALYSIS, testRecord);

      const single = await getByIdFromStore<SanitizedAnalysisRecord>(STORES.ANALYSIS, 'idb-test-record-1');
      assert.ok(single);
      assert.strictEqual(single.id, 'idb-test-record-1');
      assert.strictEqual(single.entropyBits, 95.0);

      const all = await getAllFromStore<SanitizedAnalysisRecord>(STORES.ANALYSIS);
      assert.strictEqual(all.length, 1);
      assert.strictEqual(all[0]!.id, 'idb-test-record-1');

      await deleteFromStore(STORES.ANALYSIS, 'idb-test-record-1');
      const afterDel = await getAllFromStore<SanitizedAnalysisRecord>(STORES.ANALYSIS);
      assert.strictEqual(afterDel.length, 0);
    });

    it('clears all stores with clearAllCredLockData', async () => {
      await putInStore(STORES.ANALYSIS, {
        id: 'a1',
        timestamp: '2026-11-18T10:00:00.000Z',
        score: 3,
        passwordLength: 12,
        entropyBits: 50,
        hasLowercase: true,
        hasUppercase: true,
        hasNumbers: true,
        hasSymbols: false,
        crackTimeDisplay: '1 day',
      });

      await putInStore(STORES.BREACH, {
        id: 'b1',
        timestamp: '2026-11-18T10:01:00.000Z',
        isBreached: false,
        breachCount: 0,
      });

      const aBefore = await getAllFromStore(STORES.ANALYSIS);
      const bBefore = await getAllFromStore(STORES.BREACH);
      assert.strictEqual(aBefore.length, 1);
      assert.strictEqual(bBefore.length, 1);

      await clearAllCredLockData();

      const aAfter = await getAllFromStore(STORES.ANALYSIS);
      const bAfter = await getAllFromStore(STORES.BREACH);
      assert.strictEqual(aAfter.length, 0);
      assert.strictEqual(bAfter.length, 0);
    });
  });

  // Test 5: Phase 2 Local Data Safety — Auth Token Preservation
  describe('5. Local Data Cleanup Safety (Auth Token Preservation)', () => {
    it('identifies protected Supabase authentication storage keys accurately', () => {
      assert.strictEqual(isProtectedAuthStorageKey('credlock-auth-token'), true);
      assert.strictEqual(isProtectedAuthStorageKey('sb-xyz123-auth-token'), true);
      assert.strictEqual(isProtectedAuthStorageKey('credlock_analysis_history'), false);
      assert.strictEqual(isProtectedAuthStorageKey('breach_history'), false);
    });

    it('clears allowlisted history keys and IndexedDB while preserving Supabase auth tokens and unrelated keys', async () => {
      // Seed in-memory/history caches
      addAnalysisRecord({
        id: 'safety-a1',
        timestamp: new Date().toISOString(),
        passwordLength: 14,
        entropyBits: 72,
        score: 4,
        hasLowercase: true,
        hasUppercase: true,
        hasNumbers: true,
        hasSymbols: true,
        crackTimeDisplay: 'centuries',
      });
      addBreachRecord({
        id: 'safety-b1',
        timestamp: new Date().toISOString(),
        isBreached: false,
        breachCount: 0,
      });

      const store = new Map<string, string>([
        ['credlock-auth-token', '{"access_token":"secret-jwt","refresh_token":"secret-rt"}'],
        ['sb-abcdef-auth-token', '{"access_token":"legacy-sb-jwt"}'],
        ['credlock-ui-theme', 'dark'],
        ['other-app-key', 'keep-me'],
        ['credlock_analysis_history', '[]'],
        ['credlock_breach_history', '[]'],
        ['analysis_history', '[]'],
        ['breach_history', '[]'],
      ]);

      const mockStorage = {
        removeItem: (key: string) => {
          store.delete(key);
        },
      };

      await clearLocalUserDataAsync(mockStorage);

      // History caches must be cleared
      assert.strictEqual(getAnalysisRecords().length, 0);
      assert.strictEqual(getBreachRecords().length, 0);

      // Allowlisted history keys must be removed
      for (const allowedKey of CLEARABLE_LOCAL_STORAGE_KEYS) {
        assert.strictEqual(store.has(allowedKey), false, `Expected allowlisted key ${allowedKey} to be removed`);
      }

      // Auth tokens and unrelated keys MUST be preserved
      assert.strictEqual(
        store.get('credlock-auth-token'),
        '{"access_token":"secret-jwt","refresh_token":"secret-rt"}'
      );
      assert.strictEqual(
        store.get('sb-abcdef-auth-token'),
        '{"access_token":"legacy-sb-jwt"}'
      );
      assert.strictEqual(store.get('credlock-ui-theme'), 'dark');
      assert.strictEqual(store.get('other-app-key'), 'keep-me');
    });
  });
});
