import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { useBreachDetail } from '@/hooks/useHistory';
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  SearchX,
  Hash,
  Trash2,
  CheckCircle2,
  KeyRound,
  Shield,
} from 'lucide-react';

export function BreachDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { record, isLoading, error, deleteRecord } = useBreachDetail(id);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!id || isDeleting) return;
    try {
      setIsDeleting(true);
      await deleteRecord();
      showToast({
        type: 'info',
        title: 'Query Record Purged',
        message: 'The breach check record was deleted from IndexedDB.',
      });
      navigate('/breach-history', { replace: true });
    } catch {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Unable to remove breach record from storage.',
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
          title="Loading Breach Query Record..."
          description="Retrieving sanitized k-anonymity query metadata from local IndexedDB storage."
          actions={
            <Link to="/breach-history">
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
          description="The requested breach check query record could not be located in local storage."
          actions={
            <Link to="/breach-history">
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
            <CardTitle className="text-lg text-foreground">Breach Record Unavailable</CardTitle>
            <CardDescription className="max-w-sm mt-1 text-muted">
              No query log matches identifier <code className="font-mono text-foreground font-semibold">"{id || 'empty'}"</code>. The record does not exist in local IndexedDB storage.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center pt-4 border-t-0">
            <Link to="/breach-history">
              <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Return to Breach History
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title={`Breach Query Detail: #${record.id.slice(0, 8)}`}
        description="Mathematical verification of k-anonymity range query and sanitized incident parameters."
        badge={
          <Badge variant={record.isBreached ? 'rose' : 'emerald'} size="sm" dot>
            {record.isBreached ? 'Exposed in Breaches' : 'Clean / Safe'}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/breach-history">
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
        {/* Query Audit Record Card */}
        <Card variant="default" padding="lg" className="bg-surface border-border">
          <CardHeader className="px-0 pt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {record.isBreached ? (
                  <ShieldAlert className="w-4 h-4 text-danger" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                )}
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted">
                  QUERY AUDIT RECORD
                </CardTitle>
              </div>
              <span className="font-mono text-[10px] text-muted uppercase">k-ANONYMITY RANGE</span>
            </div>
            <CardDescription className="text-xs text-muted mt-1">
              Sanitized analytical metadata from the k-anonymity range verification.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-0 pb-0 space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted flex items-center gap-1.5 font-mono">
                <Hash className="w-3.5 h-3.5 text-accent" /> Query ID
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
              <span className="text-muted">Exposure Status</span>
              {record.isBreached ? (
                <Badge variant="rose" size="sm" dot>
                  Compromised ({record.breachCount.toLocaleString()} incidents)
                </Badge>
              ) : (
                <Badge variant="emerald" size="sm" dot>
                  Clean in queried dataset (0 occurrences)
                </Badge>
              )}
            </div>

            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted">Recorded Occurrence Count</span>
              <span className="font-mono text-foreground font-semibold text-base">
                {record.isBreached ? record.breachCount.toLocaleString() : '0'}
              </span>
            </div>
          </CardContent>

          {record.isBreached && (
            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
              <span className="text-xs text-muted">Vulnerable credential?</span>
              <Link to="/generator">
                <Button variant="outline" size="sm" leftIcon={<KeyRound className="w-3.5 h-3.5" />}>
                  Generate Stronger
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Privacy Boundary Assertion Card */}
        <Card variant="default" padding="lg" className="bg-surface border-border flex flex-col justify-between">
          <div>
            <CardHeader className="px-0 pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-accent" />
                  <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted">
                    ZERO-KNOWLEDGE PRIVACY ASSERTION
                  </CardTitle>
                </div>
                <span className="font-mono text-[10px] text-muted uppercase">CLIENT ENCLAVE</span>
              </div>
              <CardDescription className="text-xs text-muted mt-1">
                Formal cryptographic invariants preserved during this query.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-0 pb-0 space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-background-base/60 border border-border">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-muted leading-relaxed">
                  <strong className="text-foreground">Zero Plaintext Secrets:</strong> Original passwords, full SHA-1 digests, suffixes, and prefixes are never persisted in IndexedDB or browser cache.
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-background-base/60 border border-border">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-muted leading-relaxed">
                  <strong className="text-foreground">Mathematical k-Anonymity:</strong> Only a 5-character prefix was transmitted to HIBP. The remaining 35 characters were compared entirely in the client browser.
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-background-base/60 border border-border">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-muted leading-relaxed">
                  <strong className="text-foreground">Non-Reversible Metadata:</strong> This record retains only query outcome statistics. No password-derived tokens can be reconstituted from this data.
                </p>
              </div>
            </CardContent>
          </div>

          <div className="mt-6 pt-4 border-t border-border/50 text-[11px] text-muted flex items-center justify-between font-mono">
            <span>STORAGE: INDEXEDDB // BREACH_HISTORY</span>
            <span className="text-emerald-500 font-semibold">PERSISTED</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
