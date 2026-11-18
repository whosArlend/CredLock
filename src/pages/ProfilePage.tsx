import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { clearAllHistoryAsync } from '@/services/historyStorage';
import { User, Shield, BookOpen, Trash2, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export function ProfilePage() {
  const { showToast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearLocalData = async () => {
    try {
      setIsClearing(true);
      await clearAllHistoryAsync();

      // Only clean CredLock-scoped keys from localStorage if present, avoid wiping other apps
      if (typeof window !== 'undefined' && window.localStorage) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('credlock') || key.startsWith('analysis') || key.startsWith('breach'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      }

      showToast({
        type: 'info',
        title: 'Local Storage Purged',
        message: 'All local sanitized metadata and IndexedDB records have been flushed.',
      });
      setShowConfirm(false);
    } catch {
      showToast({
        type: 'error',
        title: 'Purge Failed',
        message: 'Unable to completely flush IndexedDB storage.',
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Profile & About"
        description="Academic identity, project parameters, architectural specifications, and client-side data management."
        badge={<Badge variant="neutral" size="sm">Academic Suite</Badge>}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Developer Profile Card */}
        <Card variant="default" padding="lg" className="md:col-span-1 bg-surface border-border">
          <CardHeader className="px-0 pt-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-accent">
                <User className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-foreground">Developer Profile</CardTitle>
                <CardDescription className="text-xs text-muted">Individual Academic Project</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0 space-y-3 text-xs">
            <div className="py-2.5 border-t border-border/60">
              <span className="text-muted block font-mono text-[11px] uppercase">Project Title</span>
              <span className="font-medium text-foreground text-xs leading-snug block mt-1">
                CredLock: A Progressive Web Application for Password Strength Analysis, Secure Password Generation, and Data Breach Detection
              </span>
            </div>
            <div className="py-2.5 border-t border-border/60">
              <span className="text-muted block font-mono text-[11px] uppercase">Framework & Engine</span>
              <span className="font-medium text-foreground block mt-0.5">React 19 + TypeScript + Vite + Tailwind CSS + IndexedDB</span>
            </div>
            <div className="py-2.5 border-t border-border/60">
              <span className="text-muted block font-mono text-[11px] uppercase">Architecture Standard</span>
              <span className="font-medium text-foreground block mt-0.5">Zero-Knowledge Client (CSPRNG, k-Anonymity & Local IndexedDB)</span>
            </div>
          </CardContent>
        </Card>

        {/* Academic Requirements Matrix & Data Management */}
        <Card variant="default" padding="lg" className="md:col-span-2 bg-surface border-border flex flex-col justify-between">
          <div>
            <CardHeader className="px-0 pt-0">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-accent" />
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted">
                  ACADEMIC RUBRIC COMPLIANCE
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted">
                Structural and behavioral standards satisfied in CredLock.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-0 pb-0 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-background-base/60 border border-border flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground block">&ge; 5 Distinct Pages</span>
                    <span className="text-muted text-[11px]">9 Discrete routes configured with layout shell.</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-background-base/60 border border-border flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground block">Bottom Navigation Bar</span>
                    <span className="text-muted text-[11px]">Fixed 5-tab responsive navigation with active states.</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-background-base/60 border border-border flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground block">Two List Pages</span>
                    <span className="text-muted text-[11px]">Analysis History & Breach Check History.</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-background-base/60 border border-border flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground block">IndexedDB Persistence</span>
                    <span className="text-muted text-[11px]">Persistent transactional storage via credlock-db.</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>

          {/* Privacy Flush Control */}
          <div className="mt-6 pt-4 border-t border-border/60">
            {!showConfirm ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-semibold text-foreground text-xs block">Client Storage Management</span>
                  <span className="text-muted text-[11px]">Wipe all local sanitized analytical logs and breach records from IndexedDB.</span>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => setShowConfirm(true)}
                  className="w-full sm:w-auto shrink-0"
                >
                  Clear Local Data
                </Button>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-danger/10 border border-danger/30 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-foreground">
                      Confirm Complete Local Data Wipe?
                    </h4>
                    <p className="text-[11px] text-muted leading-relaxed">
                      This will delete all saved password evaluation logs and breach query records from IndexedDB (<code className="font-mono text-foreground">credlock-db</code>). This action cannot be reversed.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<X className="w-3.5 h-3.5" />}
                    onClick={() => setShowConfirm(false)}
                    disabled={isClearing}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    isLoading={isClearing}
                    onClick={handleClearLocalData}
                  >
                    Yes, Delete Everything
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Security Declaration */}
      <Card variant="default" padding="lg" className="bg-surface border-border">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted">
              SECURITY & PRIVACY PROTOCOL STATEMENT
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0 text-xs text-muted leading-relaxed space-y-2">
          <p>
            CredLock enforces a strict zero-knowledge paradigm. Under no circumstances are plaintext passwords stored in web storage (localStorage, sessionStorage, IndexedDB, cookies), sent to external servers, or printed in console telemetry.
          </p>
          <p>
            Breach detection queries utilize the mathematical k-anonymity model: five hex characters of a locally computed SHA-1 digest are sent to retrieve a range of suffixes, which are compared locally. The original password never leaves the device.
          </p>
          <p className="text-[11px] text-muted-dim font-mono">
            * Note on memory security: CredLock minimizes credential lifetimes in transient JavaScript memory, but in accordance with standard browser security models, JavaScript does not guarantee cryptographic hardware memory zeroing.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
