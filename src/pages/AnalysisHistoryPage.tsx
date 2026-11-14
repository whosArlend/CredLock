import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { History, ArrowRight, ShieldCheck, Plus } from 'lucide-react';

// Sample demonstration records for verifying list-to-detail routing
const SAMPLE_ANALYSIS_RECORDS = [
  {
    id: 'rec-001',
    timestamp: '2026-11-14T14:30:00Z',
    passwordLength: 16,
    entropyBits: 84.2,
    score: 4,
    crackTimeDisplay: '2.4 million years',
  },
  {
    id: 'rec-002',
    timestamp: '2026-11-14T12:15:00Z',
    passwordLength: 8,
    entropyBits: 38.5,
    score: 1,
    crackTimeDisplay: '42 minutes',
  },
];

export function AnalysisHistoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analysis History"
        description="List Page 1: Historical records of evaluated passwords with strictly sanitized metadata."
        badge={<Badge variant="neutral" size="sm">List Page 1</Badge>}
        actions={
          <Link to="/analyzer">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              New Analysis
            </Button>
          </Link>
        }
      />

      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-dim flex items-center gap-1.5">
          <History className="w-3.5 h-3.5" />
          Clickable Analysis Logs (Demonstrating List-to-Detail Flow)
        </h2>

        {SAMPLE_ANALYSIS_RECORDS.map((record) => (
          <Card key={record.id} isInteractive className="group">
            <Link to={`/analysis-history/${record.id}`} className="block">
              <CardHeader className="p-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyber-emerald-muted text-cyber-emerald border border-cyber-emerald/20">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm">Log Entry #{record.id}</CardTitle>
                        <Badge
                          variant={record.score >= 3 ? 'emerald' : 'amber'}
                          size="sm"
                        >
                          Score {record.score}/4
                        </Badge>
                      </div>
                      <CardDescription className="mt-0.5">
                        Length: {record.passwordLength} chars • Entropy: {record.entropyBits} bits • Crack time: {record.crackTimeDisplay}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-foreground-dim group-hover:text-cyber-emerald transition-colors">
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
