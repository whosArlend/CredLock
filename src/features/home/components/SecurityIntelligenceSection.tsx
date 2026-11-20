import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { fetchDashboardSummary } from '@/services/api/dashboardService';
import { ApiClientError } from '@/services/api/errors';
import type { DashboardSummaryData, DashboardStatus } from '@/types';
import {
  ShieldAlert,
  RefreshCw,
  AlertTriangle,
  Users,
  ShieldCheck,
  BookOpen,
  WifiOff,
  Building2,
  Calendar,
  ArrowRight,
} from 'lucide-react';

export function SecurityIntelligenceSection() {
  const [data, setData] = useState<DashboardSummaryData | null>(null);
  const [status, setStatus] = useState<DashboardStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const summary = await fetchDashboardSummary();
      setData(summary);
      setStatus('success');
      setLastUpdated(new Date().toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }));
    } catch (err: unknown) {
      setStatus('error');
      if (err instanceof ApiClientError) {
        setErrorMessage(err.getUserFriendlyMessage());
      } else {
        setErrorMessage('Failed to connect to the Security Intelligence API service.');
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute severity percentage for visualization
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
    <section aria-labelledby="security-intelligence-title" className="space-y-4 text-left">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-border/40">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
          <h2
            id="security-intelligence-title"
            className="text-xs font-semibold uppercase tracking-wider text-muted font-mono"
          >
            Global Threat Telemetry
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {status === 'loading' && (
            <Badge variant="amber" size="sm" dot>
              Syncing API...
            </Badge>
          )}

          {status === 'success' && (
            <Badge variant="emerald" size="sm" dot>
              Live Telemetry
            </Badge>
          )}

          {status === 'error' && (
            <Badge variant="rose" size="sm" dot>
              API Offline
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            disabled={status === 'loading'}
            aria-label="Refresh Security Intelligence"
            className="h-6 px-2 text-[11px] font-mono border border-border/50 text-muted hover:text-foreground"
            leftIcon={
              <RefreshCw
                className={`w-3 h-3 ${status === 'loading' ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
            }
          >
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {status === 'loading' && !data && (
        <Card variant="inset" padding="md" className="border-border py-8 text-center">
          <div className="flex items-center justify-center gap-2.5 text-xs font-mono text-muted">
            <div className="w-3.5 h-3.5 rounded-full border border-accent/20 border-t-accent animate-spin" />
            <span>Connecting to CredLock Security Intelligence backend...</span>
          </div>
        </Card>
      )}

      {/* Error / Offline state */}
      {status === 'error' && !data && (
        <Card variant="inset" padding="md" className="border-status-danger/30 bg-surface p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-status-danger/10 text-status-danger border border-status-danger/20 shrink-0">
                <WifiOff className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">
                    Security Intelligence API Unreachable
                  </h3>
                  <Badge variant="rose" size="sm">
                    Connection Error
                  </Badge>
                </div>
                <p className="text-xs text-muted max-w-xl leading-relaxed">
                  {errorMessage ||
                    'Unable to retrieve live threat telemetry from the backend service. Ensure the CredLock API server is running at port 4000.'}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="text-xs shrink-0 self-end sm:self-center"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Retry Connection
            </Button>
          </div>
        </Card>
      )}

      {/* Success / Data state */}
      {data && (
        <div className="space-y-4">
          {/* 1. Primary Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Total Breaches */}
            <Card variant="default" padding="sm" className="space-y-2 border-border bg-surface">
              <div className="flex items-center justify-between text-muted">
                <span className="text-[11px] font-mono uppercase tracking-wider">Tracked Breaches</span>
                <AlertTriangle className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="space-y-0.5">
                <p className="text-2xl font-bold font-mono text-foreground tracking-tight">
                  {data.statistics.totalBreaches}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-dim">Verified incidents</span>
                  <Badge variant="amber" size="sm">Incidents</Badge>
                </div>
              </div>
            </Card>

            {/* Card 2: Total Exposed Accounts */}
            <Card variant="default" padding="sm" className="space-y-2 border-border bg-surface">
              <div className="flex items-center justify-between text-muted">
                <span className="text-[11px] font-mono uppercase tracking-wider">Exposed Accounts</span>
                <Users className="w-3.5 h-3.5 text-status-danger" />
              </div>
              <div className="space-y-0.5">
                <p className="text-2xl font-bold font-mono text-foreground tracking-tight">
                  {data.statistics.totalExposedAccounts.toLocaleString()}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-dim">Cumulative accounts</span>
                  <Badge variant="rose" size="sm">Impact</Badge>
                </div>
              </div>
            </Card>

            {/* Card 3: Security Recommendations */}
            <Card
              variant="default"
              padding="sm"
              isInteractive
              className="space-y-2 border-border bg-surface hover:border-accent/40 transition-colors"
            >
              <Link to="/recommendations" className="block focus:outline-none space-y-2" aria-label="Explore Hardening Playbooks">
                <div className="flex items-center justify-between text-muted">
                  <span className="text-[11px] font-mono uppercase tracking-wider">Hardening Playbooks</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-2xl font-bold font-mono text-foreground tracking-tight">
                    {data.statistics.totalRecommendations}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-dim">Action playbooks</span>
                    <Badge variant="emerald" size="sm">Best Practice</Badge>
                  </div>
                </div>
              </Link>
            </Card>

            {/* Card 4: Security Articles */}
            <Card
              variant="default"
              padding="sm"
              isInteractive
              className="space-y-2 border-border bg-surface hover:border-accent/40 transition-colors"
            >
              <Link to="/articles" className="block focus:outline-none space-y-2" aria-label="Explore Security Advisories">
                <div className="flex items-center justify-between text-muted">
                  <span className="text-[11px] font-mono uppercase tracking-wider">Advisory Articles</span>
                  <BookOpen className="w-3.5 h-3.5 text-status-info" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-2xl font-bold font-mono text-foreground tracking-tight">
                    {data.statistics.totalArticles}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-dim">Guides & research</span>
                    <Badge variant="cyan" size="sm">Advisories</Badge>
                  </div>
                </div>
              </Link>
            </Card>
          </div>

          {/* 2. Intelligence Telemetry Split Grid: Severity Distribution (5 cols) & Recent Breaches (7 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Left: Severity Distribution */}
            <div className="lg:col-span-5 p-4 rounded-xl border border-border bg-surface space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-border/50">
                  <span className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">
                    Severity Distribution
                  </span>
                  <span className="text-[10px] font-mono text-muted-dim">
                    THREAT IMPACT
                  </span>
                </div>

                {/* Proportion Bar */}
                <div className="h-2 rounded-full bg-background-elevated overflow-hidden flex" aria-hidden="true">
                  {data.breachesBySeverity.critical > 0 && (
                    <div
                      style={{ width: `${getSeverityPercent(data.breachesBySeverity.critical)}%` }}
                      className="bg-[#EF4444] transition-all duration-300"
                      title={`Critical: ${data.breachesBySeverity.critical}`}
                    />
                  )}
                  {data.breachesBySeverity.high > 0 && (
                    <div
                      style={{ width: `${getSeverityPercent(data.breachesBySeverity.high)}%` }}
                      className="bg-accent transition-all duration-300"
                      title={`High: ${data.breachesBySeverity.high}`}
                    />
                  )}
                  {data.breachesBySeverity.medium > 0 && (
                    <div
                      style={{ width: `${getSeverityPercent(data.breachesBySeverity.medium)}%` }}
                      className="bg-status-info transition-all duration-300"
                      title={`Medium: ${data.breachesBySeverity.medium}`}
                    />
                  )}
                  {data.breachesBySeverity.low > 0 && (
                    <div
                      style={{ width: `${getSeverityPercent(data.breachesBySeverity.low)}%` }}
                      className="bg-status-success transition-all duration-300"
                      title={`Low: ${data.breachesBySeverity.low}`}
                    />
                  )}
                </div>
              </div>

              {/* Severity Counts Badges */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-background-base border border-border/60">
                  <span className="text-xs font-mono text-[#EF4444] font-medium">Critical</span>
                  <Badge variant="rose" size="sm">
                    {data.breachesBySeverity.critical}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-background-base border border-border/60">
                  <span className="text-xs font-mono text-accent font-medium">High</span>
                  <Badge variant="amber" size="sm">
                    {data.breachesBySeverity.high}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-background-base border border-border/60">
                  <span className="text-xs font-mono text-status-info font-medium">Medium</span>
                  <Badge variant="cyan" size="sm">
                    {data.breachesBySeverity.medium}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-background-base border border-border/60">
                  <span className="text-xs font-mono text-status-success font-medium">Low</span>
                  <Badge variant="emerald" size="sm">
                    {data.breachesBySeverity.low}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Right: Recent Verified Breaches Feed */}
            <div className="lg:col-span-7 p-4 rounded-xl border border-border bg-surface space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-border/50">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">
                    Recent Verified Incidents
                  </span>
                </div>
                <Link
                  to="/breaches"
                  className="text-[11px] font-mono text-accent hover:underline flex items-center gap-0.5"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {data.recentBreaches.length > 0 ? (
                <div className="divide-y divide-border/40">
                  {data.recentBreaches.slice(0, 3).map((breach) => (
                    <div
                      key={breach.id}
                      className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-left"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/breaches/${breach.slug}`}
                            className="text-xs font-semibold text-foreground hover:text-accent transition-colors truncate"
                          >
                            {breach.title}
                          </Link>
                          <Badge
                            variant={getSeverityBadgeVariant(breach.severity)}
                            size="sm"
                          >
                            {breach.severity}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-muted">
                          {breach.organization && (
                            <span className="flex items-center gap-1 truncate">
                              <Building2 className="w-3 h-3 text-muted-dim" />
                              {breach.organization}
                            </span>
                          )}
                          {breach.breach_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-muted-dim" />
                              {breach.breach_date}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-foreground">
                          {breach.pwn_count ? breach.pwn_count.toLocaleString() : '—'}
                        </span>
                        <span className="block text-[9px] text-muted-dim font-mono">
                          accounts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-mono text-muted py-2 text-center">
                  No recent breach incidents reported.
                </p>
              )}
            </div>
          </div>

          {/* Footer telemetry timestamp */}
          {lastUpdated && (
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-dim px-1">
              <span>SOURCE: SUPABASE POSTGRESQL // BACKEND REST API</span>
              <span>TELEMETRY UPDATED: {lastUpdated}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
