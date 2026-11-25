import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { clearLocalUserDataAsync } from '@/services/historyStorage';
import { AuthModal } from '@/features/auth';
import {
  Shield,
  Layers,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Code,
  KeyRound,
  Database,
  Lock,
  Cpu,
  ChevronDown,
  Cloud,
  User,
  ArrowRight,
} from 'lucide-react';

export function ProfilePage() {
  const { user, profile, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Derived operative identity matching Header conventions
  const operativeUsername = profile?.username || (user?.user_metadata?.username as string) || null;

  const handleClearLocalData = async () => {
    try {
      setIsClearing(true);
      await clearLocalUserDataAsync();

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
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* Page Header */}
      <PageHeader
        title="About CredLock"
        description="Client-side security architecture, verified technology stack, and local data sovereignty."
        badge={<Badge variant="neutral" size="sm">v1.0.0 // Client Enclave</Badge>}
      />

      {/* 1. Project Overview & Identity Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-enclave-plate/90 border border-enclave-border/80 shadow-plate-tactical relative overflow-hidden space-y-3">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-accent uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5" />
          <span>Project Identity & Architectural Purpose</span>
        </div>
        <h2 className="text-base sm:text-lg font-bold text-foreground font-sans tracking-tight">
          Client-Side Password Security & Privacy Environment
        </h2>
        <p className="text-xs sm:text-sm text-muted leading-relaxed font-sans">
          CredLock is an academic Progressive Web Application designed for client-side password strength analysis, cryptographic credential generation, and data breach detection. All evaluations and key generations execute in local browser memory. When breach lookups are performed, only a truncated 5-character hash prefix is transmitted using the k-Anonymity privacy model.
        </p>
      </div>

      {/* 2. Core Capabilities (3-Column Grid) */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-muted">
          <Layers className="w-3.5 h-3.5 text-accent" />
          <span>Core Security Capabilities</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Capability 1 */}
          <div className="p-4 rounded-xl bg-enclave-plate/80 border border-enclave-border/80 shadow-card-tactical space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-accent">01 // ANALYZER</span>
              <Shield className="w-4 h-4 text-muted-dim" />
            </div>
            <h3 className="text-xs font-bold text-foreground font-sans">Strength Analysis</h3>
            <p className="text-[11px] text-muted leading-relaxed font-sans">
              Evaluates entropy, dictionary patterns, and estimated crack difficulty in local memory via @zxcvbn-ts.
            </p>
          </div>

          {/* Capability 2 */}
          <div className="p-4 rounded-xl bg-enclave-plate/80 border border-enclave-border/80 shadow-card-tactical space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-accent">02 // GENERATOR</span>
              <KeyRound className="w-4 h-4 text-muted-dim" />
            </div>
            <h3 className="text-xs font-bold text-foreground font-sans">Secure Generation</h3>
            <p className="text-[11px] text-muted leading-relaxed font-sans">
              Creates high-entropy passwords with Web Crypto CSPRNG and candidate rejection sampling for uniform distribution.
            </p>
          </div>

          {/* Capability 3 */}
          <div className="p-4 rounded-xl bg-enclave-plate/80 border border-enclave-border/80 shadow-card-tactical space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-accent">03 // BREACH CHECK</span>
              <Database className="w-4 h-4 text-muted-dim" />
            </div>
            <h3 className="text-xs font-bold text-foreground font-sans">Breach Verification</h3>
            <p className="text-[11px] text-muted leading-relaxed font-sans">
              Verifies credential exposure against known leak databases using mathematical k-Anonymity hash-range queries.
            </p>
          </div>
        </div>
      </div>

      {/* 3. 2-Column Responsive Architecture Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Column: Privacy & Security Invariants */}
        <div className="rounded-xl bg-enclave-plate/90 border border-enclave-border/80 shadow-plate-tactical p-5 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-enclave-border/60">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-accent" />
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
                  Privacy & Cryptographic Invariants
                </h3>
              </div>
              <span className="font-mono text-[10px] text-muted-dim uppercase">Enclave Model</span>
            </div>

            <p className="text-xs text-muted leading-relaxed font-sans">
              CredLock executes calculations entirely client-side. Passwords are never sent across the network, logged, or stored. Local history archives only sanitized metadata (length, score, entropy, and exposure counts) in IndexedDB (<code className="font-mono text-foreground font-semibold">credlock-db</code>).
            </p>

            {/* Progressive Disclosure: Technical Declarations */}
            <details className="group border-t border-enclave-border/60 pt-2.5 text-xs">
              <summary className="cursor-pointer font-mono text-[11px] text-accent hover:underline flex items-center justify-between select-none focus:outline-none">
                <span>View Technical Security Boundaries</span>
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
              </summary>

              <div className="mt-3 space-y-2 text-[11px] text-muted leading-relaxed">
                <div className="p-2.5 rounded-lg bg-enclave-void/70 border border-enclave-border/60 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-foreground">In-Memory Processing:</strong> Plaintext credentials exist solely in component memory during analysis. Neither passwords nor full hashes are ever written to disk.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-enclave-void/70 border border-enclave-border/60 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-foreground">Probabilistic Models:</strong> Heuristic crack estimations and absence from known leak archives do not provide absolute mathematical invulnerability against targeted offline brute force.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-enclave-void/70 border border-enclave-border/60 flex items-start gap-2">
                  <Cpu className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                  <p className="font-mono text-[10px] text-muted-dim">
                    * Note on browser runtimes: Under JavaScript garbage collection architectures, memory zeroing cannot be physically guaranteed at the hardware RAM layer.
                  </p>
                </div>
              </div>
            </details>
          </div>

          <div className="pt-3 border-t border-enclave-border/60 text-[11px] font-mono text-muted-dim flex items-center justify-between">
            <span>CLIENT PRIVACY LEVEL</span>
            <span className="text-status-success font-semibold">ZERO-KNOWLEDGE</span>
          </div>
        </div>

        {/* Right Column: Runtime Technology Stack */}
        <div className="rounded-xl bg-enclave-plate/90 border border-enclave-border/80 shadow-plate-tactical p-5 space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-enclave-border/60">
            <div className="flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-accent" />
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
                Runtime Specifications
              </h3>
            </div>
            <span className="font-mono text-[10px] text-muted-dim uppercase">Verified Stack</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-enclave-void/70 border border-enclave-border/60 space-y-0.5">
              <span className="text-[10px] text-muted uppercase block">UI FRAMEWORK</span>
              <span className="font-bold text-foreground text-xs font-sans">React 19</span>
            </div>

            <div className="p-2.5 rounded-lg bg-enclave-void/70 border border-enclave-border/60 space-y-0.5">
              <span className="text-[10px] text-muted uppercase block">TYPE SYSTEM</span>
              <span className="font-bold text-foreground text-xs font-sans">TypeScript 5.7</span>
            </div>

            <div className="p-2.5 rounded-lg bg-enclave-void/70 border border-enclave-border/60 space-y-0.5">
              <span className="text-[10px] text-muted uppercase block">BUILD TOOL</span>
              <span className="font-bold text-foreground text-xs font-sans">Vite 6</span>
            </div>

            <div className="p-2.5 rounded-lg bg-enclave-void/70 border border-enclave-border/60 space-y-0.5">
              <span className="text-[10px] text-muted uppercase block">STYLING</span>
              <span className="font-bold text-foreground text-xs font-sans">Tailwind CSS 3.4</span>
            </div>

            <div className="p-2.5 rounded-lg bg-enclave-void/70 border border-enclave-border/60 space-y-0.5">
              <span className="text-[10px] text-muted uppercase block">ROUTING</span>
              <span className="font-bold text-foreground text-xs font-sans">React Router 7</span>
            </div>

            <div className="p-2.5 rounded-lg bg-enclave-void/70 border border-enclave-border/60 space-y-0.5">
              <span className="text-[10px] text-muted uppercase block">CRYPTOGRAPHY</span>
              <span className="font-bold text-foreground text-xs font-sans">Web Crypto API</span>
            </div>

            <div className="p-2.5 rounded-lg bg-enclave-void/70 border border-enclave-border/60 space-y-0.5">
              <span className="text-[10px] text-muted uppercase block">PERSISTENCE</span>
              <span className="font-bold text-foreground text-xs font-sans">IndexedDB</span>
            </div>

            <div className="p-2.5 rounded-lg bg-enclave-void/70 border border-enclave-border/60 space-y-0.5">
              <span className="text-[10px] text-muted uppercase block">ESTIMATION</span>
              <span className="font-bold text-foreground text-xs font-sans">zxcvbn-ts 4.2</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. v2.0 Architecture Preview — User Accounts & Cloud Sync */}
      <div className="rounded-xl bg-enclave-plate/90 border border-accent/40 shadow-plate-tactical p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 border border-accent/30 text-accent">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground font-sans flex items-center gap-2">
                CredLock v2.0 Cloud Sync & Account Enclave
                <Badge variant="amber" size="sm">Architecture Preview</Badge>
              </h3>
              <p className="text-xs text-muted font-sans">
                Cross-device synchronized audit history and authenticated device session management.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAuthOpen(true)}
            leftIcon={<User className="w-3.5 h-3.5" />}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="self-start sm:self-auto shrink-0"
          >
            Launch Auth Preview
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-background-secondary/60 border border-border/70 space-y-1">
            <span className="text-[10px] font-mono text-muted uppercase block">CURRENT STATE</span>
            {isAuthenticated ? (
              <>
                <span className="font-bold text-foreground block font-sans">
                  Authenticated Enclave {operativeUsername ? `(@${operativeUsername})` : ''}
                </span>
                <span className="text-muted text-[11px]">
                  Audit history stored strictly in this browser’s IndexedDB (<code className="font-mono text-foreground font-semibold">credlock-db</code>) and owner-scoped to your account.
                </span>
              </>
            ) : (
              <>
                <span className="font-bold text-foreground block font-sans">Local Enclave (Guest Mode)</span>
                <span className="text-muted text-[11px]">
                  Audit history stored strictly in this browser’s IndexedDB (<code className="font-mono text-foreground font-semibold">credlock-db</code>) under local guest scope.
                </span>
              </>
            )}
          </div>

          <div className="p-3 rounded-lg bg-background-secondary/60 border border-border/70 space-y-1">
            <span className="text-[10px] font-mono text-accent uppercase block">v2.0 CLOUD SYNC</span>
            <span className="font-bold text-foreground block font-sans">Cross-Device Pairing</span>
            <span className="text-muted text-[11px]">
              Supabase Auth user sessions with end-to-end encrypted safe audit history synchronization.
            </span>
          </div>

          <div className="p-3 rounded-lg bg-background-secondary/60 border border-border/70 space-y-1">
            <span className="text-[10px] font-mono text-status-success uppercase block">ZERO-KNOWLEDGE COMMITMENT</span>
            <span className="font-bold text-foreground block font-sans">No Password Storage</span>
            <span className="text-muted text-[11px]">
              Passwords will NEVER be transmitted, hashed, or stored on remote cloud databases.
            </span>
          </div>
        </div>
      </div>

      {/* 5. Project Status & Data Sovereignty Management */}
      <div className="rounded-xl bg-enclave-plate/90 border border-enclave-border/80 shadow-plate-tactical p-5 space-y-4">
        {/* Project Metadata Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono pb-3 border-b border-border/60">
          <div className="p-2.5 rounded-lg bg-surface-elevated/40 border border-border">
            <span className="text-[10px] text-muted uppercase block">ACADEMIC STATUS</span>
            <span className="font-semibold text-foreground text-xs font-sans">Individual Capstone Project</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-elevated/40 border border-border">
            <span className="text-[10px] text-muted uppercase block">BUILD VERSION</span>
            <span className="font-semibold text-foreground text-xs font-sans">v1.0.0 (Production)</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-elevated/40 border border-border">
            <span className="text-[10px] text-muted uppercase block">CLIENT ARCHITECTURE</span>
            <span className="font-semibold text-foreground text-xs font-sans">Client-Side PWA Enclave</span>
          </div>
        </div>

        {/* Clear Local Data Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-accent" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted font-mono">
                Client Storage Management
              </h3>
            </div>
            <span className="font-mono text-[10px] text-muted-dim">DATA SOVEREIGNTY</span>
          </div>

          {!showConfirm ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-background-base/60 border border-border">
              <div>
                <span className="font-semibold text-foreground text-xs block">Flush Saved Local Records</span>
                <span className="text-muted text-[11px]">Deletes all sanitized analysis and breach query records from IndexedDB (<code className="font-mono text-foreground font-semibold">credlock-db</code>).</span>
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
            <div className="p-4 rounded-xl bg-status-danger/10 border border-status-danger/30 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-status-danger shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-foreground">
                    Confirm Complete Local Data Wipe?
                  </h4>
                  <p className="text-[11px] text-muted leading-relaxed font-sans">
                    This permanently removes all analysis history and breach query records from IndexedDB on this device. This operation cannot be undone.
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
      </div>

      {/* v2.0 Authentication UI Prototype Dialog */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialView="session-info"
      />
    </div>
  );
}
