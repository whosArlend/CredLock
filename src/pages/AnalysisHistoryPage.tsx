import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useAnalysisHistory } from '@/hooks/useHistory';
import {
  History,
  ArrowRight,
  ShieldCheck,
  Plus,
  ArrowLeft,
  Trash2,
  Clock,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

export function AnalysisHistoryPage() {
  const { user, profile, isAuthenticated } = useAuth();
  const { records, isLoading, error, refresh, deleteRecord } = useAnalysisHistory();
  const { showToast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const operativeUsername = profile?.username || (user?.user_metadata?.username as string) || null;

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setDeletingId(id);
      await deleteRecord(id);
      showToast({
        type: 'info',
        title: 'Record Removed',
        message: 'The analysis entry was deleted from local storage.',
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Could not remove the record from IndexedDB.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getScoreVariant = (score: number): 'emerald' | 'amber' | 'rose' => {
    if (score >= 3) return 'emerald';
    if (score === 2) return 'amber';
    return 'rose';
  };

  const getVerdictLabel = (score: number, strengthLabel?: string): string => {
    if (strengthLabel) return strengthLabel;
    switch (score) {
      case 4:
        return 'Very Strong';
      case 3:
        return 'Strong';
      case 2:
        return 'Moderate';
      case 1:
        return 'Weak';
      case 0:
      default:
        return 'Very Weak';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* Page Header */}
      <PageHeader
        title="Analysis History"
        description="Audit ledger of evaluated credentials with sanitized metrics stored in client IndexedDB."
        badge={<Badge variant="neutral" size="sm">IndexedDB Enclave</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/analyzer">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Back to Analyzer
              </Button>
            </Link>
            <Link to="/analyzer">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                New Analysis
              </Button>
            </Link>
          </div>
        }
      />

      {/* Audit Ledger Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface border border-border/80">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-accent" />
          <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
            Evaluation Ledger // analysis_history
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-muted">
          {isAuthenticated ? (
            <Badge variant="amber" size="sm" dot>
              Scope: {operativeUsername ? `@${operativeUsername}` : 'Authenticated Session'}
            </Badge>
          ) : (
            <Badge variant="neutral" size="sm" dot>
              Scope: Guest Session
            </Badge>
          )}
          {!isLoading && records.length > 0 && (
            <>
              <span className="text-border hidden sm:inline">•</span>
              <span>
                <strong className="text-foreground">{records.length}</strong> {records.length === 1 ? 'record' : 'records'} logged
              </span>
            </>
          )}
          <span className="text-border hidden sm:inline">•</span>
          <span className="text-[11px] text-muted-dim">Client Enclave</span>
        </div>
      </div>

      {/* Shared-Device Privacy Notice */}
      <div className="px-3.5 py-2.5 rounded-lg bg-surface border border-border/80 flex items-start sm:items-center gap-2.5 text-xs text-muted font-sans">
        <ShieldAlert className="w-4 h-4 text-accent shrink-0 mt-0.5 sm:mt-0" />
        <p className="leading-relaxed">
          <strong className="text-foreground font-semibold">Privacy Notice:</strong> Your history is stored locally in this browser. Logging out does not delete saved history. If you use a shared device,{' '}
          <Link to="/profile" className="text-accent underline hover:text-accent/80 font-medium">
            clear local data
          </Link>{' '}
          to remove saved history.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-16 rounded-xl border border-border bg-surface">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
            <div className="font-mono text-xs text-muted uppercase tracking-wider">
              Reading credlock-db // analysis_history...
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="rounded-xl border border-status-danger/40 bg-surface p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-status-danger shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-foreground">Storage Access Error</h3>
                <p className="text-xs text-muted mt-0.5">{error}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && records.length === 0 && (
        <div className="text-center py-12 px-6 rounded-xl bg-surface border border-border">
          <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
            <div className="p-3.5 rounded-lg bg-surface-elevated text-accent border border-border">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-foreground font-sans">No Analysis Records Logged</h3>
            <p className="text-xs text-muted leading-relaxed font-sans">
              No password strength evaluations have been saved to local storage yet. When you analyze a credential and preserve its evaluation, the sanitized cryptographic metrics will appear here.
            </p>
            <div className="pt-2">
              <Link to="/analyzer">
                <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Analyze a Password
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Records: Desktop Ledger Table (md:block) */}
      {!isLoading && !error && records.length > 0 && (
        <>
          <div className="hidden md:block rounded-2xl border border-enclave-border/80 bg-enclave-plate/90 overflow-hidden shadow-plate-tactical">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-enclave-border/80 bg-enclave-elevated/60 text-[11px] font-mono uppercase text-muted tracking-wider">
                  <th scope="col" className="py-3 px-4 font-semibold">Record ID</th>
                  <th scope="col" className="py-3 px-4 font-semibold">Evaluated At</th>
                  <th scope="col" className="py-3 px-4 font-semibold">Strength & Score</th>
                  <th scope="col" className="py-3 px-4 font-semibold">Length</th>
                  <th scope="col" className="py-3 px-4 font-semibold">Entropy</th>
                  <th scope="col" className="py-3 px-4 font-semibold">Crack Time</th>
                  <th scope="col" className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {records.map((record) => {
                  const scoreVariant = getScoreVariant(record.score);
                  const verdictLabel = getVerdictLabel(record.score, record.strengthLabel);
                  const isItemDeleting = deletingId === record.id;

                  return (
                    <tr
                      key={record.id}
                      className="group hover:bg-surface-elevated/50 transition-colors"
                    >
                      {/* Record ID */}
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        <Link
                          to={`/analysis-history/${record.id}`}
                          className="hover:text-accent transition-colors flex items-center gap-1.5 focus:outline-none"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span>#{record.id.slice(0, 8)}</span>
                        </Link>
                      </td>

                      {/* Evaluated Timestamp */}
                      <td className="py-3 px-4 font-mono text-muted text-xs whitespace-nowrap">
                        {formatTimestamp(record.timestamp)}
                      </td>

                      {/* Strength Score & Verdict */}
                      <td className="py-3 px-4">
                        <Badge variant={scoreVariant} size="sm" dot>
                          Score {record.score}/4 • {verdictLabel}
                        </Badge>
                      </td>

                      {/* Password Length */}
                      <td className="py-3 px-4 font-mono text-foreground font-semibold">
                        {record.passwordLength} chars
                      </td>

                      {/* Entropy Bits */}
                      <td className="py-3 px-4 font-mono text-foreground">
                        <span className="text-accent font-semibold">{record.entropyBits}</span> bits
                      </td>

                      {/* Crack Time */}
                      <td className="py-3 px-4 font-mono text-muted text-xs whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-dim shrink-0" />
                          {record.crackTimeDisplay}
                        </span>
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteItem(e, record.id)}
                            disabled={isItemDeleting}
                            className="p-1.5 rounded-md text-muted hover:text-status-danger hover:bg-surface-elevated transition-colors focus:outline-none"
                            title="Delete this record"
                            aria-label={`Delete record ${record.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <Link
                            to={`/analysis-history/${record.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-medium text-muted group-hover:text-foreground bg-surface-elevated/60 hover:bg-surface-elevated border border-border/80 transition-colors focus:outline-none"
                            aria-label={`Inspect record ${record.id}`}
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Records: Mobile High-Density Cards (md:hidden) */}
          <div className="md:hidden space-y-2.5">
            {records.map((record) => {
              const scoreVariant = getScoreVariant(record.score);
              const verdictLabel = getVerdictLabel(record.score, record.strengthLabel);
              const isItemDeleting = deletingId === record.id;

              return (
                <div
                  key={record.id}
                  className="rounded-xl border border-border bg-surface p-3.5 space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to={`/analysis-history/${record.id}`}
                      className="flex items-center gap-1.5 font-mono text-xs font-bold text-foreground hover:text-accent transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>#{record.id.slice(0, 8)}</span>
                    </Link>

                    <div className="flex items-center gap-2">
                      <Badge variant={scoreVariant} size="sm" dot>
                        {record.score}/4 • {verdictLabel}
                      </Badge>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteItem(e, record.id)}
                        disabled={isItemDeleting}
                        className="p-1 rounded text-muted hover:text-status-danger transition-colors focus:outline-none"
                        aria-label={`Delete record ${record.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-muted pt-1 border-t border-border/60">
                    <div>
                      Length: <strong className="text-foreground">{record.passwordLength}</strong> chars
                    </div>
                    <div>
                      Entropy: <strong className="text-accent">{record.entropyBits}</strong> bits
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs">
                    <div className="flex items-center gap-1 font-mono text-[11px] text-muted-dim">
                      <Clock className="w-3 h-3 text-muted-dim" />
                      <span>{record.crackTimeDisplay}</span>
                    </div>

                    <Link
                      to={`/analysis-history/${record.id}`}
                      className="inline-flex items-center gap-1 text-xs font-mono font-medium text-accent hover:underline"
                    >
                      <span>Inspect</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
