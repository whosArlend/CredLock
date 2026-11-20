import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4 animate-in fade-in duration-200 text-left">
      <div className="max-w-md w-full text-center py-10 px-6 rounded-2xl bg-surface border border-border/80 shadow-lg space-y-4">
        <div className="mx-auto w-12 h-12 rounded-xl bg-status-danger/10 text-status-danger border border-status-danger/20 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold font-sans tracking-tight text-foreground">
            404 — Endpoint Not Found
          </h1>
          <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed font-sans">
            The requested security route or audit record identifier does not exist or has been relocated.
          </p>
        </div>
        <div className="pt-2">
          <Link to="/">
            <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Return to Security Center
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
