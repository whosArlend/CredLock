import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
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
} from 'lucide-react';

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
    <div className="space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title="About CredLock"
        description="Cryptographic specifications, architectural principles, technology stack, and client-side data management."
        badge={<Badge variant="neutral" size="sm">v0.1.0 // PWA Enclave</Badge>}
      />

      {/* Application Overview & Purpose */}
      <Card variant="default" padding="lg" className="bg-surface border-border">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-accent uppercase tracking-wider">
              PROJECT IDENTITY & ARCHITECTURAL SCOPE
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground font-sans tracking-tight">
              CredLock: Client-Side Password Security & Privacy Environment
            </h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed font-sans max-w-3xl">
              CredLock is an academic Progressive Web Application designed to empower users with local-first password strength evaluation, cryptographically secure credential generation, and privacy-preserving data breach detection. Built under a strict zero-knowledge paradigm, sensitive credentials are never stored, logged, or transmitted across external networks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-background-base/60 border border-border">
              <span className="font-mono text-[10px] text-muted uppercase block">ROLE</span>
              <span className="text-xs font-semibold text-foreground">Individual Academic Project</span>
            </div>
            <div className="p-3 rounded-lg bg-background-base/60 border border-border">
              <span className="font-mono text-[10px] text-muted uppercase block">VERSION</span>
              <span className="text-xs font-semibold text-foreground font-mono">0.1.0 (Production Build)</span>
            </div>
            <div className="p-3 rounded-lg bg-background-base/60 border border-border">
              <span className="font-mono text-[10px] text-muted uppercase block">ARCHITECTURE</span>
              <span className="text-xs font-semibold text-foreground">Zero-Knowledge Client Sandbox</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 3 Core Security Pillars */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted font-mono flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-accent" />
          <span>[ CORE SYSTEM CAPABILITIES // 01 — 03 ]</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pillar 1 */}
          <Card variant="default" padding="md" className="bg-surface border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-accent">01 // HEURISTIC EVALUATION</span>
              <Shield className="w-4 h-4 text-muted" />
            </div>
            <h4 className="text-sm font-bold text-foreground">Password Strength Analyzer</h4>
            <p className="text-xs text-muted leading-relaxed">
              Powered by <code className="font-mono text-[11px] text-foreground">@zxcvbn-ts</code>. Evaluates spatial patterns, dictionary runs, repeat structures, and estimated guess-work difficulty bits without sending any data over the wire.
            </p>
          </Card>

          {/* Pillar 2 */}
          <Card variant="default" padding="md" className="bg-surface border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-accent">02 // CSPRNG KEYGEN</span>
              <KeyRound className="w-4 h-4 text-muted" />
            </div>
            <h4 className="text-sm font-bold text-foreground">Secure Password Generator</h4>
            <p className="text-xs text-muted leading-relaxed">
              Sourced directly from <code className="font-mono text-[11px] text-foreground">crypto.getRandomValues</code>. Implements candidate-level rejection sampling to guarantee a mathematically uniform distribution across required character sets.
            </p>
          </Card>

          {/* Pillar 3 */}
          <Card variant="default" padding="md" className="bg-surface border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-accent">03 // k-ANONYMITY LOOKUP</span>
              <Database className="w-4 h-4 text-muted" />
            </div>
            <h4 className="text-sm font-bold text-foreground">Password Breach Checker</h4>
            <p className="text-xs text-muted leading-relaxed">
              Calculates SHA-1 digests locally in the browser sandbox. Transmits only a 5-hex prefix with synthetic padding to HIBP, matching the remaining 35-character suffix locally in browser memory.
            </p>
          </Card>
        </div>
      </div>

      {/* Verified Technology Stack */}
      <Card variant="default" padding="lg" className="bg-surface border-border space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted font-mono">
              VERIFIED RUNTIME & TECHNOLOGY STACK
            </h3>
          </div>
          <span className="font-mono text-[11px] text-muted-dim">CLIENT SUBSYSTEMS</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-background-base/60 border border-border space-y-0.5">
            <span className="text-[10px] text-muted font-mono uppercase block">UI FRAMEWORK</span>
            <span className="font-bold text-foreground">React 19</span>
            <span className="text-[11px] text-muted block">Functional components & hooks</span>
          </div>

          <div className="p-3 rounded-lg bg-background-base/60 border border-border space-y-0.5">
            <span className="text-[10px] text-muted font-mono uppercase block">TYPE SYSTEM</span>
            <span className="font-bold text-foreground">TypeScript 5.7</span>
            <span className="text-[11px] text-muted block">Strict compiler flags enabled</span>
          </div>

          <div className="p-3 rounded-lg bg-background-base/60 border border-border space-y-0.5">
            <span className="text-[10px] text-muted font-mono uppercase block">BUNDLER & TOOLING</span>
            <span className="font-bold text-foreground">Vite 6</span>
            <span className="text-[11px] text-muted block">Native ESM with chunk splitting</span>
          </div>

          <div className="p-3 rounded-lg bg-background-base/60 border border-border space-y-0.5">
            <span className="text-[10px] text-muted font-mono uppercase block">DESIGN SYSTEM</span>
            <span className="font-bold text-foreground">Tailwind CSS 3.4</span>
            <span className="text-[11px] text-muted block">Obsidian Vault × Cipher Ledger</span>
          </div>

          <div className="p-3 rounded-lg bg-background-base/60 border border-border space-y-0.5">
            <span className="text-[10px] text-muted font-mono uppercase block">ROUTING</span>
            <span className="font-bold text-foreground">React Router 7</span>
            <span className="text-[11px] text-muted block">9 discrete client-side routes</span>
          </div>

          <div className="p-3 rounded-lg bg-background-base/60 border border-border space-y-0.5">
            <span className="text-[10px] text-muted font-mono uppercase block">CRYPTOGRAPHY</span>
            <span className="font-bold text-foreground">Web Crypto API</span>
            <span className="text-[11px] text-muted block">crypto.getRandomValues & subtle</span>
          </div>

          <div className="p-3 rounded-lg bg-background-base/60 border border-border space-y-0.5">
            <span className="text-[10px] text-muted font-mono uppercase block">LOCAL STORAGE</span>
            <span className="font-bold text-foreground">IndexedDB</span>
            <span className="text-[11px] text-muted block">credlock-db transactional enclave</span>
          </div>

          <div className="p-3 rounded-lg bg-background-base/60 border border-border space-y-0.5">
            <span className="text-[10px] text-muted font-mono uppercase block">ESTIMATION ENGINE</span>
            <span className="font-bold text-foreground">zxcvbn-ts 4.2</span>
            <span className="text-[11px] text-muted block">Realistic guess-work estimation</span>
          </div>
        </div>
      </Card>

      {/* Client Storage Management / Clear Local Data */}
      <Card variant="default" padding="lg" className="bg-surface border-border space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted font-mono">
              CLIENT STORAGE MANAGEMENT // INDEXEDDB
            </h3>
          </div>
          <span className="font-mono text-[11px] text-muted-dim">DATA SOVEREIGNTY</span>
        </div>

        <p className="text-xs text-muted leading-relaxed">
          CredLock saves only sanitized metadata (timestamps, score integers, length, and boolean leak outcomes) to local IndexedDB (<code className="font-mono text-foreground">credlock-db</code>). You maintain full control over your local data and can purge all archived records at any time.
        </p>

        <div className="pt-2">
          {!showConfirm ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-background-base/60 border border-border">
              <div>
                <span className="font-semibold text-foreground text-xs block">Flush All Saved History Records</span>
                <span className="text-muted text-[11px]">Deletes all records from both analysis_history and breach_history stores.</span>
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

      {/* Security Protocol & Transparent Disclaimers */}
      <Card variant="default" padding="lg" className="bg-surface border-border space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Lock className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-mono uppercase tracking-wider text-muted">
            SECURITY DECLARATION & FORMAL BOUNDARIES
          </h3>
        </div>

        <div className="space-y-3 text-xs text-muted leading-relaxed">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p>
              <strong className="text-foreground">Zero-Knowledge Sandbox:</strong> Passwords entered into CredLock exist exclusively in transient component memory. No plaintext credential, complete hash, suffix, or prefix is ever transmitted to telemetry endpoints, written to persistent storage, or printed to developer logs.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p>
              <strong className="text-foreground">Non-Absolute Security Realities:</strong> Absence from public breach dumps does not guarantee mathematical invulnerability against targeted brute force. Password estimation uses heuristic pattern models rather than absolute theoretical certainty.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <Cpu className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <p className="font-mono text-[11px] text-muted-dim">
              * Client Memory Limitation: CredLock minimizes password lifetimes in JavaScript memory, but under standard browser runtime architectures, JavaScript garbage collection does not provide physical hardware RAM zeroing guarantees.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
