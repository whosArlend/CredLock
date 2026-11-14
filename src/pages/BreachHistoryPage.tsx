import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, ArrowRight, ShieldAlert, Plus } from 'lucide-react';

// Sample demonstration records for verifying list-to-detail routing
const SAMPLE_BREACH_RECORDS = [
  {
    id: 'brc-101',
    timestamp: '2026-11-14T14:45:00Z',
    hashPrefix: '5BAA6',
    isBreached: true,
    breachCount: 38241,
  },
  {
    id: 'brc-102',
    timestamp: '2026-11-14T13:20:00Z',
    hashPrefix: 'E2A89',
    isBreached: false,
    breachCount: 0,
  },
];

export function BreachHistoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Breach Check History"
        description="List Page 2: Historical k-anonymity queries showing 5-character prefixes and occurrence rates."
        badge={<Badge variant="neutral" size="sm">List Page 2</Badge>}
        actions={
          <Link to="/breach-checker">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              New Check
            </Button>
          </Link>
        }
      />

      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-dim flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          Clickable Breach Records (Demonstrating List-to-Detail Flow)
        </h2>

        {SAMPLE_BREACH_RECORDS.map((record) => (
          <Card key={record.id} isInteractive className="group">
            <Link to={`/breach-history/${record.id}`} className="block">
              <CardHeader className="p-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyber-rose-muted text-cyber-rose border border-cyber-rose/20">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm">Query #{record.id}</CardTitle>
                        <Badge
                          variant={record.isBreached ? 'rose' : 'emerald'}
                          size="sm"
                          dot
                        >
                          {record.isBreached ? `${record.breachCount.toLocaleString()} Leaks` : 'Clean / Safe'}
                        </Badge>
                      </div>
                      <CardDescription className="mt-0.5">
                        Prefix: <span className="font-mono text-foreground font-semibold">{record.hashPrefix}***</span> • k-Anonymity Verified
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-foreground-dim group-hover:text-cyber-rose transition-colors">
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </CardHeader>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
