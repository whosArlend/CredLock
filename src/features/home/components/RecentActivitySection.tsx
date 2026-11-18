import { Link } from 'react-router-dom';
import { History, ShieldCheck, ArrowRight, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAnalysisHistory } from '@/hooks/useHistory';

export function RecentActivitySection() {
  const { records, isLoading } = useAnalysisHistory();
  const hasRecords = records.length > 0;
  const recentRecords = records.slice(0, 3);

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
    <section className="space-y-4 text-left">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-dim font-mono flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
          <span>[ AUDIT LOGS // RECENT ACTIVITY ]</span>
        </h2>
        {!isLoading && hasRecords && (
          <Link
            to="/analysis-history"
            className="text-[11px] font-mono text-accent hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm"
          >
            <span>View All ({records.length})</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {isLoading ? (
        <Card variant="inset" padding="md" className="text-center py-6 border-border">
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-muted">
            <div className="w-3.5 h-3.5 rounded-full border border-accent/20 border-t-accent animate-spin" />
            <span>Loading audit log...</span>
          </div>
        </Card>
      ) : hasRecords ? (
        <div className="space-y-2.5">
          {recentRecords.map((record) => (
            <Card
              key={record.id}
              variant="default"
              padding="sm"
              isInteractive
              className="border-border hover:border-border-strong group"
            >
              <Link
                to={`/analysis-history/${record.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 focus:outline-none"
                aria-label={`Inspect sanitized analysis record ${record.id.slice(0, 8)}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-background-secondary border border-border text-foreground-secondary group-hover:text-accent transition-colors">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-foreground">
                        RECORD #{record.id.slice(0, 8)}
                      </span>
                      <Badge variant={getScoreVariant(record.score)} size="sm">
                        {record.strengthLabel || `Score ${record.score}/4`}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-foreground-dim font-mono mt-0.5 block">
                      {formatTimestamp(record.timestamp)} • {record.passwordLength} chars • ~{record.entropyBits} bits
                    </span>
                  </div>
                </div>

                {/* Sanitized Category Indicators */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                  <div className="flex items-center gap-1 font-mono text-[10px] text-foreground-dim">
                    <span
                      className={`px-1.5 py-0.5 rounded-sm border ${
                        record.hasLowercase
                          ? 'border-border-strong text-foreground-secondary bg-background-secondary'
                          : 'border-border/40 opacity-30'
                      }`}
                    >
                      a-z
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded-sm border ${
                        record.hasUppercase
                          ? 'border-border-strong text-foreground-secondary bg-background-secondary'
                          : 'border-border/40 opacity-30'
                      }`}
                    >
                      A-Z
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded-sm border ${
                        record.hasNumbers
                          ? 'border-border-strong text-foreground-secondary bg-background-secondary'
                          : 'border-border/40 opacity-30'
                      }`}
                    >
                      0-9
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded-sm border ${
                        record.hasSymbols
                          ? 'border-border-strong text-foreground-secondary bg-background-secondary'
                          : 'border-border/40 opacity-30'
                      }`}
                    >
                      #&!
                    </span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-foreground-dim group-hover:text-accent transform group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        /* Required Deliberate Empty State */
        <Card variant="inset" padding="lg" className="text-center">
          <div className="max-w-md mx-auto space-y-3 py-4">
            <div className="w-10 h-10 rounded-md bg-background-elevated border border-border flex items-center justify-center mx-auto text-foreground-dim">
              <History className="w-5 h-5 text-accent/80" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground font-sans">
                No analysis records yet
              </h3>
              <p className="text-xs text-foreground-muted leading-relaxed font-sans">
                Your security activity will appear here after you explicitly save an analysis.
              </p>
            </div>
            <div className="pt-2">
              <Link to="/analyzer">
                <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Analyze a Password
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </section>
  );
}
