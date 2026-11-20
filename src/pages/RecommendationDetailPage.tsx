import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { fetchRecommendationBySlug } from '@/services/api/recommendationService';
import { ApiClientError } from '@/services/api/errors';
import type { RecommendationDetailItem, RecommendationPriority, RecommendationCategory } from '@/types';
import {
  ArrowLeft,
  ShieldCheck,
  SearchX,
  RefreshCw,
  AlertTriangle,
  FileText,
  Tag,
  CheckCircle2,
  Lock,
  Smartphone,
  Wifi,
  Users,
  ListOrdered,
} from 'lucide-react';

export function RecommendationDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [recommendation, setRecommendation] = useState<RecommendationDetailItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRecommendationDetail = useCallback(async () => {
    if (!slug) return;
    setIsLoading(true);
    setIsNotFound(false);
    setErrorMessage(null);

    try {
      const data = await fetchRecommendationBySlug(slug);
      setRecommendation(data);
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.status === 404) {
        setIsNotFound(true);
      } else if (err instanceof ApiClientError) {
        setErrorMessage(err.getUserFriendlyMessage());
      } else {
        setErrorMessage('Failed to connect to the Security Recommendations service.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadRecommendationDetail();
  }, [loadRecommendationDetail]);

  const getPriorityBadgeVariant = (priority: RecommendationPriority): 'rose' | 'amber' | 'cyan' | 'emerald' => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'rose';
      case 'high':
        return 'amber';
      case 'medium':
        return 'cyan';
      default:
        return 'emerald';
    }
  };

  const formatCategoryLabel = (category: string) => {
    return category
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const getCategoryIcon = (category: RecommendationCategory) => {
    switch (category) {
      case 'password':
        return <Lock className="w-3.5 h-3.5 text-accent" />;
      case 'auth':
        return <ShieldCheck className="w-3.5 h-3.5 text-status-success" />;
      case 'device':
        return <Smartphone className="w-3.5 h-3.5 text-status-info" />;
      case 'network':
        return <Wifi className="w-3.5 h-3.5 text-status-warning" />;
      case 'incident_response':
        return <AlertTriangle className="w-3.5 h-3.5 text-status-danger" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-muted" />;
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200 text-left">
        <PageHeader
          title="Loading Playbook Detail..."
          description={`Retrieving verified recommendation guidance for '${slug || 'playbook'}' from backend API.`}
          actions={
            <Link to="/recommendations">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Playbooks
              </Button>
            </Link>
          }
        />
        <Card variant="inset" className="text-center py-16 border-border bg-surface">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
            <div className="font-mono text-xs text-muted uppercase tracking-wider">
              Querying /api/v1/recommendations/{slug || 'record'}...
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
          title="Recommendation Playbook Not Found"
          description="The requested security playbook record does not exist or has not been published."
          actions={
            <Link to="/recommendations">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Playbooks
              </Button>
            </Link>
          }
        />

        <Card className="max-w-lg mx-auto text-center py-10 bg-surface border-border">
          <div className="flex flex-col items-center justify-center p-6 space-y-3">
            <div className="p-3.5 rounded-lg bg-surface-elevated text-amber-500 border border-border">
              <SearchX className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-foreground">Playbook Record Unavailable</h3>
            <p className="text-xs text-muted max-w-sm leading-relaxed font-sans">
              No published recommendation matches the slug identifier{' '}
              <code className="font-mono text-foreground font-semibold">"{slug}"</code>.
              It may be unpublished or the link may be outdated.
            </p>
            <div className="pt-2">
              <Link to="/recommendations">
                <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Explore Published Playbooks
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Error State (Network / 500)
  if (errorMessage || !recommendation) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200 text-left">
        <PageHeader
          title="Playbook Retrieval Error"
          description="Unable to load the security recommendation record due to a communication issue with the backend."
          actions={
            <Link to="/recommendations">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Playbooks
              </Button>
            </Link>
          }
        />

        <Card variant="default" className="border-status-danger/40 bg-surface p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-status-danger/10 text-status-danger border border-status-danger/20 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Service Connection Error</h3>
                <p className="text-xs text-muted max-w-md">
                  {errorMessage || 'Failed to communicate with the CredLock Security Recommendations API.'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadRecommendationDetail}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Retry Request
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Parse action_steps as string array safely
  const actionSteps: string[] = Array.isArray(recommendation.action_steps)
    ? recommendation.action_steps.map((s) => String(s))
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* Page Header */}
      <PageHeader
        title={recommendation.title}
        description={`Cybersecurity hardening playbook for category: ${formatCategoryLabel(recommendation.category)}.`}
        badge={
          <Badge variant={getPriorityBadgeVariant(recommendation.priority)} size="sm" dot>
            {recommendation.priority.toUpperCase()} PRIORITY
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/recommendations">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                All Playbooks
              </Button>
            </Link>
          </div>
        }
      />

      {/* Primary Metrics/Metadata Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Priority */}
        <Card variant="default" padding="sm" className="space-y-1.5 bg-surface border-border">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Priority Level</span>
            <AlertTriangle className="w-3.5 h-3.5 text-accent" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xl sm:text-2xl font-bold font-mono text-foreground capitalize tracking-tight">
              {recommendation.priority}
            </p>
            <span className="text-[10px] text-muted-dim font-mono">Defense urgency</span>
          </div>
        </Card>

        {/* Metric 2: Category */}
        <Card variant="default" padding="sm" className="space-y-1.5 bg-surface border-border">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Category</span>
            {getCategoryIcon(recommendation.category)}
          </div>
          <div className="space-y-0.5">
            <p className="text-base sm:text-lg font-bold font-mono text-foreground tracking-tight pt-0.5">
              {formatCategoryLabel(recommendation.category)}
            </p>
            <span className="text-[10px] text-muted-dim font-mono">Domain vector</span>
          </div>
        </Card>

        {/* Metric 3: Action Steps Count */}
        <Card variant="default" padding="sm" className="space-y-1.5 bg-surface border-border">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Action Steps</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xl sm:text-2xl font-bold font-mono text-foreground tracking-tight">
              {actionSteps.length} Steps
            </p>
            <span className="text-[10px] text-muted-dim font-mono">Execution plan</span>
          </div>
        </Card>

        {/* Metric 4: Target Audience */}
        <Card variant="default" padding="sm" className="space-y-1.5 bg-surface border-border">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Target Scope</span>
            <Users className="w-3.5 h-3.5 text-status-info" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs sm:text-sm font-semibold text-foreground tracking-tight pt-1 truncate">
              {recommendation.target_audience || 'All users'}
            </p>
            <span className="text-[10px] text-muted-dim font-mono">Audience scope</span>
          </div>
        </Card>
      </div>

      {/* Main Narrative & Action Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Summary & Step-by-Step Action Plan (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Executive Summary */}
          <Card variant="default" padding="lg" className="bg-surface border-border space-y-4">
            <CardHeader className="px-0 pt-0 pb-2 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent" />
                  <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted">
                    EXECUTIVE BRIEFING & RATIONALE
                  </CardTitle>
                </div>
                <span className="font-mono text-[10px] text-muted uppercase">PUBLISHED</span>
              </div>
            </CardHeader>

            <CardContent className="px-0 pb-0">
              <p className="text-sm text-foreground/90 leading-relaxed font-sans">
                {recommendation.summary}
              </p>
            </CardContent>
          </Card>

          {/* Structured Step-by-Step Action Plan */}
          <Card variant="default" padding="lg" className="bg-surface border-border space-y-4">
            <CardHeader className="px-0 pt-0 pb-2 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-status-success" />
                  <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted">
                    HARDENING IMPLEMENTATION STEPS ({actionSteps.length})
                  </CardTitle>
                </div>
                <span className="font-mono text-[10px] text-muted-dim">CHECKLIST</span>
              </div>
            </CardHeader>

            <CardContent className="px-0 pb-0 space-y-3">
              {actionSteps.length > 0 ? (
                actionSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3.5 p-3.5 rounded-lg bg-background-secondary border border-border/60 transition-colors hover:border-accent/30"
                  >
                    <div className="w-6 h-6 rounded-full bg-accent/15 text-accent border border-accent/30 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <p className="text-sm text-foreground font-medium font-sans leading-relaxed">
                        {step}
                      </p>
                      <span className="text-[10px] font-mono text-muted-dim block">
                        Action Step 0{idx + 1}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted font-mono py-2">
                  No individual action steps specified for this recommendation.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Taxonomy, Metadata & Tags (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card variant="default" padding="md" className="bg-surface border-border space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-foreground">
                Playbook Metadata
              </h3>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <span className="text-[11px] text-muted uppercase tracking-wider block">Category Vector</span>
                <span className="text-foreground font-semibold text-sm">
                  {formatCategoryLabel(recommendation.category)}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-muted uppercase tracking-wider block">Urgency Level</span>
                <Badge variant={getPriorityBadgeVariant(recommendation.priority)} size="sm">
                  {recommendation.priority.toUpperCase()}
                </Badge>
              </div>

              {recommendation.target_audience && (
                <div>
                  <span className="text-[11px] text-muted uppercase tracking-wider block">Recommended Audience</span>
                  <span className="text-foreground-dim text-xs font-sans">
                    {recommendation.target_audience}
                  </span>
                </div>
              )}

              <div>
                <span className="text-[11px] text-muted uppercase tracking-wider block">Database Slug</span>
                <code className="text-foreground-dim text-[11px] break-all">{recommendation.slug}</code>
              </div>

              <div>
                <span className="text-[11px] text-muted uppercase tracking-wider block">Record Identifier</span>
                <code className="text-foreground-dim text-[10px] break-all">{recommendation.id}</code>
              </div>

              {/* Tags Section */}
              {recommendation.tags && recommendation.tags.length > 0 && (
                <div className="pt-2 border-t border-border/60">
                  <div className="flex items-center gap-1.5 pb-2">
                    <Tag className="w-3 h-3 text-accent" />
                    <span className="text-[11px] text-muted uppercase tracking-wider font-semibold">
                      Associated Tags
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recommendation.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded bg-background-secondary border border-border text-[11px] font-mono text-muted"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
