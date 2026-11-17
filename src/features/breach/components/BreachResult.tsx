import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Save,
  Check,
  KeyRound,
  History,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import type { BreachCheckResult, BreachCheckStatus } from '@/types';

export interface BreachResultProps {
  status: BreachCheckStatus;
  result: BreachCheckResult | null;
  errorMessage: string | null;
  onRetry: () => void;
  onSaveHistory: () => void;
  isSaved: boolean;
}

export function BreachResult({
  status,
  result,
  errorMessage,
  onRetry,
  onSaveHistory,
  isSaved,
}: BreachResultProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    if (isSaved || isSaving || !result) return;
    setIsSaving(true);
    try {
      onSaveHistory();
    } finally {
      setIsSaving(false);
    }
  };

  // State C: Loading
  if (status === 'loading') {
    return (
      <Card variant="inset" padding="lg" className="border-border">
        <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-5 h-5 text-accent" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
              [ HIBP RANGE QUERY // IN PROGRESS ]
            </div>
            <p className="text-sm font-medium text-foreground">
              Transmitting 5-character prefix to Have I Been Pwned...
            </p>
            <p className="text-xs text-muted max-w-md">
              Matching suffixes will be evaluated client-side in your browser. Zero plaintext credentials leave your device.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // State D: Error
  if (status === 'error') {
    return (
      <Card variant="default" padding="lg" className="border-amber-500/40 bg-surface">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-amber-500">
                  VERIFICATION ERROR
                </span>
                <Badge variant="amber" size="sm">Query Interrupted</Badge>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Unable to complete breach lookup
              </h3>
              <p className="text-xs text-muted max-w-xl leading-relaxed">
                {errorMessage || 'A network or service failure prevented verification. Please check your connectivity.'}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            className="w-full sm:w-auto shrink-0"
          >
            Retry Query
          </Button>
        </div>
      </Card>
    );
  }

  // State A & B: Result Available (Success)
  if (status === 'success' && result) {
    if (result.isBreached) {
      // State B: Found in Breaches
      return (
        <Card variant="default" padding="lg" className="border-danger/40 bg-surface space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-border">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-danger/10 border border-danger/30 text-danger shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-danger">
                    BREACH DETECTED // HIGH EXPOSURE RISK
                  </span>
                  <Badge variant="rose" size="sm" dot>Compromised</Badge>
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  This password appears in known data breaches
                </h3>
                <p className="text-xs text-muted max-w-xl leading-relaxed">
                  The local hash suffix matched a record in public credential dumps. Automated credential-stuffing tools test these lists constantly.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end p-3 rounded-lg bg-background-base border border-border shrink-0">
              <span className="font-mono text-[10px] text-muted uppercase tracking-wider">
                RECORDED EXPOSURES
              </span>
              <span className="font-mono text-2xl font-bold text-danger tabular-nums">
                {result.breachCount.toLocaleString()}
              </span>
              <span className="font-mono text-[10px] text-muted-dim">
                public database occurrences
              </span>
            </div>
          </div>

          {/* Actionable Guidance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-background-base/60 border border-border space-y-2">
              <span className="font-mono text-xs font-semibold text-accent uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                IMMEDIATE ACTIONS REQUIRED
              </span>
              <ul className="text-xs text-muted space-y-1.5 list-disc pl-4 leading-relaxed">
                <li><strong className="text-foreground">Stop using this password</strong> on any personal or work accounts.</li>
                <li>Change passwords immediately on any services sharing this credential.</li>
                <li>Enable Multi-Factor Authentication (MFA / 2FA) wherever available.</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-background-base/60 border border-border flex flex-col justify-between gap-3">
              <div>
                <span className="font-mono text-xs font-semibold text-accent uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  GENERATE REPLACEMENT
                </span>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Use CredLock's cryptographically secure generator to create an unbiased, high-entropy credential.
                </p>
              </div>
              <Link to="/generator">
                <Button variant="outline" size="sm" leftIcon={<KeyRound className="w-4 h-4" />} className="w-full">
                  Open Secure Generator
                </Button>
              </Link>
            </div>
          </div>

          {/* History Archival Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-xs text-muted">
              Preserve this query result? Only exposure status and count are saved.
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant={isSaved ? 'secondary' : 'primary'}
                size="sm"
                disabled={isSaved || isSaving}
                onClick={handleSave}
                leftIcon={isSaved ? <Check className="w-4 h-4 text-emerald-500" /> : <Save className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                {isSaved ? 'Saved to History' : 'Save to Breach History'}
              </Button>
              <Link to="/breach-history" className="w-full sm:w-auto">
                <Button variant="secondary" size="sm" leftIcon={<History className="w-4 h-4" />} className="w-full sm:w-auto">
                  View History
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      );
    }

    // State A: Not Found in Breaches
    return (
      <Card variant="default" padding="lg" className="border-emerald-500/30 bg-surface space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-border">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-emerald-500">
                  NO MATCH FOUND // QUERY VERIFIED
                </span>
                <Badge variant="emerald" size="sm" dot>Not Exposed</Badge>
              </div>
              <h3 className="text-lg font-bold text-foreground">
                No breach records found for this password
              </h3>
              <p className="text-xs text-muted max-w-xl leading-relaxed">
                This password did not appear in the queried dataset of ~800+ million known breached credentials.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end p-3 rounded-lg bg-background-base border border-border shrink-0">
            <span className="font-mono text-[10px] text-muted uppercase tracking-wider">
              DATABASE OCCURRENCES
            </span>
            <span className="font-mono text-2xl font-bold text-emerald-500 tabular-nums">
              0
            </span>
            <span className="font-mono text-[10px] text-muted-dim">
              clean in queried dataset
            </span>
          </div>
        </div>

        {/* Security Warning Notice */}
        <div className="p-4 rounded-lg bg-background-base/60 border border-border space-y-2">
          <span className="font-mono text-xs font-semibold text-accent uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            CRITICAL SECURITY CONTEXT
          </span>
          <p className="text-xs text-muted leading-relaxed">
            Absence from public breach compilations <strong className="text-foreground">does not guarantee</strong> that a password is safe or mathematically resilient. Passwords with low entropy, dictionary patterns, or short lengths can still be rapidly cracked in offline brute-force attacks.
          </p>
          <div className="pt-1">
            <Link to="/analyzer" className="text-xs text-accent hover:underline inline-flex items-center gap-1 font-mono">
              Evaluate full heuristic strength in Password Analyzer &rarr;
            </Link>
          </div>
        </div>

        {/* History Archival Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <span className="text-xs text-muted">
            Preserve this clean verification in your session audit history?
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant={isSaved ? 'secondary' : 'primary'}
              size="sm"
              disabled={isSaved || isSaving}
              onClick={handleSave}
              leftIcon={isSaved ? <Check className="w-4 h-4 text-emerald-500" /> : <Save className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              {isSaved ? 'Saved to History' : 'Save to Breach History'}
            </Button>
            <Link to="/breach-history" className="w-full sm:w-auto">
              <Button variant="secondary" size="sm" leftIcon={<History className="w-4 h-4" />} className="w-full sm:w-auto">
                View History
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  // State: Idle (nothing to render yet)
  return null;
}
