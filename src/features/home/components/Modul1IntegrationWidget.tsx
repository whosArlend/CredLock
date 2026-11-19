import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { fetchTotalCustomers } from '@/services/api/module1Service';
import type { Module1ReportResult, Module1ConnectionStatus } from '@/types';
import {
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  WifiOff,
  Clock,
  Users,
} from 'lucide-react';

export function Modul1IntegrationWidget() {
  const [data, setData] = useState<Module1ReportResult | null>(null);
  const [status, setStatus] = useState<Module1ConnectionStatus>('idle');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (isLoading) return; // Prevent duplicate requests on double-clicks

    setIsLoading(true);
    setStatus('loading');

    try {
      const result = await fetchTotalCustomers();
      setData(result);

      if (result.success) {
        setStatus('online');
      } else if (result.isOffline) {
        setStatus('offline');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Initial fetch on component mount
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTimestamp = (isoString?: string): string => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  return (
    <section aria-labelledby="modul1-integration-title" className="space-y-3 text-left">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-border">
        <div className="flex items-center gap-2">
          <Server className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
          <h2 id="modul1-integration-title" className="text-xs font-semibold uppercase tracking-wider text-muted font-mono">
            [ REST API ADAPTER // MODUL 1 INTEGRATION ]
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {status === 'loading' && (
            <Badge variant="amber" size="sm" dot>
              Querying API...
            </Badge>
          )}
          {status === 'online' && (
            <Badge variant="emerald" size="sm" dot>
              Sales-API Online
            </Badge>
          )}
          {status === 'offline' && (
            <Badge variant="rose" size="sm" dot>
              Sales-API Offline
            </Badge>
          )}
          {status === 'error' && (
            <Badge variant="rose" size="sm" dot>
              Query Error
            </Badge>
          )}
          {status === 'idle' && (
            <Badge variant="neutral" size="sm">
              Idle
            </Badge>
          )}
          <span className="font-mono text-[10px] text-muted-dim hidden sm:inline">
            GET /api/reports/total
          </span>
        </div>
      </div>

      {/* Main Content Card */}
      <Card variant="default" padding="md" className="bg-surface border-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status info & Metrics */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground font-sans">
                Modul 1: Sales-API Telemetry
              </h3>
              <span className="font-mono text-[10px] text-muted px-1.5 py-0.5 rounded bg-background-base border border-border">
                Express + Supabase
              </span>
            </div>

            {/* Dynamic Result State */}
            {status === 'loading' && (
              <div className="flex items-center gap-2 text-xs text-muted py-1">
                <div className="w-3.5 h-3.5 rounded-full border border-accent/20 border-t-accent animate-spin" />
                <span>Connecting to local backend on port 3000...</span>
              </div>
            )}

            {status === 'online' && data && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                <div className="p-2.5 rounded bg-background-base/60 border border-border">
                  <span className="text-[10px] text-muted font-mono uppercase block flex items-center gap-1">
                    <Users className="w-3 h-3 text-accent" />
                    Total Customers
                  </span>
                  <span className="font-mono text-xl font-bold text-foreground tabular-nums">
                    {data.totalCustomers ?? 0}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-background-base/60 border border-border">
                  <span className="text-[10px] text-muted font-mono uppercase block flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted" />
                    Response Latency
                  </span>
                  <span className="font-mono text-sm font-semibold text-accent tabular-nums">
                    ~{data.responseTimeMs} ms
                  </span>
                </div>

                <div className="p-2.5 rounded bg-background-base/60 border border-border col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-muted font-mono uppercase block flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Last Refreshed
                  </span>
                  <span className="font-mono text-xs text-foreground tabular-nums">
                    {formatTimestamp(data.timestamp)}
                  </span>
                </div>
              </div>
            )}

            {status === 'offline' && (
              <div className="p-3 rounded-lg bg-background-base/60 border border-border flex items-start gap-2.5 text-xs text-muted">
                <WifiOff className="w-4 h-4 text-status-danger shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-foreground block">
                    Backend Unreachable (Port 3000)
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    Sales-API is not running locally. Run <code className="font-mono text-accent">npm run dev</code> in the <code className="font-mono text-muted">Praktikum PPB/Mod. 1/Sales-API</code> directory to activate live telemetry.
                  </p>
                </div>
              </div>
            )}

            {status === 'error' && data?.error && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 flex items-start gap-2.5 text-xs text-muted">
                <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-foreground block">
                    API Communication Error
                  </span>
                  <p className="text-[11px] text-danger/90 leading-relaxed font-mono">
                    {data.error}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-border/60 pt-3 md:pt-0 md:pl-4">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
              className="w-full sm:w-auto text-xs"
            >
              {isLoading ? 'Refreshing...' : 'Refresh API'}
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
