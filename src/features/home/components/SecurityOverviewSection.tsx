import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAnalysisHistory, useBreachHistory } from '@/hooks/useHistory';
import {
  ShieldCheck,
  AlertTriangle,
  Database,
  ArrowRight,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export function SecurityOverviewSection() {
  const { records: analysisRecords, isLoading: analysisLoading } = useAnalysisHistory();
  const { records: breachRecords, isLoading: breachLoading } = useBreachHistory();

  const isLoading = analysisLoading || breachLoading;

  const stats = useMemo(() => {
    const totalAnalyses = analysisRecords.length;
    const totalBreachChecks = breachRecords.length;
    const compromisedBreaches = breachRecords.filter((r) => r.isBreached).length;
    const cleanBreaches = totalBreachChecks - compromisedBreaches;

    const strongAnalyses = analysisRecords.filter((r) => r.score >= 3).length;
    const weakAnalyses = analysisRecords.filter((r) => r.score <= 1).length;

    const hasAnyActivity = totalAnalyses > 0 || totalBreachChecks > 0;

    return {
      totalAnalyses,
      totalBreachChecks,
      compromisedBreaches,
      cleanBreaches,
      strongAnalyses,
      weakAnalyses,
      hasAnyActivity,
    };
  }, [analysisRecords, breachRecords]);

  return (
    <section aria-labelledby="security-overview-title" className="space-y-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-border">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
          <h2 id="security-overview-title" className="text-xs font-semibold uppercase tracking-wider text-muted font-mono">
            [ SECURITY OVERVIEW // LOCAL ACTIVITY TELEMETRY ]
          </h2>
        </div>
        <span className="font-mono text-[11px] text-muted-dim">
          INDEXEDDB ENCLAVE SNAPSHOT
        </span>
      </div>

      {isLoading ? (
        <Card variant="inset" padding="md" className="border-border py-8 text-center">
          <div className="flex items-center justify-center gap-2.5 text-xs font-mono text-muted">
            <div className="w-3.5 h-3.5 rounded-full border border-accent/20 border-t-accent animate-spin" />
            <span>Reading local database aggregates...</span>
          </div>
        </Card>
      ) : !stats.hasAnyActivity ? (
        <Card variant="inset" padding="md" className="border-border p-6 bg-surface">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-surface-elevated text-muted border border-border shrink-0 mt-0.5 sm:mt-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">
                    Zero Historical Records in Local Storage
                  </h3>
                  <Badge variant="neutral" size="sm">Clean Enclave</Badge>
                </div>
                <p className="text-xs text-muted max-w-xl leading-relaxed">
                  No evaluations or breach lookups have been preserved yet. CredLock operates in-memory by default and only persists non-sensitive metadata when you explicitly save a result.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <Link to="/analyzer" className="w-full sm:w-auto">
                <span className="text-xs font-mono text-accent hover:underline inline-flex items-center gap-1">
                  Run First Analysis <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Historical Statistics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Evaluations */}
            <div className="p-4 rounded-lg bg-surface border border-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-muted uppercase tracking-wider">
                  SAVED ANALYSES
                </span>
                <ShieldCheck className="w-4 h-4 text-accent" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-foreground tabular-nums">
                  {stats.totalAnalyses}
                </span>
                <span className="text-[11px] text-muted font-mono">
                  {stats.strongAnalyses} strong
                </span>
              </div>
            </div>

            {/* Total Breach Queries */}
            <div className="p-4 rounded-lg bg-surface border border-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-muted uppercase tracking-wider">
                  BREACH QUERIES
                </span>
                <Database className="w-4 h-4 text-accent" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-foreground tabular-nums">
                  {stats.totalBreachChecks}
                </span>
                <span className="text-[11px] text-muted font-mono">
                  k-anonymity
                </span>
              </div>
            </div>

            {/* Clean Verifications */}
            <div className="p-4 rounded-lg bg-surface border border-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-muted uppercase tracking-wider">
                  CLEAN IN DATASETS
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-emerald-500 tabular-nums">
                  {stats.cleanBreaches}
                </span>
                <span className="text-[11px] text-muted font-mono">
                  0 occurrences
                </span>
              </div>
            </div>

            {/* Compromised Verifications */}
            <div className="p-4 rounded-lg bg-surface border border-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-muted uppercase tracking-wider">
                  EXPOSURES FLAGGED
                </span>
                <AlertTriangle className="w-4 h-4 text-danger" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-danger tabular-nums">
                  {stats.compromisedBreaches}
                </span>
                <span className="text-[11px] text-muted font-mono">
                  public leaks
                </span>
              </div>
            </div>
          </div>

          {/* Concise Historical Disclaimer */}
          <div className="p-3 rounded-lg bg-background-base/60 border border-border/80 text-[11px] text-muted flex items-center gap-2">
            <span className="font-mono text-accent shrink-0 font-bold">[NOTE]</span>
            <p>
              Metrics reflect locally saved evaluations on this device, not active online account monitoring.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
