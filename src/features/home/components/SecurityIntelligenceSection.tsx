import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { fetchDashboardSummary } from '@/services/api/dashboardService';
import { ApiClientError } from '@/services/api/errors';
import type { DashboardSummaryData, DashboardStatus } from '@/types';
import {
  RefreshCw,
  AlertTriangle,
  Users,
  ShieldCheck,
  BookOpen,
  WifiOff,
  Building2,
  Calendar,
  ArrowRight,
  Activity,
  Radio,
} from 'lucide-react';

export function SecurityIntelligenceSection() {
  const [data, setData] = useState<DashboardSummaryData | null>(null);
  const [status, setStatus] = useState<DashboardStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const loadData = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const summary = await fetchDashboardSummary();
      if (!isMountedRef.current) return;
      setData(summary);
      setStatus('success');
      setLastUpdated(new Date().toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }));
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      setStatus('error');
      if (err instanceof ApiClientError) {
        setErrorMessage(err.getUserFriendlyMessage());
      } else {
        setErrorMessage('Failed to connect to the Security Intelligence API service.');
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadData]);

  const totalSeverityBreaches = data
    ? data.breachesBySeverity.critical +
      data.breachesBySeverity.high +
      data.breachesBySeverity.medium +
      data.breachesBySeverity.low
    : 0;

  const getSeverityPercent = (count: number) => {
    if (totalSeverityBreaches === 0) return 0;
    return Math.round((count / totalSeverityBreaches) * 100);
  };

  const getSeverityBadgeVariant = (severity: string): 'rose' | 'amber' | 'cyan' | 'neutral' => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'rose';
      case 'high':
        return 'amber';
      case 'medium':
        return 'cyan';
      default:
        return 'neutral';
    }
  };

  return (
    <section
      aria-labelledby="security-intelligence-title"
      className="rounded-2xl bg-enclave-plate border border-border-strong p-5 sm:p-6 space-y-6 text-left shadow-plate-tactical relative overflow-hidden"
    >
      {/* Tactical Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-accent animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-[0.2em]">
              TELEMETRY FEED // GLOBAL BREACH RADAR
            </span>
          </div>
          <h2
            id="security-intelligence-title"
            className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-sans"
          >
            Threat Operations & Verified Breach Ledger
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-enclave-void border border-border text-[11px] font-mono text-foreground-secondary">
            <span className="w-2 h-2 rounded-full bg-status-success" />
            <span>LIVE SYNC</span>
            {lastUpdated && <span className="text-foreground-dim">({lastUpdated})</span>}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={status === 'loading'}
            aria-label="Refresh Security Intelligence"
            className="h-8 px-2.5 text-xs font-mono"
            leftIcon={
              <RefreshCw
                className={`w-3.5 h-3.5 ${status === 'loading' ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
            }
          >
            Sync
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {status === 'loading' && !data && (
        <div className="py-12 text-center rounded-xl border border-dashed border-border-strong bg-enclave-void/50">
          <div className="flex flex-col items-center justify-center gap-3 text-xs font-mono text-muted">
            <div className="w-6 h-6 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
            <span>CONNECTING TO THREAT INTELLIGENCE CLUSTER...</span>
          </div>
        </div>
      )}

      {/* Error / Offline state */}
      {status === 'error' && !data && (
        <div className="rounded-xl border border-status-danger/30 bg-status-danger/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-lg bg-status-danger/10 text-status-danger border border-status-danger/20 shrink-0">
              <WifiOff className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">
                Threat Intelligence Stream Offline
              </h3>
              <p className="text-xs text-foreground-secondary max-w-xl leading-relaxed">
                {errorMessage || 'Unable to query the Threat Intelligence backend. Ensure the server is online.'}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry Sync
          </Button>
        </div>
      )}

      {/* Data Visual State */}
      {data && (
        <div className="space-y-6">
          {/* 4 Metric Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Tile 1 */}
            <div className="p-4 rounded-xl bg-enclave-card border border-border-strong space-y-2 shadow-card-tactical">
              <div className="flex items-center justify-between text-muted">
                <span className="text-[10px] font-mono uppercase tracking-wider text-foreground-dim">
                  TRACKED BREACHES
                </span>
                <AlertTriangle className="w-4 h-4 text-accent" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-foreground tracking-tight">
                {data.statistics.totalBreaches}
              </p>
              <Link
                to="/breaches"
                className="text-[11px] font-mono text-accent hover:underline flex items-center gap-1 pt-1"
              >
                <span>Incident Catalog</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Tile 2 */}
            <div className="p-4 rounded-xl bg-enclave-card border border-border-strong space-y-2 shadow-card-tactical">
              <div className="flex items-center justify-between text-muted">
                <span className="text-[10px] font-mono uppercase tracking-wider text-foreground-dim">
                  EXPOSED ACCOUNTS
                </span>
                <Users className="w-4 h-4 text-status-danger" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-foreground tracking-tight truncate">
                {data.statistics.totalExposedAccounts.toLocaleString()}
              </p>
              <span className="text-[11px] font-mono text-foreground-dim block pt-1">
                Cumulative Global Impact
              </span>
            </div>

            {/* Tile 3 */}
            <div className="p-4 rounded-xl bg-enclave-card border border-border-strong space-y-2 shadow-card-tactical">
              <div className="flex items-center justify-between text-muted">
                <span className="text-[10px] font-mono uppercase tracking-wider text-foreground-dim">
                  HARDENING PLAYBOOKS
                </span>
                <ShieldCheck className="w-4 h-4 text-status-success" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-foreground tracking-tight">
                {data.statistics.totalRecommendations}
              </p>
              <Link
                to="/recommendations"
                className="text-[11px] font-mono text-accent hover:underline flex items-center gap-1 pt-1"
              >
                <span>Security Guidelines</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Tile 4 */}
            <div className="p-4 rounded-xl bg-enclave-card border border-border-strong space-y-2 shadow-card-tactical">
              <div className="flex items-center justify-between text-muted">
                <span className="text-[10px] font-mono uppercase tracking-wider text-foreground-dim">
                  RESEARCH ADVISORIES
                </span>
                <BookOpen className="w-4 h-4 text-status-info" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-foreground tracking-tight">
                {data.statistics.totalArticles}
              </p>
              <Link
                to="/articles"
                className="text-[11px] font-mono text-accent hover:underline flex items-center gap-1 pt-1"
              >
                <span>Read Research</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Lower Grid: Severity Spectrum & Recent Incidents */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Severity Spectrum (5 Cols) */}
            <div className="lg:col-span-5 p-4 sm:p-5 rounded-xl border border-border-strong bg-enclave-card space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-accent" />
                  Severity Distribution
                </span>
                <span className="text-[10px] font-mono text-foreground-dim">RISK MATRIX</span>
              </div>

              {/* Progress Bar Spectrum */}
              <div className="space-y-1.5">
                <div className="h-3 w-full rounded-full bg-enclave-void overflow-hidden flex border border-border/80">
                  {data.breachesBySeverity.critical > 0 && (
                    <div
                      style={{ width: `${getSeverityPercent(data.breachesBySeverity.critical)}%` }}
                      className="bg-[#EF4444]"
                      title={`Critical: ${data.breachesBySeverity.critical}`}
                    />
                  )}
                  {data.breachesBySeverity.high > 0 && (
                    <div
                      style={{ width: `${getSeverityPercent(data.breachesBySeverity.high)}%` }}
                      className="bg-accent"
                      title={`High: ${data.breachesBySeverity.high}`}
                    />
                  )}
                  {data.breachesBySeverity.medium > 0 && (
                    <div
                      style={{ width: `${getSeverityPercent(data.breachesBySeverity.medium)}%` }}
                      className="bg-status-info"
                      title={`Medium: ${data.breachesBySeverity.medium}`}
                    />
                  )}
                  {data.breachesBySeverity.low > 0 && (
                    <div
                      style={{ width: `${getSeverityPercent(data.breachesBySeverity.low)}%` }}
                      className="bg-status-success"
                      title={`Low: ${data.breachesBySeverity.low}`}
                    />
                  )}
                </div>
              </div>

              {/* Severity Breakdown Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-enclave-void border border-border-strong">
                  <span className="font-mono text-[#EF4444] font-semibold">Critical</span>
                  <Badge variant="rose" size="sm">
                    {data.breachesBySeverity.critical}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-enclave-void border border-border-strong">
                  <span className="font-mono text-accent font-semibold">High</span>
                  <Badge variant="amber" size="sm">
                    {data.breachesBySeverity.high}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-enclave-void border border-border-strong">
                  <span className="font-mono text-status-info font-semibold">Medium</span>
                  <Badge variant="cyan" size="sm">
                    {data.breachesBySeverity.medium}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-enclave-void border border-border-strong">
                  <span className="font-mono text-status-success font-semibold">Low</span>
                  <Badge variant="emerald" size="sm">
                    {data.breachesBySeverity.low}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Recent Incidents Feed (7 Cols) */}
            <div className="lg:col-span-7 p-4 sm:p-5 rounded-xl border border-border-strong bg-enclave-card space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/70">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-accent" />
                  Recent Verified Breach Dispatches
                </span>
                <Link
                  to="/breaches"
                  className="text-xs font-mono text-accent hover:underline flex items-center gap-1"
                >
                  <span>All Incidents</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {data.recentBreaches.length > 0 ? (
                <div className="divide-y divide-border/60">
                  {data.recentBreaches.slice(0, 3).map((breach) => (
                    <div
                      key={breach.id}
                      className="py-3 first:pt-1 last:pb-0 flex items-center justify-between gap-3 text-left"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 min-w-0">
                          <Link
                            to={`/breaches/${breach.slug}`}
                            className="text-xs sm:text-sm font-bold text-foreground hover:text-accent transition-colors truncate max-w-[220px] sm:max-w-none"
                          >
                            {breach.title}
                          </Link>
                          <Badge
                            variant={getSeverityBadgeVariant(breach.severity)}
                            size="sm"
                            className="shrink-0 uppercase"
                          >
                            {breach.severity}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-foreground-dim">
                          {breach.organization && (
                            <span className="flex items-center gap-1 truncate text-foreground-secondary">
                              <Building2 className="w-3 h-3 text-muted" />
                              {breach.organization}
                            </span>
                          )}
                          {breach.breach_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-muted" />
                              {breach.breach_date}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs sm:text-sm font-mono font-bold text-foreground block">
                          {breach.pwn_count ? breach.pwn_count.toLocaleString() : '—'}
                        </span>
                        <span className="block text-[10px] text-foreground-dim font-mono uppercase">
                          Exposed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs font-mono text-muted">
                  No verified breach entries recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default SecurityIntelligenceSection;

