import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { addBreachRecord } from '@/services/historyStorage';
import {
  checkPasswordBreach,
  BreachCheckError,
  EmptyPasswordError,
} from '@/services/breachChecker';
import { BreachPasswordInput } from '@/features/breach/components/BreachPasswordInput';
import { BreachResult } from '@/features/breach/components/BreachResult';
import { BreachPrivacyNotice } from '@/features/breach/components/BreachPrivacyNotice';
import type { BreachCheckResult, BreachCheckStatus, SanitizedBreachRecord } from '@/types';

export function BreachCheckerPage() {
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<BreachCheckStatus>('idle');
  const [result, setResult] = useState<BreachCheckResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean up any ongoing query if component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handlePasswordChange = (newVal: string) => {
    setPassword(newVal);
    // If the user modifies the input after a previous query, reset previous result state
    if (status !== 'idle' && status !== 'loading') {
      setStatus('idle');
      setResult(null);
      setErrorMessage(null);
      setIsSaved(false);
    }
  };

  const handleClear = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setPassword('');
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
    setIsSaved(false);
  };

  const executeCheck = async () => {
    const trimmed = password.trim();
    if (!trimmed) {
      showToast({
        type: 'warning',
        title: 'Empty Password',
        message: 'Please enter a password to verify exposure.',
      });
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus('loading');
    setErrorMessage(null);
    setIsSaved(false);

    try {
      const checkResult = await checkPasswordBreach(password, {
        signal: controller.signal,
      });

      setResult(checkResult);
      setStatus('success');

      if (checkResult.isBreached) {
        showToast({
          type: 'error',
          title: 'Breach Detected',
          message: `This password was found in ${checkResult.breachCount.toLocaleString()} public breach occurrences.`,
        });
      } else {
        showToast({
          type: 'success',
          title: 'No Breach Found',
          message: 'This password does not appear in known breach datasets.',
        });
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // Query cancelled by user or new query, do nothing
        return;
      }

      setStatus('error');

      if (err instanceof EmptyPasswordError) {
        setErrorMessage(err.message);
      } else if (err instanceof BreachCheckError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected error occurred while verifying the credential.');
      }

      showToast({
        type: 'error',
        title: 'Query Failed',
        message: err instanceof Error ? err.message : 'Unable to complete breach verification.',
      });
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleSaveToHistory = () => {
    if (!result || isSaved) return;

    // Strict sanitization: Only save id, timestamp, exposure boolean, and count.
    // Absolutely NO password, password fragments, full hash, prefix, or suffix.
    const sanitizedRecord: SanitizedBreachRecord = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      isBreached: result.isBreached,
      breachCount: result.breachCount,
    };

    addBreachRecord(sanitizedRecord);
    setIsSaved(true);

    showToast({
      type: 'success',
      title: 'Archived to History',
      message: 'Sanitized breach metadata saved to session memory.',
    });
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title="Password Breach Checker"
        description="Verify password exposure against 800M+ known data leaks using the k-Anonymity privacy model."
        badge={
          <Badge variant="rose" size="sm" dot>
            k-Anonymity Range API
          </Badge>
        }
        actions={
          <Link to="/breach-history">
            <Button variant="secondary" size="sm" leftIcon={<History className="w-4 h-4" />}>
              View History
            </Button>
          </Link>
        }
      />

      {/* Main Interactive Query Chamber */}
      <div className="p-4 sm:p-5 rounded-xl border border-border bg-surface shadow-sm">
        <BreachPasswordInput
          value={password}
          onChange={handlePasswordChange}
          onClear={handleClear}
          onSubmit={executeCheck}
          isLoading={status === 'loading'}
        />
      </div>

      {/* Dynamic Query Result Component */}
      <BreachResult
        status={status}
        result={result}
        errorMessage={errorMessage}
        onRetry={executeCheck}
        onSaveHistory={handleSaveToHistory}
        isSaved={isSaved}
      />

      {/* Privacy-Preserving Architecture Notice */}
      <BreachPrivacyNotice />
    </div>
  );
}
