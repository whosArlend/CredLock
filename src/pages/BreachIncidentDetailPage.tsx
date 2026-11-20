import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
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
      <div className="space-y-6 animate-in fade-in duration-200 text-left">
        <PageHeader
          title="Loading Incident Detail..."
          description={`Retrieving verified breach telemetry for '${slug || 'incident'}' from backend API.`}
          actions={
            <Link to="/breaches">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Breaches
              </Button>
            </Link>
          }
        />
        <Card variant="inset" className="text-center py-16 border-border bg-surface">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
            <div className="font-mono text-xs text-muted uppercase tracking-wider">
              Querying /api/v1/breaches/{slug || 'record'}...
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Not Found State (404)
  if (isNotFound) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200 text-left">
        <PageHeader
          title="Breach Incident Not Found"
          description="The requested cybersecurity breach record does not exist or has not been verified for publication."
          actions={
            <Link to="/breaches">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Breaches
              </Button>
            </Link>
          }
        />

        <Card className="max-w-lg mx-auto text-center py-10 bg-surface border-border">
          <div className="flex flex-col items-center justify-center p-6 space-y-3">
            <div className="p-3.5 rounded-lg bg-surface-elevated text-amber-500 border border-border">
              <SearchX className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-foreground">Incident Record Unavailable</h3>
            <p className="text-xs text-muted max-w-sm leading-relaxed">
              No verified public breach matches the identifier{' '}
              <code className="font-mono text-foreground font-semibold">"{slug}"</code>.
              It may be unpublished or the URL may be incorrect.
            </p>
            <div className="pt-2">
              <Link to="/breaches">
                <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Explore Verified Breaches
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Error State (Network / Server 500)
  if (errorMessage || !breach) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200 text-left">
        <PageHeader
          title="Telemetry Retrieval Error"
          description="Unable to load the breach incident record due to a communication issue with the backend."
          actions={
            <Link to="/breaches">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Breaches
              </Button>
            </Link>
          }
        />

        <Card variant="default" className="border-status-danger/40 bg-surface p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-status-danger/10 text-status-danger border border-status-danger/20 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
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
        </Card>
      </div>
    );
  }

  // Success State
  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
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
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
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
                  External Source
                </Button>
              </a>
            )}
          </div>
        }
      />

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Exposed Accounts */}
        <Card variant="default" padding="sm" className="space-y-1.5 bg-surface border-border">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Compromised</span>
            <Users className="w-3.5 h-3.5 text-status-danger" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xl sm:text-2xl font-bold font-mono text-foreground tracking-tight">
              {breach.pwn_count ? breach.pwn_count.toLocaleString() : 'Undisclosed'}
            </p>
            <span className="text-[10px] text-muted-dim font-mono">Reported accounts</span>
          </div>
        </Card>

        {/* Metric 2: Incident Severity */}
        <Card variant="default" padding="sm" className="space-y-1.5 bg-surface border-border">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Severity</span>
            <AlertTriangle className="w-3.5 h-3.5 text-accent" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xl sm:text-2xl font-bold font-mono text-foreground capitalize tracking-tight">
              {breach.severity}
            </p>
            <span className="text-[10px] text-muted-dim font-mono">Threat assessment</span>
          </div>
        </Card>

        {/* Metric 3: Incident Date */}
        <Card variant="default" padding="sm" className="space-y-1.5 bg-surface border-border">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Breach Date</span>
            <Calendar className="w-3.5 h-3.5 text-muted-dim" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm sm:text-base font-bold font-mono text-foreground tracking-tight pt-1">
              {formatDate(breach.breach_date)}
            </p>
            <span className="text-[10px] text-muted-dim font-mono">Original incident</span>
          </div>
        </Card>

        {/* Metric 4: Ingestion Date */}
        <Card variant="default" padding="sm" className="space-y-1.5 bg-surface border-border">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Cataloged</span>
            <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm sm:text-base font-bold font-mono text-foreground tracking-tight pt-1">
              {formatDate(breach.added_date)}
            </p>
            <span className="text-[10px] text-muted-dim font-mono">Intelligence database</span>
          </div>
        </Card>
      </div>

      {/* Main Narrative & Incident Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Narrative Description (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <Card variant="default" padding="lg" className="bg-surface border-border space-y-4">
            <CardHeader className="px-0 pt-0 pb-2 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent" />
                  <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted">
                    INCIDENT DESCRIPTION & AUDIT NARRATIVE
                  </CardTitle>
                </div>
                <span className="font-mono text-[10px] text-muted uppercase">VERIFIED</span>
              </div>
            </CardHeader>

            <CardContent className="px-0 pb-0">
              <div className="prose prose-invert max-w-none text-sm text-foreground/90 leading-relaxed font-sans space-y-3">
                <p>{breach.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Affected Data Classes */}
          {breach.data_classes && breach.data_classes.length > 0 && (
            <Card variant="default" padding="md" className="bg-surface border-border space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <Tag className="w-3.5 h-3.5 text-accent" />
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-foreground">
                  Compromised Data Classes ({breach.data_classes.length})
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {breach.data_classes.map((cls) => (
                  <span
                    key={cls}
                    className="px-2.5 py-1 rounded bg-background-secondary border border-border text-xs font-mono text-foreground flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
                    {cls}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Organization & Technical Telemetry (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card variant="default" padding="md" className="bg-surface border-border space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <Building2 className="w-3.5 h-3.5 text-accent" />
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-foreground">
                Entity Metadata
              </h3>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <span className="text-[11px] text-muted uppercase tracking-wider block">Target Entity</span>
                <span className="text-foreground font-semibold text-sm">
                  {breach.organization || 'Independent Dataset'}
                </span>
              </div>

              {breach.domain && (
                <div>
                  <span className="text-[11px] text-muted uppercase tracking-wider block">Domain</span>
                  <div className="flex items-center gap-1 text-accent pt-0.5">
                    <Globe className="w-3.5 h-3.5" />
                    <span>{breach.domain}</span>
                  </div>
                </div>
              )}

              <div>
                <span className="text-[11px] text-muted uppercase tracking-wider block">Database Slug</span>
                <code className="text-foreground-dim text-[11px]">{breach.slug}</code>
              </div>

              <div>
                <span className="text-[11px] text-muted uppercase tracking-wider block">Audit Record ID</span>
                <code className="text-foreground-dim text-[10px] break-all">{breach.id}</code>
              </div>

              {breach.source_url && (
                <div className="pt-2 border-t border-border/60">
                  <a
                    href={breach.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline flex items-center gap-1"
                  >
                    <span>View Official Advisory</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
