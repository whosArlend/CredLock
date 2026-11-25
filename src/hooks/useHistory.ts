import { useState, useEffect, useCallback, useRef } from 'react';
import type { SanitizedAnalysisRecord, SanitizedBreachRecord } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import {
  getAnalysisRecordsAsync,
  getAnalysisRecordByIdAsync,
  deleteAnalysisRecordAsync,
  getBreachRecordsAsync,
  getBreachRecordByIdAsync,
  deleteBreachRecordAsync,
  clearAllHistoryAsync,
  clearOwnerHistoryAsync,
  resolveHistoryOwnerId,
  HISTORY_CHANGE_EVENT,
} from '@/services/historyStorage';

/**
 * Hook to read and manage Analysis History reactively with IndexedDB,
 * strictly isolated by the current authenticated user UUID or 'guest' scope.
 */
export function useAnalysisHistory() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const ownerId = resolveHistoryOwnerId(user?.id);

  const [records, setRecords] = useState<SanitizedAnalysisRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Request epoch counter and current owner tracking ref
  const requestEpochRef = useRef<number>(0);
  const currentOwnerRef = useRef<string>(ownerId);

  // Eager transition safety: whenever ownerId changes, immediately wipe records and enter loading state.
  useEffect(() => {
    if (currentOwnerRef.current !== ownerId) {
      currentOwnerRef.current = ownerId;
      requestEpochRef.current += 1;
      setRecords([]);
      setIsLoading(true);
      setError(null);
    }
  }, [ownerId]);

  const fetchRecords = useCallback(async () => {
    // If auth state is still resolving, hold loading state and do NOT fetch guest records yet
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }

    const currentEpoch = ++requestEpochRef.current;
    const targetOwner = ownerId;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getAnalysisRecordsAsync(targetOwner);

      // Guard against stale async fetches from previous owners or superseded requests
      if (currentEpoch === requestEpochRef.current) {
        setRecords(data);
      }
    } catch (err) {
      if (currentEpoch === requestEpochRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load analysis history from storage.');
      }
    } finally {
      if (currentEpoch === requestEpochRef.current) {
        setIsLoading(false);
      }
    }
  }, [ownerId, isAuthLoading]);

  useEffect(() => {
    fetchRecords();

    const handleHistoryChange = () => {
      fetchRecords();
    };

    window.addEventListener(HISTORY_CHANGE_EVENT, handleHistoryChange);
    return () => {
      window.removeEventListener(HISTORY_CHANGE_EVENT, handleHistoryChange);
    };
  }, [fetchRecords]);

  const deleteRecord = useCallback(async (id: string) => {
    if (isAuthLoading) return;
    try {
      const deleted = await deleteAnalysisRecordAsync(id, ownerId);
      if (deleted) {
        setRecords((prev) => prev.filter((r) => r.id.toLowerCase() !== id.toLowerCase()));
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete record.');
    }
  }, [ownerId, isAuthLoading]);

  return {
    records,
    isLoading,
    error,
    refresh: fetchRecords,
    deleteRecord,
  };
}

/**
 * Hook to read a single Analysis Record by ID, strictly scoped to the current owner.
 */
export function useAnalysisDetail(id: string | undefined) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const ownerId = resolveHistoryOwnerId(user?.id);

  const [record, setRecord] = useState<SanitizedAnalysisRecord | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const requestEpochRef = useRef<number>(0);
  const currentOwnerRef = useRef<string>(ownerId);
  const currentIdRef = useRef<string | undefined>(id);

  // Eager transition safety: whenever ownerId or id changes, immediately wipe record
  useEffect(() => {
    if (currentOwnerRef.current !== ownerId || currentIdRef.current !== id) {
      currentOwnerRef.current = ownerId;
      currentIdRef.current = id;
      requestEpochRef.current += 1;
      setRecord(undefined);
      setIsLoading(true);
      setError(null);
    }
  }, [ownerId, id]);

  const fetchRecord = useCallback(async () => {
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }

    if (!id) {
      setRecord(undefined);
      setIsLoading(false);
      return;
    }

    const currentEpoch = ++requestEpochRef.current;
    const targetOwner = ownerId;
    const targetId = id;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getAnalysisRecordByIdAsync(targetId, targetOwner);

      if (currentEpoch === requestEpochRef.current) {
        setRecord(data);
      }
    } catch (err) {
      if (currentEpoch === requestEpochRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load analysis detail.');
      }
    } finally {
      if (currentEpoch === requestEpochRef.current) {
        setIsLoading(false);
      }
    }
  }, [id, ownerId, isAuthLoading]);

  useEffect(() => {
    fetchRecord();

    const handleHistoryChange = () => {
      fetchRecord();
    };

    window.addEventListener(HISTORY_CHANGE_EVENT, handleHistoryChange);
    return () => {
      window.removeEventListener(HISTORY_CHANGE_EVENT, handleHistoryChange);
    };
  }, [fetchRecord]);

  const deleteRecord = useCallback(async () => {
    if (!id || isAuthLoading) return;
    const deleted = await deleteAnalysisRecordAsync(id, ownerId);
    if (deleted) {
      setRecord(undefined);
    }
  }, [id, ownerId, isAuthLoading]);

  return {
    record,
    isLoading,
    error,
    refresh: fetchRecord,
    deleteRecord,
  };
}

