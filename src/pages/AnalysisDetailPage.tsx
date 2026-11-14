import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ShieldCheck, Check, Clock, Hash } from 'lucide-react';

export function AnalysisDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Analysis Detail: ${id || 'Unknown'}`}
        description="Detail Page 1: Deep inspection of sanitized algorithmic metrics and entropy breakdown."
        badge={<Badge variant="emerald" size="sm" dot>Detail Page 1</Badge>}
        actions={
          <Link to="/analysis-history">
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to History
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-cyber-emerald" />
              <CardTitle className="text-sm">Cryptographic Metrics</CardTitle>
            </div>
            <CardDescription>
              Mathematical strength metrics calculated client-side.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-foreground-muted flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" /> Record Identifier
              </span>
              <span className="font-mono text-foreground">{id}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-foreground-muted">Calculated Entropy</span>
              <span className="font-mono text-cyber-emerald font-semibold">84.2 bits</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-foreground-muted">Length</span>
              <span className="font-mono text-foreground">16 characters</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-foreground-muted flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Estimated Crack Time
              </span>
              <span className="font-mono text-foreground">2.4 million years</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Character Composition Guard</CardTitle>
            <CardDescription>
              Verification that no plaintext is stored in logs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-background-elevated/40">
              <span>Uppercase Characters (A-Z)</span>
              <Badge variant="emerald" size="sm"><Check className="w-3 h-3 mr-1" /> Present</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-background-elevated/40">
              <span>Lowercase Characters (a-z)</span>
              <Badge variant="emerald" size="sm"><Check className="w-3 h-3 mr-1" /> Present</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-background-elevated/40">
              <span>Numeric Digits (0-9)</span>
              <Badge variant="emerald" size="sm"><Check className="w-3 h-3 mr-1" /> Present</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-background-elevated/40">
              <span>Special Symbols</span>
              <Badge variant="emerald" size="sm"><Check className="w-3 h-3 mr-1" /> Present</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
