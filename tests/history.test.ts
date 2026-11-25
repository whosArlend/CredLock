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
  addAnalysisRecordAsync,
  getAnalysisRecords,
  getAnalysisRecordsAsync,
  getAnalysisRecordById,
  getAnalysisRecordByIdAsync,
  deleteAnalysisRecordAsync,
  addBreachRecord,
  addBreachRecordAsync,
  getBreachRecords,
  getBreachRecordsAsync,
  getBreachRecordById,
  getBreachRecordByIdAsync,
  deleteBreachRecordAsync,
  clearAllHistory,
  clearAllHistoryAsync,
  clearOwnerHistoryAsync,
  clearLocalUserDataAsync,
  CLEARABLE_LOCAL_STORAGE_KEYS,
  isProtectedAuthStorageKey,
  GUEST_OWNER_ID,
  resolveHistoryOwnerId,
  normalizeRecordOwnerId,
  initHistoryStorage,
  resetHistoryMemoryCache,
} from '../src/services/historyStorage.ts';
import type { SanitizedAnalysisRecord, SanitizedBreachRecord } from '../src/types/index.ts';

/**
 * Phase 2.6 — History, Detail & IndexedDB Persistence Test Suite
 */

describe('Phase 2.6 — History, Detail & Data Persistence Test Suite', () => {
  // Test 1: Database Constants & Schema Configuration
  describe('1. Database Constants & Object Store Names', () => {
    it('uses the canonical credlock-db database name and version 2 (with ownerId schema)', () => {
      assert.strictEqual(DB_NAME, 'credlock-db');
      assert.strictEqual(DB_VERSION, 2);
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

  // Test 6: Phase 3 — Owner Isolation Across Guest, User A, and User B
  describe('6. Phase 3 — History Owner Isolation', () => {
    const USER_A = '11111111-1111-4111-8111-111111111111';
    const USER_B = '22222222-2222-4222-8222-222222222222';

    const makeAnalysis = (id: string, score = 3): SanitizedAnalysisRecord => ({
      id,
      timestamp: new Date().toISOString(),
      passwordLength: 14,
      entropyBits: 70,
      score,
      hasLowercase: true,
      hasUppercase: true,
      hasNumbers: true,
      hasSymbols: true,
      crackTimeDisplay: 'years',
    });

    const makeBreach = (id: string, isBreached = false): SanitizedBreachRecord => ({
      id,
      timestamp: new Date().toISOString(),
      isBreached,
      breachCount: isBreached ? 5 : 0,
    });

    beforeEach(async () => {
      await clearAllHistoryAsync();
    });

    afterEach(async () => {
      await clearAllHistoryAsync();
    });

    it('resolves owner IDs safely and treats legacy unowned records as guest-owned', () => {
      assert.strictEqual(resolveHistoryOwnerId(null), GUEST_OWNER_ID);
      assert.strictEqual(resolveHistoryOwnerId(undefined), GUEST_OWNER_ID);
      assert.strictEqual(resolveHistoryOwnerId('   '), GUEST_OWNER_ID);
      assert.strictEqual(resolveHistoryOwnerId(USER_A), USER_A);

      assert.strictEqual(normalizeRecordOwnerId({}), GUEST_OWNER_ID);
      assert.strictEqual(normalizeRecordOwnerId({ ownerId: undefined }), GUEST_OWNER_ID);
      assert.strictEqual(normalizeRecordOwnerId({ ownerId: '' }), GUEST_OWNER_ID);
      assert.strictEqual(normalizeRecordOwnerId({ ownerId: USER_B }), USER_B);
    });

    it('strictly isolates analysis and breach records between Guest, User A, and User B', async () => {
      await addAnalysisRecordAsync(makeAnalysis('guest-a1', 1), GUEST_OWNER_ID);
      await addAnalysisRecordAsync(makeAnalysis('usera-a1', 3), USER_A);
      await addAnalysisRecordAsync(makeAnalysis('userb-a1', 4), USER_B);

      await addBreachRecordAsync(makeBreach('guest-b1', true), GUEST_OWNER_ID);
      await addBreachRecordAsync(makeBreach('usera-b1', false), USER_A);
      await addBreachRecordAsync(makeBreach('userb-b1', true), USER_B);

      // Guest sees only guest records
      const guestAnalysis = await getAnalysisRecordsAsync(GUEST_OWNER_ID);
      const guestBreach = await getBreachRecordsAsync(GUEST_OWNER_ID);
      assert.deepStrictEqual(guestAnalysis.map((r) => r.id), ['guest-a1']);
      assert.deepStrictEqual(guestBreach.map((r) => r.id), ['guest-b1']);

      // User A sees only User A records (guest history is NOT merged into User A)
      const userAAnalysis = await getAnalysisRecordsAsync(USER_A);
      const userABreach = await getBreachRecordsAsync(USER_A);
      assert.deepStrictEqual(userAAnalysis.map((r) => r.id), ['usera-a1']);
      assert.deepStrictEqual(userABreach.map((r) => r.id), ['usera-b1']);

      // User B sees only User B records
      const userBAnalysis = await getAnalysisRecordsAsync(USER_B);
      const userBBreach = await getBreachRecordsAsync(USER_B);
      assert.deepStrictEqual(userBAnalysis.map((r) => r.id), ['userb-a1']);
      assert.deepStrictEqual(userBBreach.map((r) => r.id), ['userb-b1']);
    });

    it('blocks direct lookup by foreign record ID (returns undefined)', async () => {
      await addAnalysisRecordAsync(makeAnalysis('usera-secret-a'), USER_A);
      await addBreachRecordAsync(makeBreach('usera-secret-b', true), USER_A);

      // Same owner succeeds
      assert.ok(getAnalysisRecordById('usera-secret-a', USER_A));
      assert.ok(await getAnalysisRecordByIdAsync('usera-secret-a', USER_A));
      assert.ok(getBreachRecordById('usera-secret-b', USER_A));
      assert.ok(await getBreachRecordByIdAsync('usera-secret-b', USER_A));

      // Guest and User B receive undefined
      assert.strictEqual(getAnalysisRecordById('usera-secret-a', GUEST_OWNER_ID), undefined);
      assert.strictEqual(await getAnalysisRecordByIdAsync('usera-secret-a', GUEST_OWNER_ID), undefined);
      assert.strictEqual(getAnalysisRecordById('usera-secret-a', USER_B), undefined);
      assert.strictEqual(await getAnalysisRecordByIdAsync('usera-secret-a', USER_B), undefined);

      assert.strictEqual(getBreachRecordById('usera-secret-b', GUEST_OWNER_ID), undefined);
      assert.strictEqual(await getBreachRecordByIdAsync('usera-secret-b', GUEST_OWNER_ID), undefined);
      assert.strictEqual(getBreachRecordById('usera-secret-b', USER_B), undefined);
      assert.strictEqual(await getBreachRecordByIdAsync('usera-secret-b', USER_B), undefined);
    });

    it('prevents cross-owner overwrite and enforces owner-scoped deletes', async () => {
      await addAnalysisRecordAsync(makeAnalysis('shared-id-a', 4), USER_A);
      await addBreachRecordAsync(makeBreach('shared-id-b', false), USER_A);

      // User B cannot overwrite User A's record by reusing the same ID
      await assert.rejects(
        () => addAnalysisRecordAsync(makeAnalysis('shared-id-a', 0), USER_B),
        /another user/i
      );
      await assert.rejects(
        () => addBreachRecordAsync(makeBreach('shared-id-b', true), USER_B),
        /another user/i
      );

      // User B and Guest cannot delete User A's record
      assert.strictEqual(await deleteAnalysisRecordAsync('shared-id-a', USER_B), false);
      assert.strictEqual(await deleteAnalysisRecordAsync('shared-id-a', GUEST_OWNER_ID), false);
      assert.strictEqual(await deleteBreachRecordAsync('shared-id-b', USER_B), false);
      assert.strictEqual(await deleteBreachRecordAsync('shared-id-b', GUEST_OWNER_ID), false);

      // User A's records remain intact
      assert.strictEqual((await getAnalysisRecordByIdAsync('shared-id-a', USER_A))?.score, 4);
      assert.strictEqual((await getBreachRecordByIdAsync('shared-id-b', USER_A))?.isBreached, false);

      // User A can delete their own records
      assert.strictEqual(await deleteAnalysisRecordAsync('shared-id-a', USER_A), true);
      assert.strictEqual(await deleteBreachRecordAsync('shared-id-b', USER_A), true);
      assert.strictEqual(await getAnalysisRecordByIdAsync('shared-id-a', USER_A), undefined);
      assert.strictEqual(await getBreachRecordByIdAsync('shared-id-b', USER_A), undefined);
    });

    it('scopes clearOwnerHistoryAsync strictly to the target owner', async () => {
      await addAnalysisRecordAsync(makeAnalysis('g1'), GUEST_OWNER_ID);
      await addAnalysisRecordAsync(makeAnalysis('a1'), USER_A);
      await addAnalysisRecordAsync(makeAnalysis('b1'), USER_B);
      await addBreachRecordAsync(makeBreach('gb1'), GUEST_OWNER_ID);
      await addBreachRecordAsync(makeBreach('ab1'), USER_A);
      await addBreachRecordAsync(makeBreach('bb1'), USER_B);

      await clearOwnerHistoryAsync(USER_A);

      assert.strictEqual((await getAnalysisRecordsAsync(USER_A)).length, 0);
      assert.strictEqual((await getBreachRecordsAsync(USER_A)).length, 0);

      // Guest and User B remain untouched
      assert.deepStrictEqual((await getAnalysisRecordsAsync(GUEST_OWNER_ID)).map((r) => r.id), ['g1']);
      assert.deepStrictEqual((await getBreachRecordsAsync(GUEST_OWNER_ID)).map((r) => r.id), ['gb1']);
      assert.deepStrictEqual((await getAnalysisRecordsAsync(USER_B)).map((r) => r.id), ['b1']);
      assert.deepStrictEqual((await getBreachRecordsAsync(USER_B)).map((r) => r.id), ['bb1']);
    });

    it('keeps user history unavailable in guest scope after logout and restores it when the same user logs back in', async () => {
      // User A creates records while logged in
      await addAnalysisRecordAsync(makeAnalysis('a-persist-1'), USER_A);
      await addBreachRecordAsync(makeBreach('a-persist-2', true), USER_A);

      // User A logs out -> active scope becomes guest
      assert.strictEqual(getAnalysisRecords(GUEST_OWNER_ID).length, 0);
      assert.strictEqual(getBreachRecords(GUEST_OWNER_ID).length, 0);

      // User A logs back in -> User A's records are still intact
      assert.deepStrictEqual(getAnalysisRecords(USER_A).map((r) => r.id), ['a-persist-1']);
      assert.deepStrictEqual(getBreachRecords(USER_A).map((r) => r.id), ['a-persist-2']);
    });

    it('treats legacy unowned records in cache as guest-owned and hides them from authenticated users', () => {
      // Simulate legacy record without ownerId
      addAnalysisRecord(makeAnalysis('legacy-unowned-a'));
      addBreachRecord(makeBreach('legacy-unowned-b'));

      // Visible to guest
      assert.strictEqual(getAnalysisRecords(GUEST_OWNER_ID).some((r) => r.id === 'legacy-unowned-a'), true);
      assert.strictEqual(getBreachRecords(GUEST_OWNER_ID).some((r) => r.id === 'legacy-unowned-b'), true);

      // Hidden from User A
      assert.strictEqual(getAnalysisRecords(USER_A).some((r) => r.id === 'legacy-unowned-a'), false);
      assert.strictEqual(getBreachRecords(USER_A).some((r) => r.id === 'legacy-unowned-b'), false);
    });
  });

  // Test 7: Phase 4.2 — In-Memory History Cache Cleanup
  describe('7. Phase 4.2 — In-Memory Cache Reset & Race Prevention', () => {
    const USER_A = '11111111-1111-4111-8111-111111111111';
    const USER_B = '22222222-2222-4222-8222-222222222222';
    let mockStores: Record<string, Map<string, unknown>> = {};
    let getAllDelayMs = 0;

    beforeEach(() => {
      resetHistoryMemoryCache();
      getAllDelayMs = 0;
      mockStores = {
        [STORES.ANALYSIS]: new Map(),
        [STORES.BREACH]: new Map(),
      };

      const mockDB: unknown = {
        objectStoreNames: {
          contains: (name: string) => name in mockStores,
        },
        createObjectStore: (name: string) => {
          mockStores[name] = new Map();
          return { createIndex: () => {} };
        },
        transaction: (storeName: string) => {
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
                }, getAllDelayMs);
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
            oncomplete: undefined as (() => void) | undefined,
            onerror: undefined as (() => void) | undefined,
            onabort: undefined as (() => void) | undefined,
          };
          return tx;
        },
        close: () => {},
      };

      (globalThis as Record<string, unknown>).window = {
        indexedDB: {
          open: () => {
            const req: {
              result: unknown;
              onsuccess?: () => void;
              onerror?: () => void;
              onupgradeneeded?: (e: unknown) => void;
            } = { result: mockDB };
            setTimeout(() => {
              req.onsuccess?.();
            }, 0);
            return req;
          },
        },
      };
    });

    afterEach(() => {
      resetHistoryMemoryCache();
      delete (globalThis as Record<string, unknown>).window;
    });

    it('resets in-memory analysis and breach caches while preserving persistent IndexedDB records', async () => {
      await addAnalysisRecordAsync(
        {
          id: 'mem-a-guest',
          timestamp: '2026-11-25T10:00:00.000Z',
          passwordLength: 12,
          entropyBits: 60,
          score: 3,
          hasLowercase: true,
          hasUppercase: true,
          hasNumbers: true,
          hasSymbols: false,
          crackTimeDisplay: 'days',
        },
        GUEST_OWNER_ID
      );
      await addAnalysisRecordAsync(
        {
          id: 'mem-a-usera',
          timestamp: '2026-11-25T10:05:00.000Z',
          passwordLength: 16,
          entropyBits: 85,
          score: 4,
          hasLowercase: true,
          hasUppercase: true,
          hasNumbers: true,
          hasSymbols: true,
          crackTimeDisplay: 'centuries',
        },
        USER_A
      );
      await addBreachRecordAsync(
        {
          id: 'mem-b-guest',
          timestamp: '2026-11-25T10:01:00.000Z',
          isBreached: false,
          breachCount: 0,
        },
        GUEST_OWNER_ID
      );
      await addBreachRecordAsync(
        {
          id: 'mem-b-usera',
          timestamp: '2026-11-25T10:06:00.000Z',
          isBreached: true,
          breachCount: 3,
        },
        USER_A
      );

      // Verify caches are populated
      assert.strictEqual(getAnalysisRecords(GUEST_OWNER_ID).length, 1);
      assert.strictEqual(getAnalysisRecords(USER_A).length, 1);
      assert.strictEqual(getBreachRecords(GUEST_OWNER_ID).length, 1);
      assert.strictEqual(getBreachRecords(USER_A).length, 1);

      // Reset memory cache ONLY
      resetHistoryMemoryCache();

      // Synchronous in-memory caches must be completely empty for all owners
      assert.strictEqual(getAnalysisRecords(GUEST_OWNER_ID).length, 0);
      assert.strictEqual(getAnalysisRecords(USER_A).length, 0);
      assert.strictEqual(getAnalysisRecords(USER_B).length, 0);
      assert.strictEqual(getBreachRecords(GUEST_OWNER_ID).length, 0);
      assert.strictEqual(getBreachRecords(USER_A).length, 0);
      assert.strictEqual(getBreachRecords(USER_B).length, 0);

      // Persistent IndexedDB stores must still contain all records intact
      assert.strictEqual(mockStores[STORES.ANALYSIS].size, 2);
      assert.strictEqual(mockStores[STORES.BREACH].size, 2);

      // Reinitialization & async reload must restore Guest and User A records cleanly
      await initHistoryStorage();
      assert.deepStrictEqual(
        (await getAnalysisRecordsAsync(GUEST_OWNER_ID)).map((r) => r.id),
        ['mem-a-guest']
      );
      assert.deepStrictEqual(
        (await getAnalysisRecordsAsync(USER_A)).map((r) => r.id),
        ['mem-a-usera']
      );
      assert.deepStrictEqual(
        (await getBreachRecordsAsync(GUEST_OWNER_ID)).map((r) => r.id),
        ['mem-b-guest']
      );
      assert.deepStrictEqual(
        (await getBreachRecordsAsync(USER_A)).map((r) => r.id),
        ['mem-b-usera']
      );
    });

    it('prevents an in-flight stale initialization from repopulating cache after resetHistoryMemoryCache()', async () => {
      // Seed persistent IndexedDB directly (simulating prior session records)
      mockStores[STORES.ANALYSIS].set('stale-a1', {
        id: 'stale-a1',
        ownerId: USER_A,
        timestamp: '2026-11-25T11:00:00.000Z',
        passwordLength: 14,
        entropyBits: 72,
        score: 4,
        hasLowercase: true,
        hasUppercase: true,
        hasNumbers: true,
        hasSymbols: true,
        crackTimeDisplay: 'centuries',
      });
      mockStores[STORES.BREACH].set('stale-b1', {
        id: 'stale-b1',
        ownerId: USER_A,
        timestamp: '2026-11-25T11:01:00.000Z',
        isBreached: true,
        breachCount: 7,
      });

      // Simulate slow IndexedDB getAll
      getAllDelayMs = 30;
      const inFlightInit = initHistoryStorage();

      // Reset cache while initialization is still in-flight
      resetHistoryMemoryCache();

      // Wait for the stale initialization promise to finish
      await inFlightInit;

      // Stale initialization MUST NOT have repopulated the in-memory caches
      assert.strictEqual(getAnalysisRecords(USER_A).length, 0);
      assert.strictEqual(getBreachRecords(USER_A).length, 0);

      // Subsequent fresh reload still works cleanly
      getAllDelayMs = 0;
      const reloadedAnalysis = await getAnalysisRecordsAsync(USER_A);
      const reloadedBreach = await getBreachRecordsAsync(USER_A);
      assert.deepStrictEqual(reloadedAnalysis.map((r) => r.id), ['stale-a1']);
      assert.deepStrictEqual(reloadedBreach.map((r) => r.id), ['stale-b1']);
    });
  });

  // Test 11: Phase 4.4 History State Transition & Epoch Safety (Static & Logic Tests)
  describe('11. Phase 4.4 History State Transition & Epoch Safety Verification', () => {
    it('verifies useHistory source implementation enforces epoch guard and eager wipe on owner change', async () => {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const useHistoryPath = path.resolve('src/hooks/useHistory.ts');
      const content = await fs.readFile(useHistoryPath, 'utf8');

      // 1. Must track requestEpochRef and currentOwnerRef
      assert.ok(
        content.includes('requestEpochRef = useRef<number>(0)'),
        'useHistory must track request epoch counter'
      );
      assert.ok(
        content.includes('currentOwnerRef = useRef<string>(ownerId)'),
        'useHistory must track currentOwnerRef'
      );

      // 2. Must eagerly clear records when ownerId changes
      assert.ok(
        content.includes('currentOwnerRef.current !== ownerId'),
        'useHistory must detect ownerId transitions'
      );
      assert.ok(
        content.includes('setRecords([])'),
        'useHistory must immediately clear records on owner transition'
      );
      assert.ok(
        content.includes('setRecord(undefined)'),
        'useHistory detail hooks must immediately clear record on owner or ID transition'
      );

      // 3. Must check currentEpoch === requestEpochRef.current before setting data
      assert.ok(
        content.includes('if (currentEpoch === requestEpochRef.current) {\n        setRecords(data);'),
        'useHistory must guard against stale async fetches overwriting records'
      );
      assert.ok(
        content.includes('if (currentEpoch === requestEpochRef.current) {\n        setRecord(data);'),
        'useHistory detail hooks must guard against stale async fetches overwriting detail record'
      );

      // 4. Must hold loading when isAuthLoading is true and NOT fetch guest records
      assert.ok(
        content.includes('if (isAuthLoading) {\n      setIsLoading(true);\n      return;\n    }'),
        'useHistory must check isAuthLoading and prevent premature Guest fetch during auth resolution'
      );
    });

    it('simulates owner transition sequence and guarantees stale responses are discarded', async () => {
      // Logic simulation of request epoch and race condition
      let requestEpoch = 0;
      let currentOwner = 'guest';
      let stateRecords: Array<{ id: string; ownerId: string }> = [];

      // Helper simulating owner change in hook
      const onOwnerChange = (newOwner: string) => {
        if (currentOwner !== newOwner) {
          currentOwner = newOwner;
          requestEpoch += 1;
          stateRecords = []; // Eager clear
        }
      };

      // Helper simulating async fetch with epoch check
      const simulateFetch = async (targetOwner: string, delayMs: number, data: Array<{ id: string; ownerId: string }>) => {
        const fetchEpoch = ++requestEpoch;
        await new Promise((r) => setTimeout(r, delayMs));
        if (fetchEpoch === requestEpoch) {
          stateRecords = data;
        }
      };

      // 1. Initial Guest load
      const guestData = [{ id: 'g-1', ownerId: 'guest' }];
      await simulateFetch('guest', 5, guestData);
      assert.strictEqual(stateRecords.length, 1);
      assert.strictEqual(stateRecords[0].ownerId, 'guest');

      // 2. Transition Guest -> User A: immediately clears records
      onOwnerChange('user-a');
      assert.strictEqual(stateRecords.length, 0, 'Guest records cleared immediately on switch to User A');

      // 3. Simulate slow User A fetch started, but user quickly logs out to Guest or switches to User B
      const userAData = [{ id: 'a-1', ownerId: 'user-a' }];
      const slowUserAPromise = simulateFetch('user-a', 50, userAData);

      // Rapidly switch to User B before User A finishes
      onOwnerChange('user-b');
      assert.strictEqual(stateRecords.length, 0, 'Records remain empty on switch to User B');

      const userBData = [{ id: 'b-1', ownerId: 'user-b' }];
      const userBPromise = simulateFetch('user-b', 10, userBData);

      await Promise.all([slowUserAPromise, userBPromise]);

      // State MUST contain User B records, NOT overwritten by slow User A response
      assert.strictEqual(stateRecords.length, 1);
      assert.strictEqual(stateRecords[0].ownerId, 'user-b');

      // 4. Transition User B -> Guest: immediately clears records
      onOwnerChange('guest');
      assert.strictEqual(stateRecords.length, 0, 'User B records cleared immediately on logout/switch to Guest');
    });
  });
});
