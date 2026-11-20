import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { fetchRecommendations } from '@/services/api/recommendationService';
import { ApiClientError } from '@/services/api/errors';
import type {
  RecommendationListItem,
  RecommendationCategory,
  RecommendationPriority,
  RecommendationFetchStatus,
  ApiPaginationMeta,
} from '@/types';
import {
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Database,
  SearchX,
  CheckCircle2,
  Lock,
  Smartphone,
  Wifi,
  AlertTriangle,
  Users,
} from 'lucide-react';

type SortField = 'title' | 'category' | 'priority' | 'created_at';
type SortOrder = 'asc' | 'desc';

export function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<RecommendationListItem[]>([]);
  const [pagination, setPagination] = useState<ApiPaginationMeta>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [status, setStatus] = useState<RecommendationFetchStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<RecommendationCategory | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<RecommendationPriority | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const loadRecommendations = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const result = await fetchRecommendations({
        page: currentPage,
        limit: 10,
        search: activeSearch || undefined,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        priority: priorityFilter === 'all' ? undefined : priorityFilter,
        sort: sortBy,
        order: sortOrder,
      });

      setRecommendations(result.data);
      setPagination(result.pagination);
      setStatus('success');
    } catch (err: unknown) {
      setStatus('error');
      if (err instanceof ApiClientError) {
        setErrorMessage(err.getUserFriendlyMessage());
      } else {
        setErrorMessage('Failed to connect to the Security Recommendations API service.');
      }
    }
  }, [currentPage, activeSearch, categoryFilter, priorityFilter, sortBy, sortOrder]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setActiveSearch(searchTerm.trim());
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setActiveSearch('');
    setCategoryFilter('all');
    setPriorityFilter('all');
    setSortBy('created_at');
    setSortOrder('desc');
    setCurrentPage(1);
  };

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

  const formatCategoryLabel = (category: string) => {
    return category
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200 text-left">
      {/* Page Header */}
      <PageHeader
        title="Security Recommendations & Playbooks"
        description="Curated cybersecurity hardening playbooks, mitigation steps, and defensive best practices."
        badge={
          <Badge variant="emerald" size="sm" dot>
            Hardening Playbooks
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Dashboard
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={loadRecommendations}
              disabled={status === 'loading'}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${status === 'loading' ? 'animate-spin' : ''}`} />}
            >
              Sync
            </Button>
          </div>
        }
      />

      {/* Query Controls: Consolidated Search, Categories & Priorities */}
      <div className="p-3.5 rounded-xl bg-surface border border-border shadow-sm space-y-3">
        {/* Search & Action Bar */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search playbooks by title, summary, or category (e.g. 2FA, password, wifi)..."
              leftElement={<Search className="w-4 h-4 text-muted" />}
              className="font-mono text-xs h-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="primary" size="sm" className="font-mono text-xs h-9">
              Search
            </Button>
            {(activeSearch || categoryFilter !== 'all' || priorityFilter !== 'all' || sortBy !== 'created_at' || sortOrder !== 'desc') && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="font-mono text-xs h-9 text-muted hover:text-foreground"
              >
                Reset
              </Button>
            )}
          </div>
        </form>

        {/* Compact Category & Priority Pills Bar */}
        <div className="space-y-2 pt-2 border-t border-border/50 text-xs font-mono">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-muted-dim text-[11px] mr-1 hidden sm:inline">Category:</span>
            {(['all', 'password', 'auth', 'device', 'network', 'incident_response'] as const).map((cat) => {
              const isActive = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategoryFilter(cat);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                    isActive
                      ? 'bg-accent/20 text-accent border border-accent/40 font-semibold'
                      : 'text-muted hover:text-foreground hover:bg-surface-elevated border border-transparent'
                  }`}
                >
                  {cat === 'all' ? 'All Categories' : formatCategoryLabel(cat)}
                </button>
              );
            })}
          </div>

          {/* Priority & Sorting Row */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1.5 border-t border-border/40">
            {/* Priority Filter */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-muted-dim text-[11px] mr-1 hidden sm:inline">Priority:</span>
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map((prio) => {
                const isActive = priorityFilter === prio;
                return (
                  <button
                    key={prio}
                    type="button"
                    onClick={() => {
                      setPriorityFilter(prio);
                      setCurrentPage(1);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] capitalize transition-colors ${
                      isActive
                        ? 'bg-accent/20 text-accent border border-accent/40 font-semibold'
                        : 'text-muted hover:text-foreground hover:bg-surface-elevated border border-transparent'
                    }`}
                  >
                    {prio}
                  </button>
                );
              })}
            </div>

            {/* Sorter Selector */}
            <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
              <span className="text-muted-dim text-[11px] hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as SortField);
                  setCurrentPage(1);
                }}
                className="bg-background-base text-foreground text-xs font-mono rounded px-2 py-0.5 border border-border focus:outline-none focus:border-accent"
                aria-label="Sort recommendations by"
              >
                <option value="created_at">Date Added</option>
                <option value="priority">Priority</option>
                <option value="title">Title (A-Z)</option>
                <option value="category">Category</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                  setCurrentPage(1);
                }}
                className="px-1.5 py-0.5 bg-background-base border border-border rounded text-[10px] font-mono text-muted hover:text-foreground hover:border-accent/40 transition-colors"
                title={`Switch order (currently ${sortOrder.toUpperCase()})`}
              >
                {sortOrder.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-3">
        {/* Status Bar */}
        <div className="flex items-center justify-between text-xs font-mono text-muted px-1">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-accent" />
            <span className="text-[11px]">
              {status === 'loading'
                ? 'SYNCING HARDENING PLAYBOOKS...'
                : `SHOWING ${recommendations.length} OF ${pagination.totalItems} ACTIONABLE PLAYBOOKS`}
            </span>
          </div>
          {pagination.totalPages > 1 && (
            <span className="text-[11px]">
              PAGE {pagination.page} / {pagination.totalPages}
            </span>
          )}
        </div>

        {/* Loading State */}
        {status === 'loading' && (
          <div className="text-center py-16 rounded-xl border border-border bg-surface">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-7 h-7 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
              <div className="font-mono text-xs text-muted uppercase tracking-wider">
                Retrieving hardening recommendations...
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="rounded-xl border border-danger/40 bg-surface p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-danger/10 text-danger border border-danger/20 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">Playbooks Service Unavailable</h3>
                  <p className="text-xs text-muted max-w-xl">
                    {errorMessage || 'Unable to retrieve recommendations from the backend API.'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadRecommendations}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {status === 'success' && recommendations.length === 0 && (
          <div className="text-center py-12 rounded-xl bg-surface border border-border">
            <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto p-4">
              <div className="p-3 rounded-lg bg-surface-elevated text-muted border border-border">
                <SearchX className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground font-sans">No Playbooks Found</h3>
              <p className="text-xs text-muted leading-relaxed font-sans">
                {activeSearch || categoryFilter !== 'all' || priorityFilter !== 'all'
                  ? 'No published recommendations match your current filter and search parameters. Try adjusting or clearing your criteria.'
                  : 'No recommendation playbooks are currently published in the database.'}
              </p>
              {(activeSearch || categoryFilter !== 'all' || priorityFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="font-mono text-xs mt-2"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Recommendations Actionable Ledger (Desktop & Mobile) */}
        {status === 'success' && recommendations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="group rounded-xl border border-border bg-surface hover:border-accent/40 transition-all duration-200 flex flex-col justify-between shadow-sm p-4"
              >
                <Link
                  to={`/recommendations/${rec.slug}`}
                  className="block focus:outline-none h-full flex flex-col justify-between space-y-3"
                  aria-label={`Inspect playbook: ${rec.title}`}
                >
                  <div className="space-y-2.5">
                    {/* Header: Priority & Category */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {getCategoryIcon(rec.category)}
                        <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold">
                          {formatCategoryLabel(rec.category)}
                        </span>
                      </div>
                      <Badge variant={getPriorityBadgeVariant(rec.priority)} size="sm">
                        {rec.priority.toUpperCase()}
                      </Badge>
                    </div>

                    {/* Title & Summary */}
                    <div className="space-y-1">
                      <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-accent transition-colors font-sans leading-snug">
                        {rec.title}
                      </h3>
                      <p className="text-xs text-muted leading-relaxed font-sans line-clamp-2">
                        {rec.summary}
                      </p>
                    </div>

                    {/* Metadata chips */}
                    {rec.target_audience && (
                      <div className="flex items-center gap-1.5 text-muted-dim text-[11px] font-mono">
                        <Users className="w-3 h-3 text-muted-dim shrink-0" />
                        <span className="truncate">Scope: {rec.target_audience}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Action steps & Inspect CTA */}
                  <div className="pt-2.5 border-t border-border/50 flex items-center justify-between text-xs font-mono">
                    <span className="text-[11px] text-muted flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{Array.isArray(rec.action_steps) ? rec.action_steps.length : 0} Steps</span>
                    </span>

                    <div className="flex items-center gap-1 text-accent font-semibold text-[11px] uppercase tracking-wider">
                      <span>View Playbook</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Navigation Controls */}
        {status === 'success' && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-border/50 font-mono text-xs">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPreviousPage}
              leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Previous
            </Button>

            <span className="text-muted text-[11px]">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasNextPage}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
