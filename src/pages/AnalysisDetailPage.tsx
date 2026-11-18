import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
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

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <PageHeader
          title="Loading Analysis Record..."
          description="Retrieving sanitized cryptographic metrics from local IndexedDB storage."
          actions={
            <Link to="/analysis-history">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to History
              </Button>
            </Link>
          }
        />
        <Card variant="inset" className="text-center py-16 border-border">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
            <div className="font-mono text-xs text-muted uppercase tracking-wider">
              Querying credlock-db // {id || 'record'}...
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Not Found State
  if (!record || error) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <PageHeader
          title="Record Not Found"
          description="The requested password analysis record could not be located in local storage."
          actions={
            <Link to="/analysis-history">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to History
              </Button>
            </Link>
          }
        />

        <Card className="max-w-lg mx-auto text-center py-10 bg-surface border-border">
          <CardHeader className="items-center pb-2">
            <div className="p-3.5 rounded-lg bg-surface-elevated text-amber-500 mb-3 border border-border">
              <SearchX className="w-8 h-8" />
            </div>
            <CardTitle className="text-lg text-foreground">Analysis Record Unavailable</CardTitle>
            <CardDescription className="max-w-sm mt-1 text-muted">
              No sanitized log matches identifier <code className="font-mono text-foreground font-semibold">"{id || 'empty'}"</code>. The record may have been deleted or purged in a cache flush.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center pt-4 border-t-0">
            <Link to="/analysis-history">
              <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Return to Analysis History
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const scoreBadgeVariant = record.score >= 3 ? 'emerald' : record.score === 2 ? 'amber' : 'rose';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title={`Analysis Detail: #${record.id.slice(0, 8)}`}
        description="Deep inspection of sanitized algorithmic metrics and entropy breakdown stored in IndexedDB."
        badge={
          <Badge variant={scoreBadgeVariant} size="sm" dot>
            Score {record.score}/4 {record.strengthLabel ? `• ${record.strengthLabel}` : ''}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/analysis-history">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to History
              </Button>
            </Link>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="w-4 h-4" />}
              isLoading={isDeleting}
              onClick={handleDelete}
            >
              Delete Record
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cryptographic Metrics Card */}
        <Card variant="default" padding="lg" className="bg-surface border-border">
          <CardHeader className="px-0 pt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-accent" />
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted">
                  CRYPTOGRAPHIC EVALUATION METRICS
                </CardTitle>
              </div>
              <span className="font-mono text-[10px] text-muted uppercase">LOCAL COMPUTATION</span>
            </div>
            <CardDescription className="text-xs text-muted mt-1">
              Mathematical strength metrics computed client-side in browser sandbox.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-0 pb-0 space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted flex items-center gap-1.5 font-mono">
                <Hash className="w-3.5 h-3.5 text-accent" /> Record ID
              </span>
              <span className="font-mono text-foreground font-semibold break-all text-right max-w-[240px]">
                {record.id}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted flex items-center gap-1.5 font-mono">
                <Calendar className="w-3.5 h-3.5 text-accent" /> Timestamp (ISO 8601)
              </span>
              <span className="font-mono text-foreground text-right">
                {formatTimestamp(record.timestamp)}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted">Estimated Guess-Work Difficulty</span>
              <span className="font-mono text-accent font-semibold">
                {record.entropyBits} bits
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted">Password Length</span>
              <span className="font-mono text-foreground font-semibold">
                {record.passwordLength} characters
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-accent" /> Offline Crack Time (Slow Hash)
              </span>
              <span className="font-mono text-foreground font-semibold">
                {record.crackTimeDisplay}
              </span>
            </div>

            {record.warning && (
              <div className="flex justify-between py-2 border-b border-border/60 text-danger">
                <span>Vulnerability Note</span>
                <span className="font-semibold text-right max-w-[240px]">{record.warning}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Character Diversity Audit */}
        <Card variant="default" padding="lg" className="bg-surface border-border flex flex-col justify-between">
          <div>
            <CardHeader className="px-0 pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-accent" />
                  <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted">
                    CHARACTER DIVERSITY AUDIT
                  </CardTitle>
                </div>
                <span className="font-mono text-[10px] text-muted uppercase">SANITIZED POOL</span>
              </div>
              <CardDescription className="text-xs text-muted mt-1">
                Presence of character classes confirmed during evaluation. Passwords are never stored.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-0 pb-0 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-background-base/60 border border-border">
                <span className="text-muted font-mono">Uppercase Letters (A-Z)</span>
                {record.hasUppercase ? (
                  <Badge variant="emerald" size="sm"><Check className="w-3 h-3 mr-1" /> Present</Badge>
                ) : (
                  <Badge variant="neutral" size="sm"><X className="w-3 h-3 mr-1" /> Missing</Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-background-base/60 border border-border">
                <span className="text-muted font-mono">Lowercase Letters (a-z)</span>
                {record.hasLowercase ? (
                  <Badge variant="emerald" size="sm"><Check className="w-3 h-3 mr-1" /> Present</Badge>
                ) : (
                  <Badge variant="neutral" size="sm"><X className="w-3 h-3 mr-1" /> Missing</Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-background-base/60 border border-border">
                <span className="text-muted font-mono">Numeric Digits (0-9)</span>
                {record.hasNumbers ? (
                  <Badge variant="emerald" size="sm"><Check className="w-3 h-3 mr-1" /> Present</Badge>
                ) : (
                  <Badge variant="neutral" size="sm"><X className="w-3 h-3 mr-1" /> Missing</Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-background-base/60 border border-border">
                <span className="text-muted font-mono">Special Symbols (!@#$)</span>
                {record.hasSymbols ? (
                  <Badge variant="emerald" size="sm"><Check className="w-3 h-3 mr-1" /> Present</Badge>
                ) : (
                  <Badge variant="neutral" size="sm"><X className="w-3 h-3 mr-1" /> Missing</Badge>
                )}
              </div>
            </CardContent>
          </div>

          <div className="mt-6 pt-4 border-t border-border/50 text-[11px] text-muted flex items-center justify-between font-mono">
            <span>STORAGE: INDEXEDDB ENCLAVE</span>
            <span className="text-emerald-500 font-semibold">PERSISTED</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
