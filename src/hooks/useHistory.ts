import { useState, useEffect, useCallback } from 'react';
import type { SanitizedAnalysisRecord, SanitizedBreachRecord } from '@/types';
import {
  getAnalysisRecordsAsync,
  getAnalysisRecordByIdAsync,
  deleteAnalysisRecordAsync,
  getBreachRecordsAsync,
  getBreachRecordByIdAsync,
  deleteBreachRecordAsync,
  clearAllHistoryAsync,
  HISTORY_CHANGE_EVENT,
} from '@/services/historyStorage';

/**
 * Hook to read and manage Analysis History reactively with IndexedDB.
 */
export function useAnalysisHistory() {
  const [records, setRecords] = useState<SanitizedAnalysisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAnalysisRecordsAsync();
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis history from storage.');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    try {
      await deleteAnalysisRecordAsync(id);
      setRecords((prev) => prev.filter((r) => r.id.toLowerCase() !== id.toLowerCase()));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete record.');
    }
  }, []);

  return {
    records,
    isLoading,
    error,
    refresh: fetchRecords,
    deleteRecord,
  };
}

/**
 * Hook to read a single Analysis Record by ID with loading/error states.
 */
export function useAnalysisDetail(id: string | undefined) {
  const [record, setRecord] = useState<SanitizedAnalysisRecord | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecord = useCallback(async () => {
    if (!id) {
      setRecord(undefined);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAnalysisRecordByIdAsync(id);
      setRecord(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis detail.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

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
    if (!id) return;
    await deleteAnalysisRecordAsync(id);
    setRecord(undefined);
  }, [id]);

  return {
    record,
    isLoading,
    error,
    refresh: fetchRecord,
    deleteRecord,
  };
}

/**
 * Hook to read and manage Breach History reactively with IndexedDB.
 */
export function useBreachHistory() {
  const [records, setRecords] = useState<SanitizedBreachRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getBreachRecordsAsync();
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load breach check history.');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    try {
      await deleteBreachRecordAsync(id);
      setRecords((prev) => prev.filter((r) => r.id.toLowerCase() !== id.toLowerCase()));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete record.');
    }
  }, []);

  return {
    records,
    isLoading,
    error,
    refresh: fetchRecords,
    deleteRecord,
  };
}

/**
 * Hook to read a single Breach Record by ID with loading/error states.
 */
export function useBreachDetail(id: string | undefined) {
  const [record, setRecord] = useState<SanitizedBreachRecord | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecord = useCallback(async () => {
    if (!id) {
      setRecord(undefined);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const data = await getBreachRecordByIdAsync(id);
      setRecord(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load breach record detail.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

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
    if (!id) return;
    await deleteBreachRecordAsync(id);
    setRecord(undefined);
  }, [id]);

  return {
    record,
    isLoading,
    error,
    refresh: fetchRecord,
    deleteRecord,
  };
}

/**
 * Helper to clear all history across stores.
 */
export async function clearAllLocalData(): Promise<void> {
  await clearAllHistoryAsync();
}
