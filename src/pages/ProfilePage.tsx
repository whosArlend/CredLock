import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { clearAllHistoryAsync } from '@/services/historyStorage';
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
} from 'lucide-react';

export function ProfilePage() {
  const { showToast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearLocalData = async () => {
    try {
      setIsClearing(true);
      await clearAllHistoryAsync();

      // Only clean CredLock-scoped keys from localStorage if present
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
        title="About CredLock"
        description="Client-side security architecture, verified technology stack, and local data management."
        badge={<Badge variant="neutral" size="sm">v0.1.0 // Client App</Badge>}
      />

      {/* 1. About CredLock (Concise 2-3 sentences) */}
      <Card variant="default" padding="md" className="bg-surface border-border">
        <div className="space-y-2">
          <span className="font-mono text-[10px] font-semibold text-accent uppercase tracking-wider">
            PROJECT OVERVIEW
          </span>
          <h2 className="text-lg font-bold text-foreground font-sans tracking-tight">
            CredLock: Client-Side Password Security & Privacy Environment
          </h2>
          <p className="text-xs sm:text-sm text-muted leading-relaxed font-sans">
            CredLock is an academic Progressive Web Application for password strength analysis, cryptographic credential generation, and data breach detection. Designed around client-side privacy, all password evaluations and key generations execute in local browser memory. When breach lookups are performed, only a truncated 5-character hash prefix is transmitted using the k-Anonymity privacy model.
          </p>
        </div>
      </Card>

      {/* 2. Core Features (3 cards with 1 short description each) */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted font-mono flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-accent" />
          <span>Core Security Features</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Feature 1 */}
          <div className="p-3.5 rounded-lg bg-surface border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-accent">01 // ANALYZER</span>
              <Shield className="w-4 h-4 text-muted" />
            </div>
            <h4 className="text-xs font-bold text-foreground">Password Strength Analyzer</h4>
            <p className="text-[11px] text-muted leading-relaxed">
              Evaluates entropy, dictionary patterns, and estimated crack difficulty in local memory via @zxcvbn-ts.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-3.5 rounded-lg bg-surface border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-accent">02 // GENERATOR</span>
              <KeyRound className="w-4 h-4 text-muted" />
            </div>
            <h4 className="text-xs font-bold text-foreground">Secure Password Generator</h4>
            <p className="text-[11px] text-muted leading-relaxed">
              Creates high-entropy passwords with Web Crypto CSPRNG and candidate rejection sampling for uniform distribution.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-3.5 rounded-lg bg-surface border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-accent">03 // BREACH CHECK</span>
              <Database className="w-4 h-4 text-muted" />
            </div>
            <h4 className="text-xs font-bold text-foreground">Password Breach Checker</h4>
            <p className="text-[11px] text-muted leading-relaxed">
              Verifies credential exposure against known leak databases using mathematical k-Anonymity hash-range queries.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Technology Stack (Compact Grid) */}
      <Card variant="default" padding="md" className="bg-surface border-border space-y-3">
        <div className="flex items-center justify-between pb-1.5 border-b border-border">
          <div className="flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-accent" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted font-mono">
              Runtime & Technology Stack
            </h3>
          </div>
          <span className="font-mono text-[10px] text-muted-dim">SPECIFICATIONS</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded bg-background-base/60 border border-border space-y-0.5">
            <span className="text-[9px] text-muted font-mono uppercase block">UI FRAMEWORK</span>
            <span className="font-bold text-foreground text-xs">React 19</span>
          </div>

          <div className="p-2.5 rounded bg-background-base/60 border border-border space-y-0.5">
            <span className="text-[9px] text-muted font-mono uppercase block">TYPE SYSTEM</span>
            <span className="font-bold text-foreground text-xs">TypeScript 5.7</span>
          </div>

          <div className="p-2.5 rounded bg-background-base/60 border border-border space-y-0.5">
            <span className="text-[9px] text-muted font-mono uppercase block">TOOLING</span>
            <span className="font-bold text-foreground text-xs">Vite 6</span>
          </div>

          <div className="p-2.5 rounded bg-background-base/60 border border-border space-y-0.5">
            <span className="text-[9px] text-muted font-mono uppercase block">DESIGN SYSTEM</span>
            <span className="font-bold text-foreground text-xs">Tailwind CSS 3.4</span>
          </div>

          <div className="p-2.5 rounded bg-background-base/60 border border-border space-y-0.5">
            <span className="text-[9px] text-muted font-mono uppercase block">ROUTER</span>
            <span className="font-bold text-foreground text-xs">React Router 7</span>
          </div>

          <div className="p-2.5 rounded bg-background-base/60 border border-border space-y-0.5">
            <span className="text-[9px] text-muted font-mono uppercase block">CRYPTOGRAPHY</span>
            <span className="font-bold text-foreground text-xs">Web Crypto API</span>
          </div>

          <div className="p-2.5 rounded bg-background-base/60 border border-border space-y-0.5">
            <span className="text-[9px] text-muted font-mono uppercase block">PERSISTENCE</span>
            <span className="font-bold text-foreground text-xs">IndexedDB</span>
          </div>

          <div className="p-2.5 rounded bg-background-base/60 border border-border space-y-0.5">
            <span className="text-[9px] text-muted font-mono uppercase block">ESTIMATION</span>
            <span className="font-bold text-foreground text-xs">zxcvbn-ts 4.2</span>
          </div>
        </div>
      </Card>

      {/* 4. Privacy & Security (Concise overview + Progressive disclosure) */}
      <Card variant="default" padding="md" className="bg-surface border-border space-y-2.5">
        <div className="flex items-center gap-1.5 pb-1 border-b border-border">
          <Lock className="w-3.5 h-3.5 text-accent" />
          <h3 className="text-xs font-mono uppercase tracking-wider text-muted">
            Privacy & Security Principles
          </h3>
        </div>

        <p className="text-xs text-muted leading-relaxed">
          CredLock executes calculations client-side in browser memory. Passwords are never sent across the network, logged, or stored. Local history archives only sanitized metadata (length, score, entropy, and exposure counts) in IndexedDB (<code className="font-mono text-foreground">credlock-db</code>).
        </p>

        {/* Progressive Disclosure: Technical Declarations */}
        <details className="group border-t border-border/40 pt-2 text-xs">
          <summary className="cursor-pointer font-mono text-[11px] text-accent hover:underline flex items-center gap-1.5 select-none focus:outline-none">
            <span>View Technical Boundaries & Declarations</span>
            <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
          </summary>

          <div className="mt-2.5 space-y-2 text-[11px] text-muted leading-relaxed">
            <div className="p-2.5 rounded bg-background-base/60 border border-border flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <p>
                <strong className="text-foreground">In-Memory Processing:</strong> Plaintext credentials exist solely in component state. Neither full passwords nor full hashes are ever written to disk or sent to telemetry servers.
              </p>
            </div>
            <div className="p-2.5 rounded bg-background-base/60 border border-border flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <p>
                <strong className="text-foreground">Probabilistic Models:</strong> Heuristic crack estimations and absence from known leak archives do not provide mathematical invulnerability against targeted offline brute force.
              </p>
            </div>
            <div className="p-2.5 rounded bg-background-base/60 border border-border flex items-start gap-2">
              <Cpu className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
              <p className="font-mono text-[10px] text-muted-dim">
                * Note on browser runtimes: Under JavaScript garbage collection architectures, memory zeroing cannot be physically guaranteed at the hardware RAM layer.
              </p>
            </div>
          </div>
        </details>
      </Card>

      {/* 5. Project Information */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="p-3 rounded-lg bg-surface border border-border">
          <span className="font-mono text-[9px] text-muted uppercase block">ACADEMIC STATUS</span>
          <span className="font-semibold text-foreground text-xs">Individual Capstone Project</span>
        </div>
        <div className="p-3 rounded-lg bg-surface border border-border">
          <span className="font-mono text-[9px] text-muted uppercase block">BUILD VERSION</span>
          <span className="font-mono font-semibold text-foreground text-xs">v0.1.0 (Production)</span>
        </div>
        <div className="p-3 rounded-lg bg-surface border border-border">
          <span className="font-mono text-[9px] text-muted uppercase block">CLIENT ARCHITECTURE</span>
          <span className="font-semibold text-foreground text-xs">Client-Side PWA Enclave</span>
        </div>
      </div>

      {/* 6. Client Storage Management / Clear Local Data */}
      <Card variant="default" padding="md" className="bg-surface border-border space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-border">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-accent" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted font-mono">
              Client Storage Management
            </h3>
          </div>
          <span className="font-mono text-[10px] text-muted-dim">DATA SOVEREIGNTY</span>
        </div>

        {!showConfirm ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-background-base/60 border border-border">
            <div>
              <span className="font-semibold text-foreground text-xs block">Flush Saved Local Records</span>
              <span className="text-muted text-[11px]">Deletes all records from IndexedDB (<code className="font-mono text-foreground">credlock-db</code>).</span>
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
          <div className="p-3.5 rounded-lg bg-danger/10 border border-danger/30 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-foreground">
                  Confirm Complete Local Data Wipe?
                </h4>
                <p className="text-[11px] text-muted leading-relaxed">
                  This permanently removes all analysis history and breach query records from IndexedDB on this device.
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
      </Card>
    </div>
  );
}
