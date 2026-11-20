import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
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
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* Page Header */}
      <PageHeader
        title="Security Recommendations & Playbooks"
        description="Curated cybersecurity hardening playbooks, mitigation steps, and defensive best practices aggregated in Supabase PostgreSQL."
        badge={
          <Badge variant="emerald" size="sm" dot>
            Hardening Playbooks
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
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

      {/* Query Controls: Search, Filters & Sorting */}
      <Card variant="default" padding="md" className="space-y-4 bg-surface border-border">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, summary, or category (e.g. 2FA, password manager, wifi)..."
              leftElement={<Search className="w-4 h-4 text-muted" />}
              className="font-mono text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="primary" size="sm" className="font-mono text-xs">
              Search
            </Button>
            {(activeSearch || categoryFilter !== 'all' || priorityFilter !== 'all' || sortBy !== 'created_at' || sortOrder !== 'desc') && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="font-mono text-xs text-muted hover:text-foreground"
              >
                Reset
              </Button>
            )}
          </div>
        </form>

        {/* Filter Pills Bar: Categories & Priorities */}
        <div className="space-y-3 pt-2 border-t border-border/60 text-xs font-mono">
          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3 text-accent" />
              <span>Category:</span>
            </span>
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
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40">
            {/* Priority Filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted mr-1">Priority:</span>
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
            <div className="flex items-center gap-2">
              <span className="text-muted flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-accent" />
                <span>Sort:</span>
              </span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as SortField);
                  setCurrentPage(1);
                }}
                className="bg-background-secondary text-foreground text-xs font-mono rounded px-2 py-1 border border-border focus:outline-none focus:border-accent"
                aria-label="Sort recommendations by"
              >
                <option value="created_at">Date Added</option>
                <option value="priority">Priority</option>
                <option value="title">Title (Alphabetical)</option>
                <option value="category">Category</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-background-secondary border border-border rounded text-[11px] font-mono text-muted hover:text-foreground hover:border-accent/40 transition-colors"
                title={`Switch order (currently ${sortOrder.toUpperCase()})`}
              >
                {sortOrder.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content Area */}
      <div className="space-y-3">
        {/* Telemetry Status Bar */}
        <div className="flex items-center justify-between text-xs font-mono text-muted px-1">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-accent" />
            <span>
              {status === 'loading'
                ? 'SYNCING WITH BACKEND API...'
                : `SHOWING ${recommendations.length} OF ${pagination.totalItems} ACTION PLAYBOOKS`}
            </span>
          </div>
          {pagination.totalPages > 1 && (
            <span>
              PAGE {pagination.page} / {pagination.totalPages}
            </span>
          )}
        </div>

        {/* Loading State */}
        {status === 'loading' && (
          <Card variant="inset" className="text-center py-16 border-border bg-surface">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-7 h-7 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
              <div className="font-mono text-xs text-muted uppercase tracking-wider">
                Querying /api/v1/recommendations telemetry...
              </div>
            </div>
          </Card>
        )}

        {/* Error State */}
        {status === 'error' && (
          <Card variant="default" className="border-status-danger/40 bg-surface p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-status-danger/10 text-status-danger border border-status-danger/20 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">Recommendations Service Unavailable</h3>
                  <p className="text-xs text-muted max-w-xl">
                    {errorMessage || 'Unable to retrieve recommendations from the backend API. Please verify the CredLock server is running on port 4000.'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadRecommendations}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Retry Request
              </Button>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {status === 'success' && recommendations.length === 0 && (
          <Card variant="inset" className="text-center py-12 bg-surface border-border">
            <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
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
          </Card>
        )}

        {/* Recommendations Grid/List */}
        {status === 'success' && recommendations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => (
              <Card
                key={rec.id}
                variant="default"
                isInteractive
                className="group bg-surface border-border hover:border-accent/40 transition-all duration-200 flex flex-col justify-between"
              >
                <Link
                  to={`/recommendations/${rec.slug}`}
                  className="block focus:outline-none p-5 h-full flex flex-col justify-between"
                  aria-label={`Inspect playbook: ${rec.title}`}
                >
                  <div className="space-y-3">
                    {/* Header Badges: Priority & Category */}
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
                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-foreground group-hover:text-accent transition-colors font-sans">
                        {rec.title}
                      </h3>
                      <p className="text-xs text-muted leading-relaxed font-sans line-clamp-3">
                        {rec.summary}
                      </p>
                    </div>

                    {/* Metadata chips */}
                    <div className="space-y-2 pt-1 font-mono text-[11px]">
                      {rec.target_audience && (
                        <div className="flex items-center gap-1.5 text-muted-dim">
                          <Users className="w-3 h-3 text-muted-dim shrink-0" />
                          <span className="truncate">Audience: {rec.target_audience}</span>
                        </div>
                      )}

                      {/* Tags chips */}
                      {rec.tags && rec.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          {rec.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded bg-background-secondary border border-border/50 text-[10px] text-muted-dim"
                            >
                              #{tag}
                            </span>
                          ))}
                          {rec.tags.length > 3 && (
                            <span className="text-[10px] text-muted-dim">+{rec.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Action Steps count preview & Inspect affordance */}
                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-mono">
                    <span className="text-[11px] text-muted flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{Array.isArray(rec.action_steps) ? rec.action_steps.length : 0} Action Steps</span>
                    </span>

                    <div className="flex items-center gap-1 text-accent group-hover:text-accent font-semibold transition-colors">
                      <span className="text-[11px] uppercase tracking-wider">Inspect</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination Navigation Controls */}
        {status === 'success' && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-border/60 font-mono text-xs">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPreviousPage}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>

            <span className="text-muted">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasNextPage}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
