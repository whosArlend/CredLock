import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { useBreachDetail } from '@/hooks/useHistory';
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  SearchX,
  Hash,
  Trash2,
  CheckCircle2,
  KeyRound,
  Shield,
  Plus,
} from 'lucide-react';

export function BreachDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { record, isLoading, error, deleteRecord } = useBreachDetail(id);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!id || isDeleting) return;
    try {
      setIsDeleting(true);
      await deleteRecord();
      showToast({
        type: 'info',
        title: 'Query Record Purged',
        message: 'The breach check record was deleted from IndexedDB.',
      });
      navigate('/breach-history', { replace: true });
    } catch {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Unable to remove breach record from storage.',
      });
      setIsDeleting(false);
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-5 animate-in fade-in duration-200 text-left">
        <PageHeader
          title="Loading Breach Query Record..."
          description="Retrieving sanitized k-anonymity query metadata from local IndexedDB storage."
          actions={
            <Link to="/breach-history">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Back to History
              </Button>
            </Link>
          }
        />
        <div className="text-center py-16 rounded-xl border border-border bg-surface">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
            <div className="font-mono text-xs text-muted uppercase tracking-wider">
              Querying credlock-db // {id || 'record'}...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not Found State
  if (!record || error) {
    return (
      <div className="space-y-5 animate-in fade-in duration-200 text-left">
        <PageHeader
          title="Record Not Found"
          description="The requested breach check query record could not be located in local storage."
          actions={
            <Link to="/breach-history">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Back to History
              </Button>
            </Link>
          }
        />

        <div className="max-w-md mx-auto text-center py-10 px-6 rounded-xl bg-surface border border-border">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-3.5 rounded-lg bg-surface-elevated text-amber-500 border border-border">
              <SearchX className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-foreground font-sans">Breach Record Unavailable</h3>
            <p className="text-xs text-muted max-w-sm leading-relaxed font-sans">
              No query log matches identifier <code className="font-mono text-foreground font-semibold">"{id || 'empty'}"</code>. The record does not exist in local IndexedDB storage.
            </p>
            <div className="pt-2">
              <Link to="/breach-history">
                <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                  Return to Breach History
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* Top Navigation & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/breach-history">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to History
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/breach-checker">
            <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              New Check
            </Button>
          </Link>
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            isLoading={isDeleting}
            onClick={handleDelete}
          >
            Delete Record
          </Button>
        </div>
      </div>

      {/* Header / Masthead */}
      <div className="space-y-2 pb-1 border-b border-border/60">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-foreground">
            Breach Query #{record.id.slice(0, 8)}
          </h1>
          <Badge variant={record.isBreached ? 'rose' : 'emerald'} size="sm" dot>
            {record.isBreached ? 'Compromised in Breaches' : 'Clean / Safe'}
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted font-sans">
          Mathematical verification of k-anonymity hash-range query and sanitized incident parameters.
        </p>
      </div>

      {/* Primary Metrics Snapshot Bar (4 items) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 p-4 sm:p-5 rounded-2xl bg-enclave-plate/90 border border-enclave-border/80 shadow-plate-tactical">
        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase text-muted tracking-wider block">Exposure Status</span>
          <div className={`text-base sm:text-lg font-bold font-sans ${record.isBreached ? 'text-status-danger' : 'text-status-success'}`}>
            {record.isBreached ? 'Compromised' : 'Clean / Safe'}
          </div>
          <span className="text-[10px] text-muted-dim font-mono block">Query outcome</span>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase text-muted tracking-wider block">Leak Occurrences</span>
          <div className="text-base sm:text-lg font-bold font-mono text-foreground">
            {record.isBreached ? record.breachCount.toLocaleString() : '0'}
          </div>
          <span className="text-[10px] text-muted-dim font-mono block">Known leak count</span>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase text-muted tracking-wider block">Privacy Model</span>
          <div className="text-base sm:text-lg font-bold font-sans text-foreground">
            k-Anonymity
          </div>
          <span className="text-[10px] text-muted-dim font-mono block">5-char SHA-1 prefix</span>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase text-muted tracking-wider block">Storage Enclave</span>
          <div className="text-base sm:text-lg font-bold font-mono text-foreground">
            IndexedDB
          </div>
          <span className="text-[10px] text-muted-dim font-mono block">breach_history</span>
        </div>
      </div>

      {/* 2-Column Responsive Diagnostic Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Panel 1: Query Telemetry & Details */}
        <div className="rounded-xl bg-surface border border-border/80 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              {record.isBreached ? (
                <ShieldAlert className="w-4 h-4 text-status-danger" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-status-success" />
              )}
              <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
                Query Telemetry
              </h2>
            </div>
            <span className="font-mono text-[10px] text-muted-dim uppercase">Sanitized Query</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-border/60">
              <span className="text-muted flex items-center gap-1.5 font-mono">
                <Hash className="w-3.5 h-3.5 text-accent" /> Query ID
              </span>
              <span className="font-mono text-foreground font-semibold break-all text-right max-w-[200px]">
                {record.id}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-border/60">
              <span className="text-muted flex items-center gap-1.5 font-mono">
                <Calendar className="w-3.5 h-3.5 text-accent" /> Verified At
              </span>
              <span className="font-mono text-foreground text-right">
                {formatTimestamp(record.timestamp)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-border/60">
              <span className="text-muted font-mono">Verification Verdict</span>
              {record.isBreached ? (
                <Badge variant="rose" size="sm" dot>
                  Compromised ({record.breachCount.toLocaleString()} incidents)
                </Badge>
              ) : (
                <Badge variant="emerald" size="sm" dot>
                  Clean in queried dataset
                </Badge>
              )}
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-border/60">
              <span className="text-muted font-mono">Occurrences Found</span>
              <span className="font-mono text-foreground font-semibold text-sm">
                {record.isBreached ? record.breachCount.toLocaleString() : '0'}
              </span>
            </div>
          </div>

          {record.isBreached && (
            <div className="pt-2 flex items-center justify-between gap-3 p-3 rounded-lg bg-status-danger/10 border border-status-danger/30">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground block">Compromised Credential</span>
                <span className="text-[11px] text-muted">Generate a cryptographically safe replacement.</span>
              </div>
              <Link to="/generator">
                <Button variant="outline" size="sm" leftIcon={<KeyRound className="w-3.5 h-3.5" />}>
                  Generate
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Panel 2: Privacy Enclave Assertions */}
        <div className="rounded-xl bg-surface border border-border/80 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent" />
                <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
                  Privacy Assertions
                </h2>
              </div>
              <span className="font-mono text-[10px] text-muted-dim uppercase">Invariants</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-background-base/60 border border-border">
                <CheckCircle2 className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
                <p className="text-muted leading-relaxed">
                  <strong className="text-foreground">Zero Plaintext Secrets:</strong> Passwords, SHA-1 suffixes, and digests are never written to disk or sent to telemetry servers.
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-background-base/60 border border-border">
                <CheckCircle2 className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
                <p className="text-muted leading-relaxed">
                  <strong className="text-foreground">k-Anonymity Model:</strong> Only a 5-character prefix was transmitted. The remaining 35 characters were compared entirely in the client browser sandbox.
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-background-base/60 border border-border">
                <CheckCircle2 className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
                <p className="text-muted leading-relaxed">
                  <strong className="text-foreground">Non-Reversible Metadata:</strong> This record retains only query outcome statistics. No password tokens can be reconstituted from this data.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border/60 text-[11px] text-muted-dim flex items-center justify-between font-mono">
            <span>STORAGE: INDEXEDDB // BREACH_HISTORY</span>
            <span className="text-status-success font-semibold">PERSISTED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
