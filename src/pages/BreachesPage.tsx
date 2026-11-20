import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { fetchBreaches } from '@/services/api/breachService';
import { ApiClientError } from '@/services/api/errors';
import type {
  BreachListItem,
  BreachSeverity,
  BreachFetchStatus,
  ApiPaginationMeta,
} from '@/types';
import {
  ShieldAlert,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  Building2,
  Globe,
  Calendar,
  Users,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Database,
  SearchX,
} from 'lucide-react';

type SortField = 'added_date' | 'breach_date' | 'pwn_count' | 'title';
type SortOrder = 'asc' | 'desc';

export function BreachesPage() {
  const [breaches, setBreaches] = useState<BreachListItem[]>([]);
  const [pagination, setPagination] = useState<ApiPaginationMeta>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [status, setStatus] = useState<BreachFetchStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<BreachSeverity | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortField>('added_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const loadBreaches = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const result = await fetchBreaches({
        page: currentPage,
        limit: 10,
        search: activeSearch || undefined,
        severity: severityFilter === 'all' ? undefined : severityFilter,
        sort: sortBy,
        order: sortOrder,
      });

      setBreaches(result.data);
      setPagination(result.pagination);
      setStatus('success');
    } catch (err: unknown) {
      setStatus('error');
      if (err instanceof ApiClientError) {
        setErrorMessage(err.getUserFriendlyMessage());
      } else {
        setErrorMessage('Failed to connect to the Breach Intelligence API service.');
      }
    }
  }, [currentPage, activeSearch, severityFilter, sortBy, sortOrder]);

  useEffect(() => {
    loadBreaches();
  }, [loadBreaches]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setActiveSearch(searchTerm.trim());
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setActiveSearch('');
    setSeverityFilter('all');
    setSortBy('added_date');
    setSortOrder('desc');
    setCurrentPage(1);
  };

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

  const formatBreachDate = (dateStr: string | null) => {
    if (!dateStr) return 'Date undisclosed';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* Page Header */}
      <PageHeader
        title="Breach Intelligence Feed"
        description="Public repository of verified cybersecurity breaches and corporate exposure incidents aggregated in Supabase PostgreSQL."
        badge={
          <Badge variant="amber" size="sm" dot>
            Global Threat Telemetry
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
              onClick={loadBreaches}
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
              placeholder="Search by organization, title, or domain (e.g., Adobe, Dropbox)..."
              leftElement={<Search className="w-4 h-4 text-muted" />}
              className="font-mono text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="primary" size="sm" className="font-mono text-xs">
              Search
            </Button>
            {(activeSearch || severityFilter !== 'all' || sortBy !== 'added_date' || sortOrder !== 'desc') && (
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

        {/* Filters and Sorters bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60 text-xs font-mono">
          {/* Severity Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3 text-accent" />
              <span>Severity:</span>
            </span>
            {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => {
              const isActive = severityFilter === sev;
              return (
                <button
                  key={sev}
                  type="button"
                  onClick={() => {
                    setSeverityFilter(sev);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] capitalize transition-colors ${
                    isActive
                      ? 'bg-accent/20 text-accent border border-accent/40 font-semibold'
                      : 'text-muted hover:text-foreground hover:bg-surface-elevated border border-transparent'
                  }`}
                >
                  {sev}
                </button>
              );
            })}
          </div>

          {/* Sort Selector */}
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
              aria-label="Sort breaches by"
            >
              <option value="added_date">Added Date</option>
              <option value="breach_date">Breach Date</option>
              <option value="pwn_count">Exposed Accounts</option>
              <option value="title">Title (Alphabetical)</option>
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
                : `SHOWING ${breaches.length} OF ${pagination.totalItems} VERIFIED INCIDENTS`}
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
                Querying /api/v1/breaches telemetry...
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
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">Breach Intelligence Service Unavailable</h3>
                  <p className="text-xs text-muted max-w-xl">
                    {errorMessage || 'Unable to retrieve breach records from the backend API. Please verify the CredLock server is running on port 4000.'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadBreaches}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Retry Request
              </Button>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {status === 'success' && breaches.length === 0 && (
          <Card variant="inset" className="text-center py-12 bg-surface border-border">
            <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
              <div className="p-3 rounded-lg bg-surface-elevated text-muted border border-border">
                <SearchX className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground font-sans">No Incidents Found</h3>
              <p className="text-xs text-muted leading-relaxed font-sans">
                {activeSearch || severityFilter !== 'all'
                  ? 'No verified breaches match your current filter and search parameters. Try adjusting or resetting your criteria.'
                  : 'No breach intelligence records are currently cataloged in the database.'}
              </p>
              {(activeSearch || severityFilter !== 'all') && (
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

        {/* Breach Incidents List */}
        {status === 'success' && breaches.length > 0 && (
          <div className="space-y-3">
            {breaches.map((breach) => (
              <Card
                key={breach.id}
                variant="default"
                isInteractive
                className="group bg-surface border-border hover:border-accent/40 transition-all duration-200"
              >
                <Link
                  to={`/breaches/${breach.slug}`}
                  className="block focus:outline-none p-4 sm:p-5"
                  aria-label={`Inspect breach incident: ${breach.title}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Organization, Title & Details */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-foreground group-hover:text-accent transition-colors">
                          {breach.title}
                        </span>
                        <Badge
                          variant={getSeverityBadgeVariant(breach.severity)}
                          size="sm"
                        >
                          {breach.severity}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-muted">
                        {breach.organization && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-muted-dim" />
                            {breach.organization}
                          </span>
                        )}
                        {breach.domain && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5 text-muted-dim" />
                            {breach.domain}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-muted-dim" />
                          Breach: {formatBreachDate(breach.breach_date)}
                        </span>
                      </div>

                      {/* Compromised Data Classes Pills */}
                      {breach.data_classes && breach.data_classes.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {breach.data_classes.slice(0, 4).map((dc) => (
                            <span
                              key={dc}
                              className="px-1.5 py-0.5 rounded bg-background-secondary border border-border/60 text-[10px] font-mono text-muted"
                            >
                              {dc}
                            </span>
                          ))}
                          {breach.data_classes.length > 4 && (
                            <span className="text-[10px] font-mono text-muted-dim">
                              +{breach.data_classes.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Impact Count & Action Affordance */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                      <div className="text-left sm:text-right">
                        <div className="flex items-center gap-1 sm:justify-end text-xs font-mono font-bold text-foreground">
                          <Users className="w-3.5 h-3.5 text-status-danger" />
                          <span>{breach.pwn_count ? breach.pwn_count.toLocaleString() : 'Undisclosed'}</span>
                        </div>
                        <span className="text-[10px] text-muted-dim font-mono">
                          exposed accounts
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted group-hover:text-accent font-mono transition-colors">
                        <span className="text-[11px] uppercase tracking-wider hidden sm:inline">Inspect</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
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
