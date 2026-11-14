import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { History, ArrowRight, ShieldCheck, Plus, ArrowLeft } from 'lucide-react';
import { getAnalysisRecords } from '@/services/historyStorage';

export function AnalysisHistoryPage() {
  const records = getAnalysisRecords();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Analysis History"
        description="List Page 1: Historical records of evaluated passwords with strictly sanitized metadata."
        badge={<Badge variant="neutral" size="sm">List Page 1</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/analyzer">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Analyzer
              </Button>
            </Link>
            <Link to="/analyzer">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                New Analysis
              </Button>
            </Link>
          </div>
        }
      />

      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-dim flex items-center gap-1.5">
          <History className="w-3.5 h-3.5" />
          Password Strength Analysis Records
        </h2>

        {records.length === 0 ? (
          <Card className="text-center py-10">
            <CardHeader className="items-center pb-2">
              <div className="p-3 rounded-full bg-cyber-emerald-muted text-cyber-emerald mb-3 border border-cyber-emerald/30">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <CardTitle className="text-base">No Analysis History Found</CardTitle>
              <CardDescription className="max-w-md mx-auto mt-1">
                No password strength evaluations have been performed yet. When you analyze a password, its sanitized evaluation score and entropy metrics will appear here. Passwords are never stored.
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center border-t-0 pt-4">
              <Link to="/analyzer">
                <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                  Analyze a Password
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ) : (
          records.map((record) => (
            <Card key={record.id} isInteractive className="group">
              <Link
                to={`/analysis-history/${record.id}`}
                className="block focus:outline-none"
                aria-label={`Inspect analysis entry ${record.id}`}
              >
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
                            variant={record.score >= 3 ? 'emerald' : record.score === 2 ? 'amber' : 'rose'}
                            size="sm"
                          >
                            Score {record.score}/4
                          </Badge>
                        </div>
                        <CardDescription className="mt-0.5">
                          Length: {record.passwordLength} chars • Crack Difficulty: {record.entropyBits} bits • Crack time: {record.crackTimeDisplay}
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
          ))
        )}
      </div>
    </div>
  );
}
