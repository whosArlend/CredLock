import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { useAnalysisDetail } from '@/hooks/useHistory';
import {
  ArrowLeft,
  ShieldCheck,
  Check,
  X,
  Clock,
  Hash,
  Calendar,
  SearchX,
  Trash2,
  Lock,
  Plus,
  AlertTriangle,
} from 'lucide-react';

export function AnalysisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { record, isLoading, error, deleteRecord } = useAnalysisDetail(id);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!id || isDeleting) return;
    try {
      setIsDeleting(true);
      await deleteRecord();
      showToast({
        type: 'info',
        title: 'Record Purged',
        message: 'The analysis record has been removed from IndexedDB.',
      });
      navigate('/analysis-history', { replace: true });
    } catch {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Unable to remove record from storage.',
      });
      setIsDeleting(false);
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getScoreVariant = (score: number): 'emerald' | 'amber' | 'rose' => {
    if (score >= 3) return 'emerald';
    if (score === 2) return 'amber';
    return 'rose';
  };

  const getVerdictLabel = (score: number, strengthLabel?: string): string => {
    if (strengthLabel) return strengthLabel;
    switch (score) {
      case 4:
        return 'Very Strong';
      case 3:
        return 'Strong';
      case 2:
        return 'Moderate';
      case 1:
        return 'Weak';
      case 0:
      default:
        return 'Very Weak';
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-5 animate-in fade-in duration-200 text-left">
        <PageHeader
          title="Loading Analysis Record..."
          description="Retrieving sanitized cryptographic metrics from local IndexedDB storage."
          actions={
            <Link to="/analysis-history">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Back to History
              </Button>
            </Link>
          }
        />
        <div className="text-center py-16 rounded-xl border border-border bg-surface">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
            <div className="font-mono text-xs text-muted uppercase tracking-wider">
              Querying credlock-db // {id || 'record'}...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not Found State
  if (!record || error) {
    return (
      <div className="space-y-5 animate-in fade-in duration-200 text-left">
        <PageHeader
          title="Record Not Found"
          description="The requested password analysis record could not be located in local storage."
          actions={
            <Link to="/analysis-history">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Back to History
              </Button>
            </Link>
          }
        />

        <div className="max-w-md mx-auto text-center py-10 px-6 rounded-xl bg-surface border border-border">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-3.5 rounded-lg bg-surface-elevated text-amber-500 border border-border">
              <SearchX className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-foreground font-sans">Analysis Record Unavailable</h3>
            <p className="text-xs text-muted max-w-sm leading-relaxed font-sans">
              No sanitized record matches identifier <code className="font-mono text-foreground font-semibold">"{id || 'empty'}"</code>. The record may have been deleted or purged in a cache flush.
            </p>
            <div className="pt-2">
              <Link to="/analysis-history">
                <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                  Return to History
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const scoreVariant = getScoreVariant(record.score);
  const verdictLabel = getVerdictLabel(record.score, record.strengthLabel);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* Top Navigation & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/analysis-history">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to History
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/analyzer">
            <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              New Analysis
            </Button>
          </Link>
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            isLoading={isDeleting}
            onClick={handleDelete}
          >
            Delete Record
          </Button>
        </div>
      </div>

      {/* Header / Masthead */}
      <div className="space-y-2 pb-1 border-b border-border/60">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-foreground">
            Analysis #{record.id.slice(0, 8)}
          </h1>
          <Badge variant={scoreVariant} size="sm" dot>
            Score {record.score}/4 • {verdictLabel}
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted font-sans">
          Sanitized cryptographic evaluation metrics computed client-side in browser memory and stored in IndexedDB.
        </p>
      </div>

      {/* Primary Metrics Snapshot Bar (4 items) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 p-3 sm:p-4 rounded-xl bg-surface border border-border/80 shadow-sm">
        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase text-muted tracking-wider block">Strength Verdict</span>
          <div className="text-base sm:text-lg font-bold font-sans text-foreground">
            {verdictLabel}
          </div>
          <span className="text-[10px] text-muted-dim font-mono block">Score {record.score} of 4</span>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase text-muted tracking-wider block">Calculated Entropy</span>
          <div className="text-base sm:text-lg font-bold font-mono text-accent">
            {record.entropyBits} bits
          </div>
          <span className="text-[10px] text-muted-dim font-mono block">Keyspace complexity</span>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase text-muted tracking-wider block">Length</span>
          <div className="text-base sm:text-lg font-bold font-mono text-foreground">
            {record.passwordLength} chars
          </div>
          <span className="text-[10px] text-muted-dim font-mono block">Character count</span>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase text-muted tracking-wider block">Offline Crack Time</span>
          <div className="text-base sm:text-lg font-bold font-mono text-foreground truncate">
            {record.crackTimeDisplay}
          </div>
          <span className="text-[10px] text-muted-dim font-mono block">Slow hash scenario</span>
        </div>
      </div>

      {/* 2-Column Responsive Diagnostic Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Panel 1: Cryptographic Evaluation Metrics */}
        <div className="rounded-xl bg-surface border border-border/80 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
                Cryptographic Metrics
              </h2>
            </div>
            <span className="font-mono text-[10px] text-muted-dim uppercase">Client Enclave</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-border/60">
              <span className="text-muted flex items-center gap-1.5 font-mono">
                <Hash className="w-3.5 h-3.5 text-accent" /> Record ID
              </span>
              <span className="font-mono text-foreground font-semibold break-all text-right max-w-[200px]">
                {record.id}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-border/60">
              <span className="text-muted flex items-center gap-1.5 font-mono">
                <Calendar className="w-3.5 h-3.5 text-accent" /> Evaluated At
              </span>
              <span className="font-mono text-foreground text-right">
                {formatTimestamp(record.timestamp)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-border/60">
              <span className="text-muted font-mono">Entropy Bits</span>
              <span className="font-mono text-accent font-semibold">
                {record.entropyBits} bits
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-border/60">
              <span className="text-muted font-mono">Password Length</span>
              <span className="font-mono text-foreground font-semibold">
                {record.passwordLength} characters
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-border/60">
              <span className="text-muted flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-accent" /> Offline Crack Time
              </span>
              <span className="font-mono text-foreground font-semibold">
                {record.crackTimeDisplay}
              </span>
            </div>

            {record.warning && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-status-danger/10 border border-status-danger/30 text-status-danger">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider block">Security Note</span>
                  <span className="text-xs font-sans leading-relaxed">{record.warning}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panel 2: Character Diversity Audit */}
        <div className="rounded-xl bg-surface border border-border/80 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-accent" />
                <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
                  Character Diversity
                </h2>
              </div>
              <span className="font-mono text-[10px] text-muted-dim uppercase">Sanitized Pool</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-background-base/60 border border-border">
                <span className="text-muted font-mono">Uppercase Letters (A-Z)</span>
                {record.hasUppercase ? (
                  <Badge variant="emerald" size="sm"><Check className="w-3 h-3 mr-1" /> Present</Badge>
                ) : (
                  <Badge variant="neutral" size="sm"><X className="w-3 h-3 mr-1" /> Missing</Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-background-base/60 border border-border">
                <span className="text-muted font-mono">Lowercase Letters (a-z)</span>
                {record.hasLowercase ? (
                  <Badge variant="emerald" size="sm"><Check className="w-3 h-3 mr-1" /> Present</Badge>
                ) : (
                  <Badge variant="neutral" size="sm"><X className="w-3 h-3 mr-1" /> Missing</Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-background-base/60 border border-border">
                <span className="text-muted font-mono">Numeric Digits (0-9)</span>
                {record.hasNumbers ? (
                  <Badge variant="emerald" size="sm"><Check className="w-3 h-3 mr-1" /> Present</Badge>
                ) : (
                  <Badge variant="neutral" size="sm"><X className="w-3 h-3 mr-1" /> Missing</Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-background-base/60 border border-border">
                <span className="text-muted font-mono">Special Symbols (!@#$)</span>
                {record.hasSymbols ? (
                  <Badge variant="emerald" size="sm"><Check className="w-3 h-3 mr-1" /> Present</Badge>
                ) : (
                  <Badge variant="neutral" size="sm"><X className="w-3 h-3 mr-1" /> Missing</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border/60 text-[11px] text-muted-dim flex items-center justify-between font-mono">
            <span>STORAGE: INDEXEDDB ENCLAVE</span>
            <span className="text-status-success font-semibold">PERSISTED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
