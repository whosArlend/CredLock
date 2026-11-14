import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, ArrowRight, ShieldAlert, Plus, ArrowLeft, ShieldCheck, History } from 'lucide-react';
import { getBreachRecords } from '@/services/historyStorage';

export function BreachHistoryPage() {
  const records = getBreachRecords();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Breach Check History"
        description="List Page 2: Historical log of executed breach verification checks with sanitized metadata."
        badge={<Badge variant="neutral" size="sm">List Page 2</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/breach-checker">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Breach Checker
              </Button>
            </Link>
            <Link to="/breach-checker">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                New Check
              </Button>
            </Link>
          </div>
        }
      />

      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-dim flex items-center gap-1.5">
          <History className="w-3.5 h-3.5" />
          Breach Check Records
        </h2>

        {records.length === 0 ? (
          <Card className="text-center py-10">
            <CardHeader className="items-center pb-2">
              <div className="p-3 rounded-full bg-cyber-cyan-muted text-cyber-cyan mb-3 border border-cyber-cyan/30">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <CardTitle className="text-base">No Breach Records Found</CardTitle>
              <CardDescription className="max-w-md mx-auto mt-1">
                No breach queries have been performed yet. When you verify a password against known data breaches in the Breach Checker, the sanitized results will appear here.
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center border-t-0 pt-4">
              <Link to="/breach-checker">
                <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                  Run a Breach Check
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ) : (
          records.map((record) => (
            <Card key={record.id} isInteractive className="group">
              <Link
                to={`/breach-history/${record.id}`}
                className="block focus:outline-none"
                aria-label={`Inspect breach query entry ${record.id}`}
              >
                <CardHeader className="p-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyber-rose-muted text-cyber-rose border border-cyber-rose/20">
                        {record.isBreached ? (
                          <ShieldAlert className="w-4 h-4" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-cyber-emerald" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm">Query #{record.id}</CardTitle>
                          <Badge
                            variant={record.isBreached ? 'rose' : 'emerald'}
                            size="sm"
                            dot
                          >
                            {record.isBreached
                              ? `${record.breachCount.toLocaleString()} Leaks`
                              : 'Clean / Safe'}
                          </Badge>
                        </div>
                        <CardDescription className="mt-0.5">
                          Timestamp: {record.timestamp} • {record.isBreached ? `Found in ${record.breachCount.toLocaleString()} incidents` : 'Zero breach occurrences detected'}
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
          ))
        )}
      </div>
    </div>
  );
}
