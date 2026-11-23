import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { fetchBreachBySlug } from '@/services/api/breachService';
import { ApiClientError } from '@/services/api/errors';
import type { BreachDetailItem, BreachSeverity } from '@/types';
import {
  ArrowLeft,
  ShieldAlert,
  Building2,
  Globe,
  Calendar,
  Users,
  SearchX,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Tag,
} from 'lucide-react';

export function BreachIncidentDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [breach, setBreach] = useState<BreachDetailItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadBreachDetail = useCallback(async () => {
    if (!slug) return;
    setIsLoading(true);
    setIsNotFound(false);
    setErrorMessage(null);

    try {
      const data = await fetchBreachBySlug(slug);
      setBreach(data);
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.status === 404) {
        setIsNotFound(true);
      } else if (err instanceof ApiClientError) {
        setErrorMessage(err.getUserFriendlyMessage());
      } else {
        setErrorMessage('Failed to connect to the Breach Intelligence service.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadBreachDetail();
  }, [loadBreachDetail]);

  const getSeverityBadgeVariant = (severity: BreachSeverity): 'rose' | 'amber' | 'cyan' | 'neutral' => {
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not disclosed';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-5 animate-in fade-in duration-200 text-left">
        <PageHeader
          title="Loading Incident Detail..."
          description={`Retrieving verified breach telemetry for '${slug || 'incident'}' from backend API.`}
          actions={
            <Link to="/breaches">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                All Breaches
              </Button>
            </Link>
          }
        />
        <div className="text-center py-16 rounded-xl border border-border bg-surface">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-7 h-7 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
            <div className="font-mono text-xs text-muted uppercase tracking-wider">
              Querying /api/v1/breaches/{slug || 'record'}...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not Found State (404)
  if (isNotFound) {
    return (
      <div className="space-y-5 animate-in fade-in duration-200 text-left">
        <PageHeader
          title="Incident Not Found"
          description="The requested cybersecurity breach record does not exist or has not been verified for publication."
          actions={
            <Link to="/breaches">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                All Breaches
              </Button>
            </Link>
          }
        />

        <div className="max-w-md mx-auto text-center py-10 rounded-xl bg-surface border border-border p-6 space-y-3">
          <div className="p-3 rounded-lg bg-surface-elevated text-amber-500 border border-border inline-flex">
            <SearchX className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-foreground font-sans">Incident Record Unavailable</h3>
          <p className="text-xs text-muted leading-relaxed font-sans">
            No verified public breach matches the identifier{' '}
            <code className="font-mono text-foreground font-semibold">"{slug}"</code>.
          </p>
          <div className="pt-1">
            <Link to="/breaches">
              <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Explore Verified Breaches
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error State (Network / Server 500)
  if (errorMessage || !breach) {
    return (
      <div className="space-y-5 animate-in fade-in duration-200 text-left">
        <PageHeader
          title="Telemetry Retrieval Error"
          description="Unable to load the breach incident record due to a communication issue with the backend."
          actions={
            <Link to="/breaches">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                All Breaches
              </Button>
            </Link>
          }
        />

        <div className="rounded-xl border border-danger/40 bg-surface p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-danger/10 text-danger border border-danger/20 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-foreground">Service Connection Error</h3>
                <p className="text-xs text-muted max-w-md">
                  {errorMessage || 'Failed to communicate with the CredLock Security Intelligence API.'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadBreachDetail}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Retry Request
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success State
  return (
    <div className="space-y-5 animate-in fade-in duration-200 text-left">
      {/* Page Header */}
      <PageHeader
        title={breach.title}
        description={
          breach.organization
            ? `Security breach report and telemetry for ${breach.organization}.`
            : 'Verified corporate cybersecurity exposure report.'
        }
        badge={
          <Badge variant={getSeverityBadgeVariant(breach.severity)} size="sm" dot>
            {breach.severity.toUpperCase()} SEVERITY
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/breaches">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                All Breaches
              </Button>
            </Link>
            {breach.source_url && (
              <a
                href={breach.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                  Official Source
                </Button>
              </a>
            )}
          </div>
        }
      />

      {/* Incident Snapshot Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Metric 1: Exposed Accounts */}
        <div className="p-3.5 rounded-xl bg-enclave-plate/90 border border-enclave-border/80 shadow-card-tactical space-y-1">
          <div className="flex items-center justify-between text-muted text-[10px] font-mono uppercase tracking-wider">
            <span>Compromised</span>
            <Users className="w-3.5 h-3.5 text-danger" />
          </div>
          <div className="space-y-0.5">
            <p className="text-lg sm:text-xl font-bold font-mono text-foreground tracking-tight tabular-nums">
              {breach.pwn_count ? breach.pwn_count.toLocaleString() : 'Undisclosed'}
            </p>
            <span className="text-[10px] text-muted-dim font-mono">Reported accounts</span>
          </div>
        </div>

        {/* Metric 2: Incident Severity */}
        <div className="p-3.5 rounded-xl bg-enclave-plate/90 border border-enclave-border/80 shadow-card-tactical space-y-1">
          <div className="flex items-center justify-between text-muted text-[10px] font-mono uppercase tracking-wider">
            <span>Threat Severity</span>
            <AlertTriangle className="w-3.5 h-3.5 text-accent" />
          </div>
          <div className="space-y-0.5">
            <p className="text-lg sm:text-xl font-bold font-mono text-foreground capitalize tracking-tight">
              {breach.severity}
            </p>
            <span className="text-[10px] text-muted-dim font-mono">Assessed threat level</span>
          </div>
        </div>

        {/* Metric 3: Incident Date */}
        <div className="p-3.5 rounded-xl bg-enclave-plate/90 border border-enclave-border/80 shadow-card-tactical space-y-1">
          <div className="flex items-center justify-between text-muted text-[10px] font-mono uppercase tracking-wider">
            <span>Breach Date</span>
            <Calendar className="w-3.5 h-3.5 text-muted-dim" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs sm:text-sm font-bold font-mono text-foreground tracking-tight pt-1">
              {formatDate(breach.breach_date)}
            </p>
            <span className="text-[10px] text-muted-dim font-mono">Incident date</span>
          </div>
        </div>

        {/* Metric 4: Ingestion Date */}
        <div className="p-3 rounded-xl bg-surface border border-border space-y-1">
          <div className="flex items-center justify-between text-muted text-[10px] font-mono uppercase tracking-wider">
            <span>Cataloged</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs sm:text-sm font-bold font-mono text-foreground tracking-tight pt-1">
              {formatDate(breach.added_date)}
            </p>
            <span className="text-[10px] text-muted-dim font-mono">Intelligence ingested</span>
          </div>
        </div>
      </div>

      {/* Main Narrative & Incident Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Narrative Description (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-xl bg-surface border border-border p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between pb-2.5 border-b border-border/50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-muted font-semibold">
                  Incident Narrative & Analysis
                </h3>
              </div>
              <Badge variant="emerald" size="sm">Verified</Badge>
            </div>

            <div className="prose prose-invert max-w-none text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans space-y-3">
              <p>{breach.description}</p>
            </div>
          </div>

          {/* Affected Data Classes */}
          {breach.data_classes && breach.data_classes.length > 0 && (
            <div className="rounded-xl bg-surface border border-border p-4 space-y-2.5 shadow-sm">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <Tag className="w-3.5 h-3.5 text-accent" />
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
                  Compromised Data Attributes ({breach.data_classes.length})
                </h3>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {breach.data_classes.map((cls) => (
                  <span
                    key={cls}
                    className="px-2 py-0.5 rounded bg-background-base border border-border text-[11px] font-mono text-foreground flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
                    {cls}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Organization & Technical Telemetry (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl bg-surface border border-border p-4 space-y-3.5 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <Building2 className="w-3.5 h-3.5 text-accent" />
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
                Entity Profile
              </h3>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div>
                <span className="text-[10px] text-muted-dim uppercase tracking-wider block">Target Entity</span>
                <span className="text-foreground font-semibold text-sm">
                  {breach.organization || 'Independent Dataset'}
                </span>
              </div>

              {breach.domain && (
                <div>
                  <span className="text-[10px] text-muted-dim uppercase tracking-wider block">Associated Domain</span>
                  <div className="flex items-center gap-1 text-accent pt-0.5">
                    <Globe className="w-3.5 h-3.5" />
                    <span className="truncate">{breach.domain}</span>
                  </div>
                </div>
              )}

              <div>
                <span className="text-[10px] text-muted-dim uppercase tracking-wider block">Database Slug</span>
                <code className="text-foreground/80 text-[11px]">{breach.slug}</code>
              </div>

              <div>
                <span className="text-[10px] text-muted-dim uppercase tracking-wider block">Telemetry Identifier</span>
                <code className="text-muted text-[10px] break-all">{breach.id}</code>
              </div>

              {breach.source_url && (
                <div className="pt-2 border-t border-border/50">
                  <a
                    href={breach.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline flex items-center gap-1"
                  >
                    <span>View Official Security Advisory</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
