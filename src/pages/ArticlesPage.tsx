import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
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
  BookOpen,
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
  Clock,
  Calendar,
  PenLine,
  FileText,
  TrendingUp,
  Newspaper,
  Compass,
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

      setArticles(result.data);
      setPagination(result.pagination);
      setStatus('success');
    } catch (err: unknown) {
      setStatus('error');
      if (err instanceof ApiClientError) {
        setErrorMessage(err.getUserFriendlyMessage());
      } else {
        setErrorMessage('Failed to connect to the Security Articles API service.');
      }
    }
  }, [currentPage, activeSearch, categoryFilter, sortBy, sortOrder]);

  useEffect(() => {
    loadArticles();
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
        return <Compass className="w-3.5 h-3.5 text-status-success" />;
      case 'analysis':
        return <TrendingUp className="w-3.5 h-3.5 text-accent" />;
      case 'news':
        return <Newspaper className="w-3.5 h-3.5 text-status-info" />;
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
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* Page Header */}
      <PageHeader
        title="Security Knowledge Base & Advisories"
        description="Comprehensive cybersecurity research papers, cryptographic explainers, and tactical defense guides from CredLock Security Intelligence."
        badge={
          <Badge variant="cyan" size="sm" dot>
            Research & Advisories
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
              onClick={loadArticles}
              disabled={status === 'loading'}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${status === 'loading' ? 'animate-spin' : ''}`} />}
            >
              Sync
            </Button>
          </div>
        }
      />

      {/* Query Controls: Search, Category Filters & Sorting */}
      <Card variant="default" padding="md" className="space-y-4 bg-surface border-border">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, summary, or category (e.g. k-anonymity, Argon2, entropy)..."
              leftElement={<Search className="w-4 h-4 text-muted" />}
              className="font-mono text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="primary" size="sm" className="font-mono text-xs">
              Search
            </Button>
            {(activeSearch || categoryFilter !== 'all' || sortBy !== 'published_at' || sortOrder !== 'desc') && (
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

        {/* Filter Pills and Sorters Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60 text-xs font-mono">
          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3 text-accent" />
              <span>Category:</span>
            </span>
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
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
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

          {/* Sorter Selector */}
          <div className="flex items-center gap-2">
            <span className="text-muted flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-accent" />
              <span>Sort:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as ArticleSortField);
                setCurrentPage(1);
              }}
              className="bg-background-secondary text-foreground text-xs font-mono rounded px-2 py-1 border border-border focus:outline-none focus:border-accent"
              aria-label="Sort articles by"
            >
              <option value="published_at">Publish Date</option>
              <option value="read_time_minutes">Read Time</option>
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
                : `SHOWING ${articles.length} OF ${pagination.totalItems} RESEARCH ADVISORIES`}
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
                Querying /api/v1/articles telemetry...
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
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">Articles Service Unavailable</h3>
                  <p className="text-xs text-muted max-w-xl">
                    {errorMessage || 'Unable to retrieve articles from the backend API. Please verify the CredLock server is running on port 4000.'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadArticles}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Retry Request
              </Button>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {status === 'success' && articles.length === 0 && (
          <Card variant="inset" className="text-center py-12 bg-surface border-border">
            <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
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
          </Card>
        )}

        {/* Articles Grid */}
        {status === 'success' && articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((article) => (
              <Card
                key={article.id}
                variant="default"
                isInteractive
                className="group bg-surface border-border hover:border-accent/40 transition-all duration-200 flex flex-col justify-between"
              >
                <Link
                  to={`/articles/${article.slug}`}
                  className="block focus:outline-none p-5 h-full flex flex-col justify-between"
                  aria-label={`Read advisory: ${article.title}`}
                >
                  <div className="space-y-3">
                    {/* Header: Category & Read Time */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {getCategoryIcon(article.category)}
                        <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold">
                          {formatCategoryLabel(article.category)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[11px] font-mono text-muted-dim">
                          <Clock className="w-3 h-3 text-muted-dim" />
                          {article.read_time_minutes} min read
                        </span>
                        <Badge variant={getCategoryBadgeVariant(article.category)} size="sm">
                          {article.category.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    {/* Title & Summary */}
                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-foreground group-hover:text-accent transition-colors font-sans">
                        {article.title}
                      </h3>
                      <p className="text-xs text-muted leading-relaxed font-sans line-clamp-3">
                        {article.summary}
                      </p>
                    </div>

                    {/* Metadata: Author & Published Date */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-muted-dim">
                      <span className="flex items-center gap-1">
                        <PenLine className="w-3 h-3 text-muted-dim" />
                        {article.author_name}
                      </span>
                      {article.published_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-dim" />
                          {formatPublishDate(article.published_at)}
                        </span>
                      )}
                    </div>

                    {/* Tags chips */}
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1 font-mono text-[10px]">
                        {article.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded bg-background-secondary border border-border/50 text-muted-dim"
                          >
                            #{tag}
                          </span>
                        ))}
                        {article.tags.length > 3 && (
                          <span className="text-muted-dim">+{article.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Read Action Affordance */}
                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-mono">
                    <span className="text-[11px] text-muted">
                      Knowledge Base Advisory
                    </span>

                    <div className="flex items-center gap-1 text-accent group-hover:text-accent font-semibold transition-colors">
                      <span className="text-[11px] uppercase tracking-wider">Read Full</span>
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
