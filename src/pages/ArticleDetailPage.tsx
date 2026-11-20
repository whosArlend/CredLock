import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
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
      <div className="space-y-5 animate-in fade-in duration-200 text-left">
        <PageHeader
          title="Loading Research Advisory..."
          description={`Retrieving knowledge base content for '${slug || 'advisory'}' from backend API.`}
          actions={
            <Link to="/articles">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Back to Advisories
              </Button>
            </Link>
          }
        />
        <div className="text-center py-16 rounded-xl border border-border bg-surface">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
            <div className="font-mono text-xs text-muted uppercase tracking-wider">
              Querying /api/v1/articles/{slug || 'record'}...
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
          title="Advisory Article Not Found"
          description="The requested research advisory article does not exist or has not been published."
          actions={
            <Link to="/articles">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Back to Advisories
              </Button>
            </Link>
          }
        />

        <div className="max-w-md mx-auto text-center py-10 px-6 rounded-xl bg-surface border border-border">
          <div className="flex flex-col items-center justify-center space-y-3">
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
                <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                  Explore Published Advisories
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State (Network / 500)
  if (errorMessage || !article) {
    return (
      <div className="space-y-5 animate-in fade-in duration-200 text-left">
        <PageHeader
          title="Advisory Retrieval Error"
          description="Unable to load the security article due to a communication issue with the backend."
          actions={
            <Link to="/articles">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Back to Advisories
              </Button>
            </Link>
          }
        />

        <div className="rounded-xl border border-status-danger/40 bg-surface p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-status-danger/10 text-status-danger border border-status-danger/20 shrink-0">
                <AlertTriangle className="w-5 h-5" />
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
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link to="/articles">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            All Advisories
          </Button>
        </Link>
        <Badge variant={getCategoryBadgeVariant(article.category)} size="sm" dot>
          {article.category.toUpperCase()}
        </Badge>
      </div>

      {/* Article Masthead */}
      <div className="space-y-3 pb-2 border-b border-border/60">
        <h1 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-foreground leading-tight">
          {article.title}
        </h1>

        {/* Unified Editorial Metadata Bar */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5 px-3.5 rounded-lg bg-surface border border-border/80 font-mono text-xs text-muted">
          <div className="flex items-center gap-1.5 text-foreground">
            {getCategoryIcon(article.category)}
            <span className="font-semibold uppercase tracking-wider">{formatCategoryLabel(article.category)}</span>
          </div>
          <span className="text-border hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <PenLine className="w-3.5 h-3.5 text-muted-dim" />
            <span className="text-foreground/90 font-sans">{article.author_name}</span>
          </div>
          <span className="text-border hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-dim" />
            <span>{formatPublishDate(article.published_at)}</span>
          </div>
          <span className="text-border hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-accent" />
            <span>{article.read_time_minutes} min read</span>
          </div>
        </div>
      </div>

      {/* Executive Summary / Abstract Callout */}
      <div className="p-4 sm:p-5 rounded-xl bg-surface-elevated/40 border border-accent/20 border-l-4 border-l-accent space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-accent text-xs font-mono font-semibold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            Executive Summary
          </div>
          <Badge variant="cyan" size="sm">
            ABSTRACT
          </Badge>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed font-sans italic pt-0.5">
          {article.summary}
        </p>
      </div>

      {/* Main Article Body (Prose Container) */}
      <article className="rounded-xl bg-surface border border-border/80 p-5 sm:p-7 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent" />
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
              Advisory Analysis & Findings
            </h2>
          </div>
          <span className="font-mono text-[10px] text-muted-dim uppercase tracking-wider">
            Verified Content
          </span>
        </div>

        <div className="prose prose-invert max-w-none text-foreground/90 space-y-4 font-sans leading-relaxed text-sm">
          {renderedContent}
        </div>
      </article>

      {/* Tags & Document Footnote */}
      <div className="rounded-xl bg-surface border border-border/80 p-4 sm:p-5 space-y-4">
        {article.tags && article.tags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-muted uppercase tracking-wider">
              <Tag className="w-3 h-3 text-accent" />
              Subject Tags
            </div>
            <div className="flex flex-wrap gap-1.5">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-md bg-surface-elevated border border-border text-xs font-mono text-muted hover:text-foreground transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-muted-dim">
          <div>
            Identifier: <code className="text-foreground-dim text-[11px]">{article.slug}</code>
          </div>
          <div>
            Advisory UUID: <code className="text-foreground-dim text-[10px]">{article.id}</code>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Link to="/articles">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to Advisories
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-xs text-muted hover:text-foreground"
        >
          Back to top ↑
        </Button>
      </div>
    </div>
  );
}
