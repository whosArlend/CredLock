import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { KeyRound } from 'lucide-react';

export function GeneratorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Secure Password Generator"
        description="High-entropy random password generation powered exclusively by the Web Crypto API."
        badge={<Badge variant="cyan" size="sm" dot>CSPRNG Powered</Badge>}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <KeyRound className="w-5 h-5 text-cyber-cyan" />
            <CardTitle>Core Feature 2 Engine Shell</CardTitle>
          </div>
          <CardDescription>
            The generator engine implementation is scheduled for Phase 2.3.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs text-foreground-muted">
          <p>
            This page will feature:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Uniform random byte sampling via <code className="text-cyber-cyan">window.crypto.getRandomValues()</code></li>
            <li>Configurable length (8 to 64 characters)</li>
            <li>Selective character sets (Uppercase, Lowercase, Digits, Symbols)</li>
            <li>Zero-latency local generation with secure clipboard export</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
