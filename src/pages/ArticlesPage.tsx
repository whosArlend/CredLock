import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { fetchArticles } from '@/services/api/articleService';
import { ApiClientError } from '@/services/api/errors';
import type {
  ArticleListItem,
  ArticleCategory,
  ArticleSortField,
  ArticleSortOrder,
  ArticleFetchStatus,
  ApiPaginationMeta,
} from '@/types';
import {
  Search,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Database,
  SearchX,
  Clock,
  Calendar,
  PenLine,
  TrendingUp,
  Newspaper,
  Compass,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [pagination, setPagination] = useState<ApiPaginationMeta>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [status, setStatus] = useState<ArticleFetchStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ArticleCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<ArticleSortField>('published_at');
  const [sortOrder, setSortOrder] = useState<ArticleSortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const isMountedRef = useRef(true);

  const loadArticles = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const result = await fetchArticles({
        page: currentPage,
        limit: 10,
        search: activeSearch || undefined,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        sort: sortBy,
        order: sortOrder,
      });

      if (!isMountedRef.current) return;
      setArticles(result.data);
      setPagination(result.pagination);
      setStatus('success');
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      setStatus('error');
      if (err instanceof ApiClientError) {
        setErrorMessage(err.getUserFriendlyMessage());
      } else {
        setErrorMessage('Failed to connect to the Security Articles API service.');
      }
    }
  }, [currentPage, activeSearch, categoryFilter, sortBy, sortOrder]);

  useEffect(() => {
    isMountedRef.current = true;
    loadArticles();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadArticles]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setActiveSearch(searchTerm.trim());
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setActiveSearch('');
    setCategoryFilter('all');
    setSortBy('published_at');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const getCategoryBadgeVariant = (category: ArticleCategory): 'emerald' | 'amber' | 'cyan' | 'neutral' => {
    switch (category) {
      case 'guide':
        return 'emerald';
      case 'analysis':
        return 'amber';
      case 'news':
        return 'cyan';
      case 'explainer':
      default:
        return 'neutral';
    }
  };

  const getCategoryIcon = (category: ArticleCategory) => {
    switch (category) {
      case 'guide':
        return <Compass className="w-3.5 h-3.5 text-emerald-400" />;
      case 'analysis':
        return <TrendingUp className="w-3.5 h-3.5 text-accent" />;
      case 'news':
        return <Newspaper className="w-3.5 h-3.5 text-accent" />;
      case 'explainer':
      default:
        return <FileText className="w-3.5 h-3.5 text-muted" />;
    }
  };

  const formatCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const formatPublishDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unpublished';
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
        title="Cybersecurity Knowledge Base"
        description="Peer-reviewed security advisories, threat intelligence briefings, and password architecture guides."
        badge={
          <Badge variant="cyan" size="sm" dot>
            Advisories & Research
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
              onClick={loadArticles}
              disabled={status === 'loading'}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${status === 'loading' ? 'animate-spin' : ''}`} />}
            >
              Sync
            </Button>
          </div>
        }
      />

      {/* Query Controls: Consolidated Search, Categories & Sorting */}
      <div className="p-3.5 rounded-xl bg-surface border border-border shadow-sm space-y-3">
        {/* Search & Action Bar */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search advisories by title, topic, or keyword (e.g. quantum, k-anonymity)..."
              leftElement={<Search className="w-4 h-4 text-muted" />}
              className="font-mono text-xs h-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="primary" size="sm" className="font-mono text-xs h-9">
              Search
            </Button>
            {(activeSearch || categoryFilter !== 'all' || sortBy !== 'published_at' || sortOrder !== 'desc') && (
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
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-muted-dim text-[11px] mr-1 hidden sm:inline">Stream:</span>
            {(['all', 'guide', 'analysis', 'news', 'explainer'] as const).map((cat) => {
              const isActive = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategoryFilter(cat);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] capitalize transition-colors ${
                    isActive
                      ? 'bg-accent/20 text-accent border border-accent/40 font-semibold'
                      : 'text-muted hover:text-foreground hover:bg-surface-elevated border border-transparent'
                  }`}
                >
                  {cat === 'all' ? 'All Advisories' : formatCategoryLabel(cat)}
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
                setSortBy(e.target.value as ArticleSortField);
                setCurrentPage(1);
              }}
              className="bg-background-base text-foreground text-xs font-mono rounded px-2 py-0.5 border border-border focus:outline-none focus:border-accent"
              aria-label="Sort articles by"
            >
              <option value="published_at">Published Date</option>
              <option value="read_time_minutes">Read Time</option>
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
        {/* Status Bar */}
        <div className="flex items-center justify-between text-xs font-mono text-muted px-1">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-accent" />
            <span className="text-[11px]">
              {status === 'loading'
                ? 'SYNCING RESEARCH ADVISORIES...'
                : `SHOWING ${articles.length} OF ${pagination.totalItems} PUBLISHED ADVISORIES`}
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
                Retrieving knowledge base articles...
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
                  <h3 className="text-sm font-bold text-foreground">Knowledge Base Service Unavailable</h3>
                  <p className="text-xs text-muted max-w-xl">
                    {errorMessage || 'Unable to retrieve articles from the backend API.'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadArticles}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {status === 'success' && articles.length === 0 && (
          <div className="text-center py-12 rounded-xl bg-surface border border-border">
            <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto p-4">
              <div className="p-3 rounded-lg bg-surface-elevated text-muted border border-border">
                <SearchX className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground font-sans">No Advisories Found</h3>
              <p className="text-xs text-muted leading-relaxed font-sans">
                {activeSearch || categoryFilter !== 'all'
                  ? 'No published articles match your current filter and search criteria. Try adjusting or resetting your search.'
                  : 'No advisory articles are currently cataloged in the database.'}
              </p>
              {(activeSearch || categoryFilter !== 'all') && (
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

        {/* Articles Editorial Grid (1 col on mobile, 2 cols on tablet, 3 cols on desktop) */}
        {status === 'success' && articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {articles.map((article) => (
              <div
                key={article.id}
                className="group rounded-xl border border-border bg-surface hover:border-accent/40 transition-all duration-200 flex flex-col justify-between shadow-sm p-4"
              >
                <Link
                  to={`/articles/${article.slug}`}
                  className="block focus:outline-none h-full flex flex-col justify-between space-y-3"
                  aria-label={`Read advisory: ${article.title}`}
                >
                  <div className="space-y-2.5">
                    {/* Header: Stream badge & Read time */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {getCategoryIcon(article.category)}
                        <Badge variant={getCategoryBadgeVariant(article.category)} size="sm">
                          {formatCategoryLabel(article.category)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-mono text-muted-dim">
                        <Clock className="w-3 h-3 text-muted-dim" />
                        <span>{article.read_time_minutes}m read</span>
                      </div>
                    </div>

                    {/* Title & Summary */}
                    <div className="space-y-1">
                      <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-accent transition-colors font-sans leading-snug line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-xs text-muted leading-relaxed font-sans line-clamp-2">
                        {article.summary}
                      </p>
                    </div>

                    {/* Byline & Date */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-dim pt-1 border-t border-border/40">
                      <span className="truncate flex items-center gap-1">
                        <PenLine className="w-3 h-3 text-muted-dim shrink-0" />
                        {article.author_name}
                      </span>
                      {article.published_at && (
                        <span className="shrink-0 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-dim shrink-0" />
                          {formatPublishDate(article.published_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Read Action */}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs font-mono">
                    <span className="text-[10px] text-muted-dim uppercase tracking-wider">
                      Advisory
                    </span>
                    <div className="flex items-center gap-1 text-accent font-semibold text-[11px] uppercase tracking-wider">
                      <span>Read Full</span>
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
