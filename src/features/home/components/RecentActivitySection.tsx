import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Plus,
  Clock,
  Database,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAnalysisHistory, useBreachHistory } from '@/hooks/useHistory';
import type { SanitizedAnalysisRecord, SanitizedBreachRecord } from '@/types';

type UnifiedActivityItem =
  | { type: 'analysis'; record: SanitizedAnalysisRecord }
  | { type: 'breach'; record: SanitizedBreachRecord };

export function RecentActivitySection() {
  const { records: analysisRecords, isLoading: analysisLoading } = useAnalysisHistory();
  const { records: breachRecords, isLoading: breachLoading } = useBreachHistory();

  const isLoading = analysisLoading || breachLoading;

  // Merge and sort both record types descending by timestamp
  const unifiedActivities = useMemo(() => {
    const list: UnifiedActivityItem[] = [
      ...analysisRecords.map((r): UnifiedActivityItem => ({ type: 'analysis', record: r })),
      ...breachRecords.map((r): UnifiedActivityItem => ({ type: 'breach', record: r })),
    ];

    list.sort((a, b) => new Date(b.record.timestamp).getTime() - new Date(a.record.timestamp).getTime());

    return list.slice(0, 3); // Display top 3 most recent
  }, [analysisRecords, breachRecords]);

  const hasActivities = unifiedActivities.length > 0;

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getScoreVariant = (score: number) => {
    if (score <= 1) return 'rose' as const;
    if (score === 2) return 'amber' as const;
    return 'emerald' as const;
  };

  return (
    <section aria-labelledby="recent-activity-title" className="space-y-4 text-left">
      <div className="flex items-center justify-between pb-1 border-b border-border/40">
        <h2 id="recent-activity-title" className="text-xs font-semibold uppercase tracking-wider text-muted font-mono flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
          <span>Recent Activity</span>
        </h2>
        {!isLoading && (
          <div className="flex items-center gap-2.5 font-mono text-[11px]">
            <Link
              to="/analysis-history"
              className="text-accent hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm"
            >
              <span>Analyses ({analysisRecords.length})</span>
            </Link>
            <span className="text-border/60">•</span>
            <Link
              to="/breach-history"
              className="text-accent hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm"
            >
              <span>Breaches ({breachRecords.length})</span>
            </Link>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8 rounded-2xl border border-enclave-border/80 bg-enclave-plate/90 shadow-card-tactical p-4">
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-muted">
            <div className="w-3.5 h-3.5 rounded-full border border-accent/20 border-t-accent animate-spin" />
            <span>Loading activity timeline from IndexedDB...</span>
          </div>
        </div>
      ) : hasActivities ? (
        <div className="space-y-2.5">
          {unifiedActivities.map((item) => {
            if (item.type === 'analysis') {
              const rec = item.record;
              return (
                <div
                  key={`analysis-${rec.id}`}
                  className="rounded-2xl border border-enclave-border/80 bg-enclave-plate/90 shadow-card-tactical hover:border-accent/40 transition-all duration-200 group overflow-hidden"
                >
                  <Link
                    to={`/analysis-history/${rec.id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 focus:outline-none p-3.5 sm:p-4"
                    aria-label={`Inspect analysis record #${rec.id.slice(0, 8)}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-surface-elevated border border-border text-accent group-hover:border-accent/40 transition-colors">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-foreground">
                            ANALYSIS #{rec.id.slice(0, 8)}
                          </span>
                          <Badge variant={getScoreVariant(rec.score)} size="sm" dot>
                            {rec.strengthLabel || `Score ${rec.score}/4`}
                          </Badge>
                          <span className="font-mono text-[10px] text-muted-dim hidden sm:inline">
                            {formatTimestamp(rec.timestamp)}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted font-mono flex items-center gap-3">
                          <span>{rec.passwordLength} chars</span>
                          <span>•</span>
                          <span>~{rec.entropyBits} bits difficulty</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-dim" />
                            {rec.crackTimeDisplay}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                      <div className="flex items-center gap-1 font-mono text-[10px] text-muted">
                        <span className={`px-1.5 py-0.5 rounded-sm border ${rec.hasLowercase ? 'border-border text-foreground bg-surface-elevated' : 'border-border/40 opacity-30'}`}>a-z</span>
                        <span className={`px-1.5 py-0.5 rounded-sm border ${rec.hasUppercase ? 'border-border text-foreground bg-surface-elevated' : 'border-border/40 opacity-30'}`}>A-Z</span>
                        <span className={`px-1.5 py-0.5 rounded-sm border ${rec.hasNumbers ? 'border-border text-foreground bg-surface-elevated' : 'border-border/40 opacity-30'}`}>0-9</span>
                        <span className={`px-1.5 py-0.5 rounded-sm border ${rec.hasSymbols ? 'border-border text-foreground bg-surface-elevated' : 'border-border/40 opacity-30'}`}>#&!</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent transform group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                </div>
              );
            }

            // item.type === 'breach'
            const rec = item.record;
            return (
              <div
                key={`breach-${rec.id}`}
                className="rounded-2xl border border-enclave-border/80 bg-enclave-plate/90 shadow-card-tactical hover:border-accent/40 transition-all duration-200 group overflow-hidden"
              >
                <Link
                  to={`/breach-history/${rec.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 focus:outline-none p-3.5 sm:p-4"
                  aria-label={`Inspect breach query record #${rec.id.slice(0, 8)}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md border shrink-0 transition-colors ${
                      rec.isBreached
                        ? 'bg-danger/10 text-danger border-danger/30'
                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                    }`}>
                      {rec.isBreached ? (
                        <ShieldAlert className="w-4 h-4" />
                      ) : (
                        <Database className="w-4 h-4" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground">
                          BREACH QUERY #{rec.id.slice(0, 8)}
                        </span>
                        <Badge variant={rec.isBreached ? 'rose' : 'emerald'} size="sm" dot>
                          {rec.isBreached ? `${rec.breachCount.toLocaleString()} Leaks` : 'Clean / Safe'}
                        </Badge>
                        <span className="font-mono text-[10px] text-muted-dim hidden sm:inline">
                          {formatTimestamp(rec.timestamp)}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted font-mono">
                        {rec.isBreached ? (
                          <span className="text-danger font-medium">
                            Found in {rec.breachCount.toLocaleString()} compromised incidents
                          </span>
                        ) : (
                          <span className="text-emerald-500 font-medium">
                            0 occurrences in ~800M+ breach dataset
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                    <span className="font-mono text-[10px] text-muted uppercase">k-Anonymity</span>
                    <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent transform group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        /* Compact Deliberate Empty State */
        <div className="p-5 rounded-2xl bg-enclave-plate/90 border border-enclave-border/80 shadow-card-tactical text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-muted">
            <History className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold text-foreground font-sans">No local activity logs yet</span>
          </div>
          <p className="text-[11px] text-muted max-w-sm mx-auto leading-relaxed font-sans">
            Evaluations and breach queries will appear here after saving them to local IndexedDB.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <Link to="/analyzer">
              <Button variant="outline" size="sm" className="h-7 text-xs" leftIcon={<Plus className="w-3 h-3" />}>
                Analyze Password
              </Button>
            </Link>
            <Link to="/breach-checker">
              <Button variant="outline" size="sm" className="h-7 text-xs" leftIcon={<Database className="w-3 h-3" />}>
                Check Breach
              </Button>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

export default RecentActivitySection;

