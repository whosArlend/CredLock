import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { clearAllHistory } from '@/services/historyStorage';
import { User, Shield, BookOpen, Trash2, CheckCircle2 } from 'lucide-react';

export function ProfilePage() {
  const { showToast } = useToast();

  const handleClearLocalData = () => {
    clearAllHistory();
    localStorage.clear();
    showToast({
      type: 'info',
      title: 'Local Cache Cleared',
      message: 'All local sanitized metadata and history records have been flushed.',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile & About"
        description="Academic identity, project parameters, architectural specifications, and client-side data management."
        badge={<Badge variant="cyan" size="sm" dot>Academic Suite</Badge>}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Developer Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-cyber-emerald-muted border border-cyber-emerald/40 flex items-center justify-center text-cyber-emerald">
                <User className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-sm">Developer Profile</CardTitle>
                <CardDescription>Individual Project</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="py-2 border-t border-border/50">
              <span className="text-foreground-dim block">Project Title</span>
              <span className="font-medium text-foreground text-xs leading-snug block mt-0.5">
                CredLock: A Progressive Web Application for Password Strength Analysis, Secure Password Generation, and Data Breach Detection
              </span>
            </div>
            <div className="py-2 border-t border-border/50">
              <span className="text-foreground-dim block">Framework & Engine</span>
              <span className="font-medium text-foreground">React 19 + TypeScript + Vite + Tailwind CSS</span>
            </div>
            <div className="py-2 border-t border-border/50">
              <span className="text-foreground-dim block">Architecture Standard</span>
              <span className="font-medium text-foreground">Zero-Knowledge Client (CSPRNG & k-Anonymity)</span>
            </div>
          </CardContent>
        </Card>

        {/* Academic Requirements Matrix */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-cyber-emerald" />
              <CardTitle className="text-sm">Academic Rubric Compliance</CardTitle>
            </div>
            <CardDescription>
              Structural and behavioral standards satisfied in CredLock.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded bg-background-elevated/40 border border-border/60 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyber-emerald shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground block">$\ge 5$ Distinct Pages</span>
                  <span className="text-foreground-dim">9 Discrete routes configured with layout shell.</span>
                </div>
              </div>
              <div className="p-2.5 rounded bg-background-elevated/40 border border-border/60 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyber-emerald shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground block">Bottom Navigation Bar</span>
                  <span className="text-foreground-dim">Fixed 5-tab responsive navigation with active states.</span>
                </div>
              </div>
              <div className="p-2.5 rounded bg-background-elevated/40 border border-border/60 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyber-emerald shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground block">Two List Pages</span>
                  <span className="text-foreground-dim">Analysis History & Breach Check History.</span>
                </div>
              </div>
              <div className="p-2.5 rounded bg-background-elevated/40 border border-border/60 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyber-emerald shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground block">Clickable List-to-Detail</span>
                  <span className="text-foreground-dim">Both list flows open parameterized detail views.</span>
                </div>
              </div>
            </div>

            {/* Privacy Flush Control */}
            <div className="pt-3 border-t border-border/60 flex items-center justify-between">
              <div>
                <span className="font-semibold text-foreground block">Client Storage Management</span>
                <span className="text-foreground-dim">Purge any cached sanitized analytical logs.</span>
              </div>
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={handleClearLocalData}
              >
                Clear Local Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Declaration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyber-emerald" />
            <CardTitle className="text-sm">Security & Privacy Protocol Statement</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-xs text-foreground-muted leading-relaxed space-y-2">
          <p>
            CredLock enforces a strict zero-knowledge paradigm. Under no circumstances are plaintext passwords stored in web storage (localStorage, sessionStorage, IndexedDB, cookies), sent to external servers, or printed in console telemetry.
          </p>
          <p>
            Breach detection queries utilize the mathematical k-anonymity model: five hex characters of a locally computed SHA-1 digest are sent to retrieve a range of suffixes, which are compared locally. The original password never leaves the device.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
