import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
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
  Check,
} from 'lucide-react';

export function RecommendationDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [recommendation, setRecommendation] = useState<RecommendationDetailItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

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
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
      case 'device':
        return <Smartphone className="w-3.5 h-3.5 text-accent" />;
      case 'network':
        return <Wifi className="w-3.5 h-3.5 text-amber-400" />;
      case 'incident_response':
        return <AlertTriangle className="w-3.5 h-3.5 text-danger" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-muted" />;
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-5 animate-in fade-in duration-200 text-left">
        <PageHeader
          title="Loading Playbook Detail..."
          description={`Retrieving verified recommendation guidance for '${slug || 'playbook'}' from backend API.`}
          actions={
            <Link to="/recommendations">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                All Playbooks
              </Button>
            </Link>
          }
        />
        <div className="text-center py-16 rounded-xl border border-border bg-surface">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-7 h-7 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
            <div className="font-mono text-xs text-muted uppercase tracking-wider">
              Querying /api/v1/recommendations/{slug || 'record'}...
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
          title="Playbook Not Found"
          description="The requested security playbook record does not exist or has not been published."
          actions={
            <Link to="/recommendations">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                All Playbooks
              </Button>
            </Link>
          }
        />

        <div className="max-w-md mx-auto text-center py-10 rounded-xl bg-surface border border-border p-6 space-y-3">
          <div className="p-3 rounded-lg bg-surface-elevated text-amber-500 border border-border inline-flex">
            <SearchX className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-foreground font-sans">Playbook Record Unavailable</h3>
          <p className="text-xs text-muted leading-relaxed font-sans">
            No published recommendation matches the slug identifier{' '}
            <code className="font-mono text-foreground font-semibold">"{slug}"</code>.
          </p>
          <div className="pt-1">
            <Link to="/recommendations">
              <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Explore Published Playbooks
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error State (Network / 500)
  if (errorMessage || !recommendation) {
    return (
      <div className="space-y-5 animate-in fade-in duration-200 text-left">
        <PageHeader
          title="Playbook Retrieval Error"
          description="Unable to load the security recommendation record due to a communication issue with the backend."
          actions={
            <Link to="/recommendations">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                All Playbooks
              </Button>
            </Link>
          }
        />

        <div className="rounded-xl border border-danger/40 bg-surface p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-danger/10 text-danger border border-danger/20 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
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
        </div>
      </div>
    );
  }

  // Parse action_steps as string array safely
  const actionSteps: string[] = Array.isArray(recommendation.action_steps)
    ? recommendation.action_steps.map((s) => String(s))
    : [];

  return (
    <div className="space-y-5 animate-in fade-in duration-200 text-left">
      {/* Page Header */}
      <PageHeader
        title={recommendation.title}
        description={`Hardening playbook for category: ${formatCategoryLabel(recommendation.category)}.`}
        badge={
          <Badge variant={getPriorityBadgeVariant(recommendation.priority)} size="sm" dot>
            {recommendation.priority.toUpperCase()} PRIORITY
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/recommendations">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                All Playbooks
              </Button>
            </Link>
          </div>
        }
      />

      {/* Primary Metrics Snapshot Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Metric 1: Priority */}
        <div className="p-3.5 rounded-xl bg-enclave-plate/90 border border-enclave-border/80 shadow-card-tactical space-y-1">
          <div className="flex items-center justify-between text-muted text-[10px] font-mono uppercase tracking-wider">
            <span>Priority Level</span>
            <AlertTriangle className="w-3.5 h-3.5 text-accent" />
          </div>
          <div className="space-y-0.5">
            <p className="text-lg sm:text-xl font-bold font-mono text-foreground capitalize tracking-tight">
              {recommendation.priority}
            </p>
            <span className="text-[10px] text-muted-dim font-mono">Defense urgency</span>
          </div>
        </div>

        {/* Metric 2: Category */}
        <div className="p-3.5 rounded-xl bg-enclave-plate/90 border border-enclave-border/80 shadow-card-tactical space-y-1">
          <div className="flex items-center justify-between text-muted text-[10px] font-mono uppercase tracking-wider">
            <span>Category</span>
            {getCategoryIcon(recommendation.category)}
          </div>
          <div className="space-y-0.5">
            <p className="text-sm sm:text-base font-bold font-mono text-foreground tracking-tight pt-0.5">
              {formatCategoryLabel(recommendation.category)}
            </p>
            <span className="text-[10px] text-muted-dim font-mono">Domain vector</span>
          </div>
        </div>

        {/* Metric 3: Action Steps Count */}
        <div className="p-3 rounded-xl bg-surface border border-border space-y-1">
          <div className="flex items-center justify-between text-muted text-[10px] font-mono uppercase tracking-wider">
            <span>Checklist</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="space-y-0.5">
            <p className="text-lg sm:text-xl font-bold font-mono text-foreground tracking-tight">
              {completedSteps.size} / {actionSteps.length}
            </p>
            <span className="text-[10px] text-muted-dim font-mono">Steps completed</span>
          </div>
        </div>

        {/* Metric 4: Target Audience */}
        <div className="p-3 rounded-xl bg-surface border border-border space-y-1">
          <div className="flex items-center justify-between text-muted text-[10px] font-mono uppercase tracking-wider">
            <span>Target Scope</span>
            <Users className="w-3.5 h-3.5 text-accent" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs sm:text-sm font-semibold text-foreground tracking-tight pt-1 truncate">
              {recommendation.target_audience || 'All users'}
            </p>
            <span className="text-[10px] text-muted-dim font-mono">Audience scope</span>
          </div>
        </div>
      </div>

      {/* Main Narrative & Action Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Summary & Step-by-Step Action Checklist (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Executive Summary */}
          <div className="rounded-xl bg-surface border border-border p-5 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-muted font-semibold">
                  Executive Briefing & Threat Context
                </h3>
              </div>
              <Badge variant="emerald" size="sm">Published</Badge>
            </div>

            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans">
              {recommendation.summary}
            </p>
          </div>

          {/* Interactive Step-by-Step Action Checklist */}
          <div className="rounded-xl bg-surface border border-border p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between pb-2.5 border-b border-border/50">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-muted font-semibold">
                  Hardening Implementation Steps ({actionSteps.length})
                </h3>
              </div>
              <span className="text-[11px] font-mono text-muted">
                {completedSteps.size === actionSteps.length && actionSteps.length > 0 ? (
                  <span className="text-emerald-400 font-semibold">All Done!</span>
                ) : (
                  <span>Click step to check off</span>
                )}
              </span>
            </div>

            <div className="space-y-2">
              {actionSteps.length > 0 ? (
                actionSteps.map((step, idx) => {
                  const isDone = completedSteps.has(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleStep(idx)}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${
                        isDone
                          ? 'bg-emerald-500/5 border-emerald-500/30'
                          : 'bg-background-base/60 border-border/60 hover:border-accent/30'
                      }`}
                      role="checkbox"
                      aria-checked={isDone}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          toggleStep(idx);
                        }
                      }}
                    >
                      {/* Checkbox circle */}
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 transition-colors ${
                          isDone
                            ? 'border-emerald-500 bg-emerald-500 text-background-base'
                            : 'border-border bg-surface text-muted-dim'
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                      </div>

                      <div className="space-y-0.5 flex-1">
                        <p
                          className={`text-xs sm:text-sm font-sans leading-relaxed transition-colors ${
                            isDone ? 'line-through text-muted' : 'text-foreground font-medium'
                          }`}
                        >
                          {step}
                        </p>
                        <span className="text-[10px] font-mono text-muted-dim block">
                          Step 0{idx + 1} {isDone && '• Completed'}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted font-mono py-2">
                  No individual action steps specified for this recommendation.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Taxonomy, Metadata & Tags (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl bg-surface border border-border p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
                Playbook Metadata
              </h3>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div>
                <span className="text-[10px] text-muted-dim uppercase tracking-wider block">Category Vector</span>
                <span className="text-foreground font-semibold text-sm">
                  {formatCategoryLabel(recommendation.category)}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-dim uppercase tracking-wider block">Urgency Level</span>
                <Badge variant={getPriorityBadgeVariant(recommendation.priority)} size="sm">
                  {recommendation.priority.toUpperCase()}
                </Badge>
              </div>

              {recommendation.target_audience && (
                <div>
                  <span className="text-[10px] text-muted-dim uppercase tracking-wider block">Scope</span>
                  <span className="text-foreground text-xs font-sans">
                    {recommendation.target_audience}
                  </span>
                </div>
              )}

              <div>
                <span className="text-[10px] text-muted-dim uppercase tracking-wider block">Database Slug</span>
                <code className="text-foreground/80 text-[11px] break-all">{recommendation.slug}</code>
              </div>

              <div>
                <span className="text-[10px] text-muted-dim uppercase tracking-wider block">Record Identifier</span>
                <code className="text-muted text-[10px] break-all">{recommendation.id}</code>
              </div>

              {/* Tags Section */}
              {recommendation.tags && recommendation.tags.length > 0 && (
                <div className="pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1.5 pb-1.5">
                    <Tag className="w-3 h-3 text-accent" />
                    <span className="text-[10px] text-muted-dim uppercase tracking-wider font-semibold">
                      Associated Tags
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {recommendation.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded bg-background-base border border-border text-[10px] font-mono text-muted"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
