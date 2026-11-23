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
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
      <div className="p-8 rounded-2xl bg-enclave-plate border border-border-strong shadow-card-tactical text-center">
        <div className="flex flex-col items-center justify-center space-y-3.5">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-4 h-4 text-accent" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-accent block">
              [ HIBP RANGE QUERY // IN PROGRESS ]
            </span>
            <p className="text-sm font-bold text-foreground font-sans">
              Transmitting 5-character SHA-1 prefix...
            </p>
            <p className="text-xs text-foreground-muted max-w-md mx-auto leading-relaxed font-sans">
              Returned candidate hash suffixes are compared locally in client memory. Plaintext passwords never leave your machine.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // State D: Error
  if (status === 'error') {
    return (
      <div className="p-5 sm:p-6 rounded-2xl bg-enclave-plate border border-status-warning/40 shadow-card-tactical text-left">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-status-warning/10 border border-status-warning/30 text-status-warning shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-status-warning">
                  VERIFICATION INTERRUPTED
                </span>
                <Badge variant="amber" size="sm">Network Error</Badge>
              </div>
              <h3 className="text-base font-bold text-foreground font-sans">
                Unable to complete breach lookup
              </h3>
              <p className="text-xs text-foreground-secondary max-w-xl leading-relaxed font-sans">
                {errorMessage || 'A network error prevented verification. Check your connection to haveibeenpwned.com.'}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="w-full sm:w-auto shrink-0 font-mono text-xs"
          >
            Retry Query
          </Button>
        </div>
      </div>
    );
  }

  // State A & B: Result Available (Success)
  if (status === 'success' && result) {
    if (result.isBreached) {
      // State B: Found in Breaches
      return (
        <div className="p-6 rounded-2xl bg-enclave-plate border border-status-danger/40 shadow-plate-tactical space-y-5 text-left">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-border/80">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-status-danger/10 border border-status-danger/30 text-status-danger shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#EF4444]">
                    BREACH DETECTED // CRITICAL EXPOSURE
                  </span>
                  <Badge variant="rose" size="sm" dot>Compromised</Badge>
                </div>
                <h3 className="text-lg font-bold text-foreground font-sans tracking-tight">
                  This credential appears in public data breaches
                </h3>
                <p className="text-xs text-foreground-secondary max-w-xl leading-relaxed font-sans">
                  The local hash suffix matched a record in public credential dumps. Automated threat bots test these compromised combinations continuously.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end p-3 rounded-xl bg-enclave-void border border-border-strong shrink-0">
              <span className="font-mono text-[9px] text-foreground-dim uppercase tracking-wider">
                RECORDED EXPOSURES
              </span>
              <span className="font-mono text-2xl sm:text-3xl font-bold text-[#EF4444] tabular-nums">
                {result.breachCount.toLocaleString()}
              </span>
              <span className="font-mono text-[10px] text-foreground-dim">
                public occurrences
              </span>
            </div>
          </div>

          {/* Actionable Guidance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-enclave-card border border-border-strong space-y-2">
              <span className="font-mono text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                IMMEDIATE REMEDIATION
              </span>
              <ul className="text-xs text-foreground-secondary space-y-1.5 list-disc pl-4 leading-relaxed font-sans">
                <li><strong className="text-foreground">Cease using this password</strong> across all accounts immediately.</li>
                <li>Rotate passwords on all services sharing this credential.</li>
                <li>Activate Hardware Security Keys or App-Based MFA.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-enclave-card border border-border-strong flex flex-col justify-between gap-3">
              <div>
                <span className="font-mono text-xs font-bold text-status-success uppercase tracking-wider flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  GENERATE REPLACEMENT
                </span>
                <p className="text-xs text-foreground-secondary mt-1 leading-relaxed font-sans">
                  Synthesize an unbiased 128-bit cryptographic credential via CSPRNG.
                </p>
              </div>
              <Link to="/generator">
                <Button variant="outline" size="sm" leftIcon={<KeyRound className="w-3.5 h-3.5" />} className="w-full font-mono text-xs font-bold">
                  Open CSPRNG Forge
                </Button>
              </Link>
            </div>
          </div>

          {/* History Archival Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/80">
            <span className="text-xs text-foreground-dim font-mono">
              Only exposure occurrence count is saved. Zero password storage.
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant={isSaved ? 'secondary' : 'primary'}
                size="sm"
                disabled={isSaved || isSaving}
                onClick={handleSave}
                leftIcon={isSaved ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Save className="w-3.5 h-3.5" />}
                className="w-full sm:w-auto font-mono text-xs font-bold"
              >
                {isSaved ? 'Archived to History' : 'Save Breach Record'}
              </Button>
              <Link to="/breach-history" className="w-full sm:w-auto">
                <Button variant="secondary" size="sm" leftIcon={<History className="w-3.5 h-3.5 text-accent" />} className="w-full sm:w-auto font-mono text-xs">
                  Inspect Ledger
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // State A: Not Found in Breaches
    return (
      <div className="p-6 rounded-2xl bg-enclave-plate border border-status-success/40 shadow-plate-tactical space-y-5 text-left">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-border/80">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-status-success/10 border border-status-success/30 text-status-success shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-status-success">
                  CLEAN VERDICT // NO EXPOSURE FOUND
                </span>
                <Badge variant="emerald" size="sm" dot>Not Compromised</Badge>
              </div>
              <h3 className="text-lg font-bold text-foreground font-sans tracking-tight">
                No matching breach records in known databases
              </h3>
              <p className="text-xs text-foreground-secondary max-w-xl leading-relaxed font-sans">
                This password did not match any of the ~800+ million records in known breach compilations.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end p-3 rounded-xl bg-enclave-void border border-border-strong shrink-0">
            <span className="font-mono text-[9px] text-foreground-dim uppercase tracking-wider">
              DATABASE OCCURRENCES
            </span>
            <span className="font-mono text-2xl sm:text-3xl font-bold text-status-success tabular-nums">
              0
            </span>
            <span className="font-mono text-[10px] text-foreground-dim">
              clean in verified dataset
            </span>
          </div>
        </div>

        {/* Security Warning Notice */}
        <div className="p-4 rounded-xl bg-enclave-card border border-border-strong space-y-1.5">
          <span className="font-mono text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            ESSENTIAL SECURITY CONTEXT
          </span>
          <p className="text-xs text-foreground-secondary leading-relaxed font-sans">
            Absence from public breach compilations <strong className="text-foreground">does not guarantee</strong> that a credential has high entropy. Passwords with dictionary phrases or low lengths can still be cracked via offline attacks.
          </p>
          <div className="pt-1">
            <Link to="/analyzer" className="text-xs text-accent hover:underline inline-flex items-center gap-1 font-mono font-bold">
              <span>Evaluate full heuristic strength in Password Analyzer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* History Archival Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/80">
          <span className="text-xs text-foreground-dim font-mono">
            Preserve this verified clean record in your local session audit ledger?
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant={isSaved ? 'secondary' : 'primary'}
              size="sm"
              disabled={isSaved || isSaving}
              onClick={handleSave}
              leftIcon={isSaved ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Save className="w-3.5 h-3.5" />}
              className="w-full sm:w-auto font-mono text-xs font-bold"
            >
              {isSaved ? 'Archived to History' : 'Save Breach Record'}
            </Button>
            <Link to="/breach-history" className="w-full sm:w-auto">
              <Button variant="secondary" size="sm" leftIcon={<History className="w-3.5 h-3.5 text-accent" />} className="w-full sm:w-auto font-mono text-xs">
                Inspect Ledger
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
