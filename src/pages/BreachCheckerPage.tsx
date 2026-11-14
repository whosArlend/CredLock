import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, History } from 'lucide-react';

export function BreachCheckerPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Password Breach Checker"
        description="Verify password exposure against known data leaks using the k-Anonymity mathematical privacy model."
        badge={<Badge variant="rose" size="sm" dot>k-Anonymity</Badge>}
        actions={
          <Link to="/breach-history">
            <Button variant="secondary" size="sm" leftIcon={<History className="w-4 h-4" />}>
              View History
            </Button>
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-cyber-rose" />
            <CardTitle>Core Feature 3 Engine Shell</CardTitle>
          </div>
          <CardDescription>
            The breach checking engine implementation is scheduled for Phase 2.4.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs text-foreground-muted">
          <p>
            Privacy Guarantee:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Local SHA-1 hash computation via Web Crypto SubtleCrypto</li>
            <li>Only the first 5 characters (prefix) are sent across the network</li>
            <li>Remaining 35 characters are matched client-side</li>
            <li>Plaintext passwords are never transmitted or logged anywhere</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
