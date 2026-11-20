import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { useBreachHistory } from '@/hooks/useHistory';
import {
  History,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Plus,
  ArrowLeft,
  Trash2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export function BreachHistoryPage() {
  const { records, isLoading, error, refresh, deleteRecord } = useBreachHistory();
  const { showToast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setDeletingId(id);
      await deleteRecord(id);
      showToast({
        type: 'info',
        title: 'Query Record Removed',
        message: 'The breach query entry was deleted from local storage.',
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Could not remove the breach record from IndexedDB.',
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* Page Header */}
      <PageHeader
        title="Breach Check History"
        description="Audit ledger of executed k-anonymity verification queries stored in client IndexedDB."
        badge={<Badge variant="neutral" size="sm">IndexedDB Enclave</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/breach-checker">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Back to Checker
              </Button>
            </Link>
            <Link to="/breach-checker">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                New Check
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
            Verification Ledger // breach_history
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-muted">
          {!isLoading && records.length > 0 && (
            <span>
              <strong className="text-foreground">{records.length}</strong> {records.length === 1 ? 'query' : 'queries'} logged
            </span>
          )}
          <span className="text-border hidden sm:inline">•</span>
          <span className="text-[11px] text-muted-dim">k-Anonymity Range</span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-16 rounded-xl border border-border bg-surface">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
            <div className="font-mono text-xs text-muted uppercase tracking-wider">
              Reading credlock-db // breach_history...
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
            <h3 className="text-base font-bold text-foreground font-sans">No Breach Queries Logged</h3>
            <p className="text-xs text-muted leading-relaxed font-sans">
              No breach verification queries have been archived yet. When you verify a credential in the Breach Checker and choose to save the result, the sanitized exposure records will appear here.
            </p>
            <div className="pt-2">
              <Link to="/breach-checker">
                <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Run a Breach Check
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Records: Desktop Ledger Table (md:block) */}
      {!isLoading && !error && records.length > 0 && (
        <>
          <div className="hidden md:block rounded-xl border border-border/80 bg-surface overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-surface-elevated/40 text-[11px] font-mono uppercase text-muted tracking-wider">
                  <th scope="col" className="py-3 px-4 font-semibold">Query ID</th>
                  <th scope="col" className="py-3 px-4 font-semibold">Checked At</th>
                  <th scope="col" className="py-3 px-4 font-semibold">Exposure Verdict</th>
                  <th scope="col" className="py-3 px-4 font-semibold">Recorded Incidents</th>
                  <th scope="col" className="py-3 px-4 font-semibold">Privacy Model</th>
                  <th scope="col" className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {records.map((record) => {
                  const isItemDeleting = deletingId === record.id;

                  return (
                    <tr
                      key={record.id}
                      className="group hover:bg-surface-elevated/50 transition-colors"
                    >
                      {/* Query ID */}
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        <Link
                          to={`/breach-history/${record.id}`}
                          className="hover:text-accent transition-colors flex items-center gap-1.5 focus:outline-none"
                        >
                          {record.isBreached ? (
                            <ShieldAlert className="w-3.5 h-3.5 text-status-danger shrink-0" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5 text-status-success shrink-0" />
                          )}
                          <span>#{record.id.slice(0, 8)}</span>
                        </Link>
                      </td>

                      {/* Checked Timestamp */}
                      <td className="py-3 px-4 font-mono text-muted text-xs whitespace-nowrap">
                        {formatTimestamp(record.timestamp)}
                      </td>

                      {/* Exposure Verdict */}
                      <td className="py-3 px-4">
                        <Badge
                          variant={record.isBreached ? 'rose' : 'emerald'}
                          size="sm"
                          dot
                        >
                          {record.isBreached ? 'Compromised' : 'Clean / Safe'}
                        </Badge>
                      </td>

                      {/* Recorded Incidents */}
                      <td className="py-3 px-4 font-mono">
                        {record.isBreached ? (
                          <span className="text-status-danger font-semibold">
                            {record.breachCount.toLocaleString()} public leaks
                          </span>
                        ) : (
                          <span className="text-status-success font-medium">
                            0 occurrences
                          </span>
                        )}
                      </td>

                      {/* Privacy Model */}
                      <td className="py-3 px-4 font-mono text-muted text-xs">
                        k-Anonymity (5-char SHA-1)
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
                            to={`/breach-history/${record.id}`}
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
              const isItemDeleting = deletingId === record.id;

              return (
                <div
                  key={record.id}
                  className="rounded-xl border border-border bg-surface p-3.5 space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to={`/breach-history/${record.id}`}
                      className="flex items-center gap-1.5 font-mono text-xs font-bold text-foreground hover:text-accent transition-colors"
                    >
                      {record.isBreached ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-status-danger shrink-0" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-status-success shrink-0" />
                      )}
                      <span>#{record.id.slice(0, 8)}</span>
                    </Link>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={record.isBreached ? 'rose' : 'emerald'}
                        size="sm"
                        dot
                      >
                        {record.isBreached ? `${record.breachCount.toLocaleString()} Leaks` : 'Clean'}
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

                  <div className="text-[11px] font-mono pt-1 border-t border-border/60">
                    {record.isBreached ? (
                      <span className="text-status-danger font-medium">
                        Found in {record.breachCount.toLocaleString()} compromised occurrences
                      </span>
                    ) : (
                      <span className="text-status-success font-medium">
                        Zero breach occurrences in queried dataset
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs font-mono">
                    <span className="text-[11px] text-muted-dim">
                      {formatTimestamp(record.timestamp)}
                    </span>

                    <Link
                      to={`/breach-history/${record.id}`}
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
