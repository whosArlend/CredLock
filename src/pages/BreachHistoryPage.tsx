import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
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
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Breach Check History"
        description="Historical log of executed k-anonymity breach verification checks with sanitized metadata. Stored in IndexedDB."
        badge={<Badge variant="neutral" size="sm">IndexedDB Enclave</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/breach-checker">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Checker
              </Button>
            </Link>
            <Link to="/breach-checker">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                New Check
              </Button>
            </Link>
          </div>
        }
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted font-mono flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-accent" />
            <span>[ AUDIT LOGS // STORE: BREACH_HISTORY ]</span>
          </h2>
          {!isLoading && records.length > 0 && (
            <span className="font-mono text-xs text-muted">
              {records.length} {records.length === 1 ? 'query' : 'queries'} persisted
            </span>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card variant="inset" className="text-center py-12 border-border">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
              <div className="font-mono text-xs text-muted uppercase tracking-wider">
                Reading credlock-db // breach_history...
              </div>
            </div>
          </Card>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <Card variant="default" className="border-amber-500/40 bg-surface p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-foreground">Storage Access Error</h3>
                  <p className="text-xs text-muted mt-0.5">{error}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Retry
              </Button>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && records.length === 0 && (
          <Card className="text-center py-10 bg-surface border-border">
            <CardHeader className="items-center pb-2">
              <div className="p-3 rounded-lg bg-surface-elevated text-accent mb-3 border border-border">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <CardTitle className="text-base text-foreground">No Breach Records Found</CardTitle>
              <CardDescription className="max-w-md mx-auto mt-1 text-muted">
                No breach queries have been archived yet. When you verify a credential in the Password Breach Checker and save the query result, the sanitized exposure records will appear here.
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center border-t-0 pt-4">
              <Link to="/breach-checker">
                <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                  Run a Breach Check
                </Button>
              </Link>
            </CardFooter>
          </Card>
        )}

        {/* Records List */}
        {!isLoading && !error && records.length > 0 && (
          <div className="space-y-3">
            {records.map((record) => {
              const isItemDeleting = deletingId === record.id;

              return (
                <Card
                  key={record.id}
                  variant="default"
                  isInteractive
                  className="group bg-surface border-border hover:border-border-subtle transition-all duration-200"
                >
                  <Link
                    to={`/breach-history/${record.id}`}
                    className="block focus:outline-none p-4 sm:p-5"
                    aria-label={`Inspect breach query entry ${record.id}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Info & Badges */}
                      <div className="flex items-start gap-3.5">
                        <div className={`p-2.5 rounded-lg border shrink-0 mt-0.5 sm:mt-0 ${
                          record.isBreached
                            ? 'bg-danger/10 text-danger border-danger/30'
                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                        }`}>
                          {record.isBreached ? (
                            <ShieldAlert className="w-5 h-5" />
                          ) : (
                            <ShieldCheck className="w-5 h-5" />
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-foreground">
                              #{record.id.slice(0, 8)}
                            </span>
                            <Badge
                              variant={record.isBreached ? 'rose' : 'emerald'}
                              size="sm"
                              dot
                            >
                              {record.isBreached
                                ? `${record.breachCount.toLocaleString()} Leaks Detected`
                                : 'Clean / Safe'}
                            </Badge>
                            <span className="font-mono text-[11px] text-muted-dim">
                              {formatTimestamp(record.timestamp)}
                            </span>
                          </div>

                          <div className="text-xs text-muted font-mono">
                            {record.isBreached ? (
                              <span className="text-danger font-semibold">
                                Found in {record.breachCount.toLocaleString()} compromised database occurrences
                              </span>
                            ) : (
                              <span className="text-emerald-500 font-semibold">
                                Zero public breach occurrences detected in queried dataset
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteItem(e, record.id)}
                          disabled={isItemDeleting}
                          className="p-2 rounded text-muted hover:text-danger hover:bg-surface-elevated transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-danger"
                          title="Delete this query record"
                          aria-label={`Delete record ${record.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1 text-xs text-muted group-hover:text-accent transition-colors pl-2">
                          <span className="font-mono text-[11px] uppercase tracking-wider">Inspect</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
