import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { fetchArticleBySlug } from '@/services/api/articleService';
import { ApiClientError } from '@/services/api/errors';
import type { ArticleDetailItem, ArticleCategory } from '@/types';
import {
  ArrowLeft,
  SearchX,
  RefreshCw,
  AlertTriangle,
  Clock,
  Calendar,
  PenLine,
  Tag,
  BookOpen,
  FileText,
  TrendingUp,
  Newspaper,
  Compass,
} from 'lucide-react';

export function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<ArticleDetailItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadArticleDetail = useCallback(async () => {
    if (!slug) return;
    setIsLoading(true);
    setIsNotFound(false);
    setErrorMessage(null);

    try {
      const data = await fetchArticleBySlug(slug);
      setArticle(data);
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.status === 404) {
        setIsNotFound(true);
      } else if (err instanceof ApiClientError) {
        setErrorMessage(err.getUserFriendlyMessage());
      } else {
        setErrorMessage('Failed to connect to the Security Articles service.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadArticleDetail();
  }, [loadArticleDetail]);

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
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Structured content renderer for Markdown content
  const renderedContent = useMemo(() => {
    if (!article?.content) return null;

    const lines = article.content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line === undefined) continue;

      // Handle Code Blocks
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockLang = line.slice(3).trim();
          codeBlockContent = [];
        } else {
          inCodeBlock = false;
          elements.push(
            <div
              key={`code-${i}`}
              className="my-4 rounded-lg bg-background-base p-4 border border-border/80 font-mono text-xs overflow-x-auto text-foreground/90 space-y-1"
            >
              {codeBlockLang && (
                <div className="text-[10px] uppercase text-muted-dim pb-1 border-b border-border/40 font-mono">
                  {codeBlockLang}
                </div>
              )}
              <pre className="pt-1">
                <code>{codeBlockContent.join('\n')}</code>
              </pre>
            </div>
          );
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Handle Math Blocks ($$ ... $$)
      if (line.startsWith('$$') && line.endsWith('$$') && line.length > 4) {
        elements.push(
          <div
            key={`math-${i}`}
            className="my-3 p-3 rounded-lg bg-surface-elevated border border-accent/30 text-center font-mono text-sm text-accent"
          >
            {line.slice(2, -2).trim()}
          </div>
        );
        continue;
      }

      // Handle Headings
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${i}`} className="text-xl sm:text-2xl font-bold font-sans text-foreground pt-4 pb-2 border-b border-border/60">
            {line.slice(2)}
          </h1>
        );
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${i}`} className="text-lg sm:text-xl font-bold font-sans text-foreground pt-3 pb-1 border-b border-border/40">
            {line.slice(3)}
          </h2>
        );
        continue;
      }
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${i}`} className="text-base font-semibold font-sans text-foreground pt-2">
            {line.slice(4)}
          </h3>
        );
        continue;
      }

      // Handle Bullet Lists
      if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <li key={`li-${i}`} className="ml-4 list-disc text-sm text-foreground/80 leading-relaxed pl-1">
            {line.slice(2)}
          </li>
        );
        continue;
      }

      // Handle Numbered Lists
      if (/^\d+\.\s/.test(line)) {
        const itemText = line.replace(/^\d+\.\s/, '');
        elements.push(
          <li key={`oli-${i}`} className="ml-4 list-decimal text-sm text-foreground/80 leading-relaxed pl-1">
            {itemText}
          </li>
        );
        continue;
      }

      // Handle Empty Lines
      if (line.trim() === '') {
        continue;
      }

      // Standard Paragraph
      elements.push(
        <p key={`p-${i}`} className="text-sm text-foreground/90 leading-relaxed font-sans">
          {line}
        </p>
      );
    }

    return elements;
  }, [article?.content]);

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200 text-left">
        <PageHeader
          title="Loading Research Advisory..."
          description={`Retrieving knowledge base content for '${slug || 'advisory'}' from backend API.`}
          actions={
            <Link to="/articles">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Advisories
              </Button>
            </Link>
          }
        />
        <Card variant="inset" className="text-center py-16 border-border bg-surface">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
            <div className="font-mono text-xs text-muted uppercase tracking-wider">
              Querying /api/v1/articles/{slug || 'record'}...
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
          title="Advisory Article Not Found"
          description="The requested research advisory article does not exist or has not been published."
          actions={
            <Link to="/articles">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Advisories
              </Button>
            </Link>
          }
        />

        <Card className="max-w-lg mx-auto text-center py-10 bg-surface border-border">
          <div className="flex flex-col items-center justify-center p-6 space-y-3">
            <div className="p-3.5 rounded-lg bg-surface-elevated text-amber-500 border border-border">
              <SearchX className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-foreground font-sans">Article Unavailable</h3>
            <p className="text-xs text-muted max-w-sm leading-relaxed font-sans">
              No published advisory matches the slug identifier{' '}
              <code className="font-mono text-foreground font-semibold">"{slug}"</code>.
              The article may be unpublished or the link may be outdated.
            </p>
            <div className="pt-2">
              <Link to="/articles">
                <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Explore Published Advisories
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Error State (Network / 500)
  if (errorMessage || !article) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200 text-left">
        <PageHeader
          title="Advisory Retrieval Error"
          description="Unable to load the security article due to a communication issue with the backend."
          actions={
            <Link to="/articles">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Advisories
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
                <p className="text-xs text-muted max-w-md font-sans">
                  {errorMessage || 'Failed to communicate with the CredLock Security Articles API.'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadArticleDetail}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Retry Request
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* Page Header */}
      <PageHeader
        title={article.title}
        description={`Author: ${article.author_name} // Category: ${formatCategoryLabel(article.category)}`}
        badge={
          <Badge variant={getCategoryBadgeVariant(article.category)} size="sm" dot>
            {article.category.toUpperCase()}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/articles">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                All Advisories
              </Button>
            </Link>
          </div>
        }
      />

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Category */}
        <Card variant="default" padding="sm" className="space-y-1.5 bg-surface border-border">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Classification</span>
            {getCategoryIcon(article.category)}
          </div>
          <div className="space-y-0.5">
            <p className="text-base sm:text-lg font-bold font-mono text-foreground capitalize tracking-tight pt-0.5">
              {formatCategoryLabel(article.category)}
            </p>
            <span className="text-[10px] text-muted-dim font-mono">Domain stream</span>
          </div>
        </Card>

        {/* Metric 2: Read Time */}
        <Card variant="default" padding="sm" className="space-y-1.5 bg-surface border-border">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Read Time</span>
            <Clock className="w-3.5 h-3.5 text-accent" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xl sm:text-2xl font-bold font-mono text-foreground tracking-tight">
              {article.read_time_minutes} Min
            </p>
            <span className="text-[10px] text-muted-dim font-mono">Estimated duration</span>
          </div>
        </Card>

        {/* Metric 3: Published Date */}
        <Card variant="default" padding="sm" className="space-y-1.5 bg-surface border-border">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Publication</span>
            <Calendar className="w-3.5 h-3.5 text-muted-dim" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs sm:text-sm font-semibold font-mono text-foreground tracking-tight pt-1">
              {formatPublishDate(article.published_at)}
            </p>
            <span className="text-[10px] text-muted-dim font-mono">Peer-reviewed date</span>
          </div>
        </Card>

        {/* Metric 4: Author */}
        <Card variant="default" padding="sm" className="space-y-1.5 bg-surface border-border">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Byline</span>
            <PenLine className="w-3.5 h-3.5 text-status-success" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs sm:text-sm font-semibold text-foreground tracking-tight pt-1 truncate">
              {article.author_name}
            </p>
            <span className="text-[10px] text-muted-dim font-mono">Research contributor</span>
          </div>
        </Card>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Executive Summary & Full Article Content (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Executive Summary Card */}
          <Card variant="default" padding="lg" className="bg-surface border-border space-y-3">
            <CardHeader className="px-0 pt-0 pb-2 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent" />
                  <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted">
                    EXECUTIVE SUMMARY
                  </CardTitle>
                </div>
                <Badge variant="cyan" size="sm">
                  ABSTRACT
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="px-0 pb-0">
              <p className="text-sm text-foreground/90 leading-relaxed font-sans italic border-l-2 border-accent/40 pl-3">
                {article.summary}
              </p>
            </CardContent>
          </Card>

          {/* Full Markdown Article Content */}
          <Card variant="default" padding="lg" className="bg-surface border-border space-y-4">
            <CardHeader className="px-0 pt-0 pb-2 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-accent" />
                  <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted">
                    FULL ARTICLE TEXT
                  </CardTitle>
                </div>
                <span className="font-mono text-[10px] text-muted-dim uppercase">VERIFIED CONTENT</span>
              </div>
            </CardHeader>

            <CardContent className="px-0 pb-0 space-y-4 font-sans text-sm text-foreground/90">
              {renderedContent}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Metadata, Tags & Citation (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card variant="default" padding="md" className="bg-surface border-border space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <BookOpen className="w-3.5 h-3.5 text-accent" />
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-foreground">
                Document Metadata
              </h3>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <span className="text-[11px] text-muted uppercase tracking-wider block">Author</span>
                <span className="text-foreground font-semibold text-sm font-sans">
                  {article.author_name}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-muted uppercase tracking-wider block">Category Stream</span>
                <span className="text-foreground text-xs">
                  {formatCategoryLabel(article.category)}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-muted uppercase tracking-wider block">Est. Reading Duration</span>
                <span className="text-foreground text-xs">
                  {article.read_time_minutes} minutes
                </span>
              </div>

              <div>
                <span className="text-[11px] text-muted uppercase tracking-wider block">Slug Identifier</span>
                <code className="text-foreground-dim text-[11px] break-all">{article.slug}</code>
              </div>

              <div>
                <span className="text-[11px] text-muted uppercase tracking-wider block">Article UUID</span>
                <code className="text-foreground-dim text-[10px] break-all">{article.id}</code>
              </div>

              {/* Tags Section */}
              {article.tags && article.tags.length > 0 && (
                <div className="pt-2 border-t border-border/60">
                  <div className="flex items-center gap-1.5 pb-2">
                    <Tag className="w-3 h-3 text-accent" />
                    <span className="text-[11px] text-muted uppercase tracking-wider font-semibold">
                      Subject Tags
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {article.tags.map((tag) => (
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
