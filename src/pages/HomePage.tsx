import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import { useToast } from '@/hooks/useToast';
import {
  ShieldCheck,
  KeyRound,
  AlertTriangle,
  History,
  User,
  ArrowRight,
  Sparkles,
  Lock,
  Search,
  CheckCircle,
} from 'lucide-react';

export function HomePage() {
  const { showToast } = useToast();
  const [testInput, setTestInput] = useState('');
  const [btnLoading, setBtnLoading] = useState(false);

  const handleSimulateToast = (type: 'success' | 'warning' | 'error' | 'info') => {
    showToast({
      type,
      title: `${type.toUpperCase()} Notification`,
      message: 'Design system toast foundation verified. Ready for Phase 2.',
    });
  };

  const handleSimulateLoading = () => {
    setBtnLoading(true);
    setTimeout(() => {
      setBtnLoading(false);
      showToast({
        type: 'success',
        title: 'Action Completed',
        message: 'Async micro-interaction state verified successfully.',
      });
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        title="Security Center"
        description="CredLock: A Progressive Web Application for Password Strength Analysis, Secure Password Generation, and Data Breach Detection."
        badge={
          <Badge variant="emerald" size="sm" dot>
            Phase 2.1 Ready
          </Badge>
        }
      />

      {/* Core Architectural Navigation */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-dim">
          Primary Security Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card isInteractive className="group">
            <Link to="/analyzer" className="block">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-cyber-emerald-muted text-cyber-emerald border border-cyber-emerald/30 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <Badge variant="neutral" size="sm">Local Only</Badge>
                </div>
                <CardTitle>Password Analyzer</CardTitle>
                <CardDescription>
                  Evaluate character variety, length, Shannon entropy, and common patterns with zero data leaving the browser.
                </CardDescription>
              </CardHeader>
              <CardFooter className="justify-between text-cyber-emerald font-medium group-hover:translate-x-1 transition-transform">
                <span>Launch Analyzer</span>
                <ArrowRight className="w-4 h-4" />
              </CardFooter>
            </Link>
          </Card>

          <Card isInteractive className="group">
            <Link to="/generator" className="block">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-cyber-cyan-muted text-cyber-cyan border border-cyber-cyan/30 group-hover:scale-105 transition-transform">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <Badge variant="cyan" size="sm">CSPRNG</Badge>
                </div>
                <CardTitle>Password Generator</CardTitle>
                <CardDescription>
                  Generate cryptographically secure passwords powered by Web Crypto API (crypto.getRandomValues).
                </CardDescription>
              </CardHeader>
              <CardFooter className="justify-between text-cyber-cyan font-medium group-hover:translate-x-1 transition-transform">
                <span>Configure Generator</span>
                <ArrowRight className="w-4 h-4" />
              </CardFooter>
            </Link>
          </Card>

          <Card isInteractive className="group">
            <Link to="/breach-checker" className="block">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-cyber-rose-muted text-cyber-rose border border-cyber-rose/30 group-hover:scale-105 transition-transform">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <Badge variant="rose" size="sm">k-Anonymity</Badge>
                </div>
                <CardTitle>Breach Checker</CardTitle>
                <CardDescription>
                  Detect exposure in known breaches via SHA-1 prefix range queries without ever sending plaintext passwords.
                </CardDescription>
              </CardHeader>
              <CardFooter className="justify-between text-cyber-rose font-medium group-hover:translate-x-1 transition-transform">
                <span>Check Exposures</span>
                <ArrowRight className="w-4 h-4" />
              </CardFooter>
            </Link>
          </Card>
        </div>
      </section>

      {/* Two Required List Pages & Profile */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-dim">
          Audit Logs & Profile Workflows
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card isInteractive>
            <Link to="/analysis-history" className="block">
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <History className="w-4 h-4 text-cyber-emerald" />
                  <CardTitle className="text-sm">Analysis History</CardTitle>
                </div>
                <CardDescription>
                  List Page 1: Sanitized evaluation logs with clickable item details.
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card isInteractive>
            <Link to="/breach-history" className="block">
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <History className="w-4 h-4 text-cyber-rose" />
                  <CardTitle className="text-sm">Breach History</CardTitle>
                </div>
                <CardDescription>
                  List Page 2: Historical k-anonymity checks with detailed findings.
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card isInteractive>
            <Link to="/profile" className="block">
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-cyber-cyan" />
                  <CardTitle className="text-sm">Profile & About</CardTitle>
                </div>
                <CardDescription>
                  Developer profile, academic rubric matrix, and security declarations.
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>
      </section>

      {/* Design System Verification Panel */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-dim flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyber-emerald" />
            Design System & Component Showcase
          </h2>
          <span className="text-[11px] font-mono text-foreground-dim">Foundational Suite</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Interactive Component Testing Sandbox</CardTitle>
            <CardDescription>
              Verification of typography, color tokens, button variants, inputs, badges, tooltips, and toast feedback.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Buttons */}
            <div className="space-y-2">
              <label className="text-xs text-foreground-dim font-medium">Button Variants & Micro-interactions</label>
              <div className="flex flex-wrap gap-2.5">
                <Button variant="primary" onClick={handleSimulateLoading} isLoading={btnLoading}>
                  Primary Action
                </Button>
                <Button variant="secondary" onClick={() => handleSimulateToast('info')}>
                  Secondary
                </Button>
                <Button variant="outline" onClick={() => handleSimulateToast('success')}>
                  Outline Emerald
                </Button>
                <Button variant="danger" onClick={() => handleSimulateToast('error')}>
                  Destructive
                </Button>
                <Button variant="ghost" onClick={() => handleSimulateToast('warning')}>
                  Ghost
                </Button>
              </div>
            </div>

            {/* Inputs & Tooltip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Sample Cryptographic Key Input"
                placeholder="Enter sample key..."
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                helperText="Protected field demonstration (no persistent storage)"
                leftElement={<Lock className="w-4 h-4" />}
                rightElement={
                  <Tooltip content="Tooltip foundation verified" position="top">
                    <button type="button" className="hover:text-foreground">
                      <Search className="w-4 h-4" />
                    </button>
                  </Tooltip>
                }
              />

              <div className="flex flex-col justify-end space-y-2">
                <label className="text-xs text-foreground-dim font-medium">Status & Security Badges</label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="emerald" dot>Secure</Badge>
                  <Badge variant="amber" dot>Moderate</Badge>
                  <Badge variant="rose" dot>Breached</Badge>
                  <Badge variant="cyan">Zero-Knowledge</Badge>
                  <Badge variant="neutral">Restricted</Badge>
                </div>
              </div>
            </div>

            {/* Academic Matrix Quick Preview */}
            <div className="rounded-lg bg-background-elevated/50 p-4 border border-border/80">
              <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-cyber-emerald" />
                Phase 2.1 Technical Compliance
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-foreground-muted">
                <li>• Pure Dark Navy & Charcoal palette (#0a0e17 base)</li>
                <li>• Strict TypeScript enabled (ESNext, Bundler, Strict Checks)</li>
                <li>• Modern Tailwind CSS tokens with accessible contrast</li>
                <li>• 9 Discrete routes configured in React Router v7</li>
                <li>• Persistent 5-tab Bottom Navigation bar</li>
                <li>• Zero-knowledge client-side privacy foundation</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
