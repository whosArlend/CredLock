import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ShieldCheck, Check, X, Clock, Hash, Calendar, SearchX } from 'lucide-react';
import { getAnalysisRecordById } from '@/services/historyStorage';

export function AnalysisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const record = getAnalysisRecordById(id);

  if (!record) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <PageHeader
          title="Record Not Found"
          description="The requested password analysis record could not be found."
          actions={
            <Link to="/analysis-history">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to History
              </Button>
            </Link>
          }
        />

        <Card className="max-w-lg mx-auto text-center py-8">
          <CardHeader className="items-center">
            <div className="p-3 rounded-full bg-cyber-amber-muted text-cyber-amber mb-3 border border-cyber-amber-border">
              <SearchX className="w-8 h-8" />
            </div>
            <CardTitle className="text-lg">Analysis Record Unavailable</CardTitle>
            <CardDescription className="max-w-sm mt-1">
              No sanitized log matches the identifier <code className="font-mono text-foreground font-semibold">"{id || 'empty'}"</code>. The record may have expired from memory or was purged.
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
        title={`Analysis Detail: ${record.id}`}
        description="Detail Page 1: Deep inspection of sanitized algorithmic metrics and entropy breakdown."
        badge={
          <Badge variant={scoreBadgeVariant} size="sm" dot>
            Score {record.score}/4
          </Badge>
        }
        actions={
          <Link to="/analysis-history">
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to History
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cryptographic Metrics Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-cyber-emerald" />
              <CardTitle className="text-sm">Cryptographic Metrics</CardTitle>
            </div>
            <CardDescription>
              Mathematical strength metrics calculated client-side in browser sandbox.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-foreground-muted flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" /> Record Identifier
              </span>
              <span className="font-mono text-foreground font-semibold">{record.id}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-foreground-muted flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Timestamp (ISO 8601)
              </span>
              <span className="font-mono text-foreground">{record.timestamp}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-foreground-muted">Calculated Entropy</span>
              <span className="font-mono text-cyber-emerald font-semibold">{record.entropyBits} bits</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-foreground-muted">Length</span>
              <span className="font-mono text-foreground">{record.passwordLength} characters</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-foreground-muted flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Estimated Crack Time
              </span>
              <span className="font-mono text-foreground">{record.crackTimeDisplay}</span>
            </div>
          </CardContent>
        </Card>

        {/* Character Composition Guard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Character Diversity Audit</CardTitle>
            <CardDescription>
              Sanitized pool breakdown confirming character variety.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded bg-background-elevated/40 border border-border/40">
              <span className="text-foreground-muted">Uppercase Letters (A-Z)</span>
              {record.hasUppercase ? (
                <Badge variant="emerald" size="sm"><Check className="w-3 h-3 mr-1" /> Present</Badge>
              ) : (
                <Badge variant="neutral" size="sm"><X className="w-3 h-3 mr-1" /> Missing</Badge>
              )}
            </div>
            <div className="flex items-center justify-between p-2.5 rounded bg-background-elevated/40 border border-border/40">
              <span className="text-foreground-muted">Lowercase Letters (a-z)</span>
              {record.hasLowercase ? (
                <Badge variant="emerald" size="sm"><Check className="w-3 h-3 mr-1" /> Present</Badge>
              ) : (
                <Badge variant="neutral" size="sm"><X className="w-3 h-3 mr-1" /> Missing</Badge>
              )}
            </div>
            <div className="flex items-center justify-between p-2.5 rounded bg-background-elevated/40 border border-border/40">
              <span className="text-foreground-muted">Numeric Digits (0-9)</span>
              {record.hasNumbers ? (
                <Badge variant="emerald" size="sm"><Check className="w-3 h-3 mr-1" /> Present</Badge>
              ) : (
                <Badge variant="neutral" size="sm"><X className="w-3 h-3 mr-1" /> Missing</Badge>
              )}
            </div>
            <div className="flex items-center justify-between p-2.5 rounded bg-background-elevated/40 border border-border/40">
              <span className="text-foreground-muted">Special Symbols</span>
              {record.hasSymbols ? (
                <Badge variant="emerald" size="sm"><Check className="w-3 h-3 mr-1" /> Present</Badge>
              ) : (
                <Badge variant="neutral" size="sm"><X className="w-3 h-3 mr-1" /> Missing</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
