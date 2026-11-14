import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ShieldAlert, ShieldCheck, Globe, CheckCircle2, Calendar, SearchX, Hash } from 'lucide-react';
import { getBreachRecordById } from '@/services/historyStorage';

export function BreachDetailPage() {
  const { id } = useParams<{ id: string }>();
  const record = getBreachRecordById(id);

  if (!record) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <PageHeader
          title="Record Not Found"
          description="The requested breach check query record could not be found."
          actions={
            <Link to="/breach-history">
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
            <CardTitle className="text-lg">Breach Record Unavailable</CardTitle>
            <CardDescription className="max-w-sm mt-1">
              No query log matches the identifier <code className="font-mono text-foreground font-semibold">"{id || 'empty'}"</code>. The query record does not exist in local session memory.
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
        title={`Breach Query Detail: ${record.id}`}
        description="Detail Page 2: Mathematical verification of k-anonymity range query and breach incident parameters."
        badge={
          <Badge variant={record.isBreached ? 'rose' : 'emerald'} size="sm" dot>
            {record.isBreached ? 'Exposed in Breaches' : 'Clean / Safe'}
          </Badge>
        }
        actions={
          <Link to="/breach-history">
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to History
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Query Audit Record Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              {record.isBreached ? (
                <ShieldAlert className="w-4 h-4 text-cyber-rose" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-cyber-emerald" />
              )}
              <CardTitle className="text-sm">Query Audit Record</CardTitle>
            </div>
            <CardDescription>
              Sanitized analytical metadata from the k-anonymity verification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-foreground-muted flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" /> Query ID
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
              <span className="text-foreground-muted">Exposure Status</span>
              {record.isBreached ? (
                <Badge variant="rose" size="sm">
                  Breached ({record.breachCount.toLocaleString()} occurrences)
                </Badge>
              ) : (
                <Badge variant="emerald" size="sm">
                  Safe (0 occurrences found)
                </Badge>
              )}
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-foreground-muted">Recorded Occurrence Count</span>
              <span className="font-mono text-foreground font-semibold">
                {record.isBreached ? record.breachCount.toLocaleString() : '0'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Boundary Assertion Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-cyber-cyan" />
              <CardTitle className="text-sm">Privacy Boundary Assertion</CardTitle>
            </div>
            <CardDescription>
              Security analysis of zero-knowledge query persistence.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-foreground-muted">
            <div className="flex items-start gap-2 p-2.5 rounded bg-background-elevated/40 border border-border/50">
              <CheckCircle2 className="w-4 h-4 text-cyber-emerald shrink-0 mt-0.5" />
              <p>
                Original passwords, full SHA-1 hashes, suffixes, and SHA-1 prefixes are never persisted.
              </p>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded bg-background-elevated/40 border border-border/50">
              <CheckCircle2 className="w-4 h-4 text-cyber-emerald shrink-0 mt-0.5" />
              <p>
                Only non-sensitive query metadata (record ID, timestamp, breach status, and occurrence count) is retained.
              </p>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded bg-background-elevated/40 border border-border/50">
              <CheckCircle2 className="w-4 h-4 text-cyber-emerald shrink-0 mt-0.5" />
              <p>
                No password-derived identifiers are retained in history.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