/**
 * Hook to read and manage Breach History reactively with IndexedDB,
 * strictly isolated by the current authenticated user UUID or 'guest' scope.
 */
export function useBreachHistory() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const ownerId = resolveHistoryOwnerId(user?.id);

  const [records, setRecords] = useState<SanitizedBreachRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const requestEpochRef = useRef<number>(0);
  const currentOwnerRef = useRef<string>(ownerId);

  // Eager transition safety: whenever ownerId changes, immediately wipe records and enter loading state.
  useEffect(() => {
    if (currentOwnerRef.current !== ownerId) {
      currentOwnerRef.current = ownerId;
      requestEpochRef.current += 1;
      setRecords([]);
      setIsLoading(true);
      setError(null);
    }
  }, [ownerId]);

  const fetchRecords = useCallback(async () => {
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }

    const currentEpoch = ++requestEpochRef.current;
    const targetOwner = ownerId;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getBreachRecordsAsync(targetOwner);

      if (currentEpoch === requestEpochRef.current) {
        setRecords(data);
      }
    } catch (err) {
      if (currentEpoch === requestEpochRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load breach check history.');
      }
    } finally {
      if (currentEpoch === requestEpochRef.current) {
        setIsLoading(false);
      }
    }
  }, [ownerId, isAuthLoading]);

  useEffect(() => {
    fetchRecords();

    const handleHistoryChange = () => {
      fetchRecords();
    };

    window.addEventListener(HISTORY_CHANGE_EVENT, handleHistoryChange);
    return () => {
      window.removeEventListener(HISTORY_CHANGE_EVENT, handleHistoryChange);
    };
  }, [fetchRecords]);

  const deleteRecord = useCallback(async (id: string) => {
    if (isAuthLoading) return;
    try {
      const deleted = await deleteBreachRecordAsync(id, ownerId);
      if (deleted) {
        setRecords((prev) => prev.filter((r) => r.id.toLowerCase() !== id.toLowerCase()));
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete record.');
    }
  }, [ownerId, isAuthLoading]);

  return {
    records,
    isLoading,
    error,
    refresh: fetchRecords,
    deleteRecord,
  };
}

/**
 * Hook to read a single Breach Record by ID, strictly scoped to the current owner.
 */
export function useBreachDetail(id: string | undefined) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const ownerId = resolveHistoryOwnerId(user?.id);

  const [record, setRecord] = useState<SanitizedBreachRecord | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const requestEpochRef = useRef<number>(0);
  const currentOwnerRef = useRef<string>(ownerId);
  const currentIdRef = useRef<string | undefined>(id);

  // Eager transition safety: whenever ownerId or id changes, immediately wipe record
  useEffect(() => {
    if (currentOwnerRef.current !== ownerId || currentIdRef.current !== id) {
      currentOwnerRef.current = ownerId;
      currentIdRef.current = id;
      requestEpochRef.current += 1;
      setRecord(undefined);
      setIsLoading(true);
      setError(null);
    }
  }, [ownerId, id]);

  const fetchRecord = useCallback(async () => {
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }

    if (!id) {
      setRecord(undefined);
      setIsLoading(false);
      return;
    }

    const currentEpoch = ++requestEpochRef.current;
    const targetOwner = ownerId;
    const targetId = id;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getBreachRecordByIdAsync(targetId, targetOwner);

      if (currentEpoch === requestEpochRef.current) {
        setRecord(data);
      }
    } catch (err) {
      if (currentEpoch === requestEpochRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load breach record detail.');
      }
    } finally {
      if (currentEpoch === requestEpochRef.current) {
        setIsLoading(false);
      }
    }
  }, [id, ownerId, isAuthLoading]);

  useEffect(() => {
    fetchRecord();

    const handleHistoryChange = () => {
      fetchRecord();
    };

    window.addEventListener(HISTORY_CHANGE_EVENT, handleHistoryChange);
    return () => {
      window.removeEventListener(HISTORY_CHANGE_EVENT, handleHistoryChange);
    };
  }, [fetchRecord]);

  const deleteRecord = useCallback(async () => {
    if (!id || isAuthLoading) return;
    const deleted = await deleteBreachRecordAsync(id, ownerId);
    if (deleted) {
      setRecord(undefined);
    }
  }, [id, ownerId, isAuthLoading]);

  return {
    record,
    isLoading,
    error,
    refresh: fetchRecord,
    deleteRecord,
  };
}

/**
 * Helper to clear history across stores (owner-scoped when ownerId is provided).
 */
export async function clearAllLocalData(ownerId?: string): Promise<void> {
  if (ownerId) {
    await clearOwnerHistoryAsync(ownerId);
  } else {
    await clearAllHistoryAsync();
  }
}
