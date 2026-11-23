import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
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
  ArrowRight,
  ArrowLeft,
  Building2,
  Globe,
  RefreshCw,
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

  const isMountedRef = useRef(true);

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

      if (!isMountedRef.current) return;
      setBreaches(result.data);
      setPagination(result.pagination);
      setStatus('success');
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      setStatus('error');
      if (err instanceof ApiClientError) {
        setErrorMessage(err.getUserFriendlyMessage());
      } else {
        setErrorMessage('Failed to connect to the Breach Intelligence API service.');
      }
    }
  }, [currentPage, activeSearch, severityFilter, sortBy, sortOrder]);

  useEffect(() => {
    isMountedRef.current = true;
    loadBreaches();
    return () => {
      isMountedRef.current = false;
    };
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
    <div className="space-y-5 animate-in fade-in duration-200 text-left">
      {/* Page Header */}
      <PageHeader
        title="Breach Intelligence Feed"
        description="Public repository of verified cybersecurity breaches and corporate exposure incidents."
        badge={
          <Badge variant="amber" size="sm" dot>
            Threat Telemetry
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
              onClick={loadBreaches}
              disabled={status === 'loading'}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${status === 'loading' ? 'animate-spin' : ''}`} />}
            >
              Sync
            </Button>
          </div>
        }
      />

      {/* Query Controls: Consolidated Search, Filters & Sorting */}
      <div className="p-4 sm:p-5 rounded-2xl bg-enclave-plate/90 border border-enclave-border/80 shadow-plate-tactical backdrop-blur-sm space-y-3">
        {/* Search & Action Bar */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by organization, title, or domain (e.g. Adobe, Dropbox)..."
              leftElement={<Search className="w-4 h-4 text-muted" />}
              className="font-mono text-xs h-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="primary" size="sm" className="font-mono text-xs h-9">
              Search
            </Button>
            {(activeSearch || severityFilter !== 'all' || sortBy !== 'added_date' || sortOrder !== 'desc') && (
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

        {/* Compact Filters & Sorting Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border/50 text-xs font-mono">
          {/* Severity Filter Pills */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-muted-dim text-[11px] mr-1 hidden sm:inline">Severity:</span>
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
          <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
            <span className="text-muted-dim text-[11px] hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortField);
                setCurrentPage(1);
              }}
              className="bg-background-base text-foreground text-xs font-mono rounded px-2 py-0.5 border border-border focus:outline-none focus:border-accent"
              aria-label="Sort breaches by"
            >
              <option value="added_date">Added Date</option>
              <option value="breach_date">Breach Date</option>
              <option value="pwn_count">Exposed Accounts</option>
              <option value="title">Title (A-Z)</option>
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

      {/* Main Content Area */}
      <div className="space-y-3">
        {/* Telemetry Status Bar */}
        <div className="flex items-center justify-between text-xs font-mono text-muted px-1">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-accent" />
            <span className="text-[11px]">
              {status === 'loading'
                ? 'SYNCING WITH BACKEND TELEMETRY...'
                : `SHOWING ${breaches.length} OF ${pagination.totalItems} VERIFIED INCIDENTS`}
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
                Retrieving verified breach records...
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
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">Breach Intelligence Service Unavailable</h3>
                  <p className="text-xs text-muted max-w-xl">
                    {errorMessage || 'Unable to retrieve breach records from the backend API.'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadBreaches}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {status === 'success' && breaches.length === 0 && (
          <div className="text-center py-12 rounded-xl bg-surface border border-border">
            <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto p-4">
              <div className="p-3 rounded-lg bg-surface-elevated text-muted border border-border">
                <SearchX className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground font-sans">No Incidents Found</h3>
              <p className="text-xs text-muted leading-relaxed font-sans">
                {activeSearch || severityFilter !== 'all'
                  ? 'No verified breaches match your current filter and search parameters. Try adjusting or clearing your criteria.'
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
          </div>
        )}

        {/* Breach Incidents Ledger */}
        {status === 'success' && breaches.length > 0 && (
          <div className="space-y-2">
            {/* Desktop Structured Ledger (md+) */}
            <div className="hidden md:block rounded-2xl border border-enclave-border/80 bg-enclave-plate/90 overflow-hidden shadow-plate-tactical">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-enclave-elevated/70 border-b border-enclave-border text-[11px] text-muted uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Incident / Organization</th>
                    <th className="py-2.5 px-3 font-semibold">Severity</th>
                    <th className="py-2.5 px-3 font-semibold">Breach Date</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Exposed Accounts</th>
                    <th className="py-2.5 px-4 font-semibold">Data Classes</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {breaches.map((breach) => (
                    <tr
                      key={breach.id}
                      className="group hover:bg-surface-elevated/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <Link to={`/breaches/${breach.slug}`} className="block focus:outline-none">
                          <div className="font-semibold text-foreground group-hover:text-accent transition-colors font-sans text-sm">
                            {breach.title}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-dim font-mono pt-0.5">
                            {breach.organization && (
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-muted-dim" />
                                {breach.organization}
                              </span>
                            )}
                            {breach.domain && (
                              <span className="flex items-center gap-1 text-muted-dim">
                                <Globe className="w-3 h-3" />
                                {breach.domain}
                              </span>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <Badge
                          variant={getSeverityBadgeVariant(breach.severity)}
                          size="sm"
                        >
                          {breach.severity}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-muted text-[11px]">
                        {formatBreachDate(breach.breach_date)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right">
                        <span className="font-bold text-foreground tabular-nums">
                          {breach.pwn_count ? breach.pwn_count.toLocaleString() : 'Undisclosed'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {breach.data_classes && breach.data_classes.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1">
                            {breach.data_classes.slice(0, 2).map((dc) => (
                              <span
                                key={dc}
                                className="px-1.5 py-0.5 rounded bg-background-base border border-border/50 text-[10px] text-muted"
                              >
                                {dc}
                              </span>
                            ))}
                            {breach.data_classes.length > 2 && (
                              <span className="text-[10px] text-muted-dim">
                                +{breach.data_classes.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-dim">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Link
                          to={`/breaches/${breach.slug}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted group-hover:text-accent transition-colors"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Incident Cards (md:hidden) */}
            <div className="md:hidden space-y-2">
              {breaches.map((breach) => (
                <div
                  key={breach.id}
                  className="rounded-xl border border-enclave-border/80 bg-enclave-plate/90 p-3.5 hover:border-accent/40 transition-colors shadow-card-tactical"
                >
                  <Link
                    to={`/breaches/${breach.slug}`}
                    className="block focus:outline-none space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground truncate">
                          {breach.title}
                        </h3>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-muted truncate">
                          {breach.organization && <span>{breach.organization}</span>}
                          {breach.domain && <span>• {breach.domain}</span>}
                        </div>
                      </div>
                      <Badge
                        variant={getSeverityBadgeVariant(breach.severity)}
                        size="sm"
                        className="shrink-0"
                      >
                        {breach.severity}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-border/40 text-muted">
                      <span className="text-[11px]">
                        {formatBreachDate(breach.breach_date)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground tabular-nums">
                          {breach.pwn_count ? breach.pwn_count.toLocaleString() : 'Undisclosed'}
                        </span>
                        <span className="text-[10px] text-muted-dim">accounts</span>
                        <ArrowRight className="w-3.5 h-3.5 text-accent ml-1" />
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination Controls */}
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
