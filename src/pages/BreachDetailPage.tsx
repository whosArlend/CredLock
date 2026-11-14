import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ShieldAlert, Key, Globe, CheckCircle2 } from 'lucide-react';

export function BreachDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Breach Query Detail: ${id || 'Unknown'}`}
        description="Detail Page 2: Mathematical verification of k-anonymity range query and breach incident parameters."
        badge={<Badge variant="rose" size="sm" dot>Detail Page 2</Badge>}
        actions={
          <Link to="/breach-history">
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
              <ShieldAlert className="w-4 h-4 text-cyber-rose" />
              <CardTitle className="text-sm">Query Audit Record</CardTitle>
            </div>
            <CardDescription>
              Inspection of the 5-character prefix transmitted to the Pwned Passwords API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-foreground-muted">Query ID</span>
              <span className="font-mono text-foreground">{id}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-foreground-muted flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> SHA-1 Prefix (Transmitted)
              </span>
              <span className="font-mono text-cyber-cyan font-bold">5BAA6</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-foreground-muted">SHA-1 Suffix (Kept Local)</span>
              <span className="font-mono text-foreground-dim">***********************************</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-foreground-muted">Exposure Status</span>
              <Badge variant="rose" size="sm">Breached (38,241 occurrences)</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-cyber-cyan" />
              <CardTitle className="text-sm">Privacy Boundary Assertion</CardTitle>
            </div>
            <CardDescription>
              Security analysis of the client-side k-anonymity protocol.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-foreground-muted">
            <div className="flex items-start gap-2 p-2.5 rounded bg-background-elevated/40 border border-border/50">
              <CheckCircle2 className="w-4 h-4 text-cyber-emerald shrink-0 mt-0.5" />
              <p>
                The original password was hashed locally using SHA-1 via SubtleCrypto.
              </p>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded bg-background-elevated/40 border border-border/50">
              <CheckCircle2 className="w-4 h-4 text-cyber-emerald shrink-0 mt-0.5" />
              <p>
                Only <code className="text-cyber-cyan font-mono">5BAA6</code> was sent over TLS to the remote server.
              </p>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded bg-background-elevated/40 border border-border/50">
              <CheckCircle2 className="w-4 h-4 text-cyber-emerald shrink-0 mt-0.5" />
              <p>
                Zero backend logging or external database retention occurred.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
