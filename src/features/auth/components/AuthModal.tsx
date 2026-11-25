import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { SignUpForm } from './SignUpForm';
import { SignInForm } from './SignInForm';
import {
  Shield,
  Lock,
  Mail,
  KeyRound,
  CheckCircle2,
  Smartphone,
  Cloud,
  Info,
  RefreshCw,
} from 'lucide-react';

export type AuthView =
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'verify-email'
  | 'session-info';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: AuthView;
}

export function AuthModal({
  isOpen,
  onClose,
  initialView = 'session-info',
}: AuthModalProps) {
  const [view, setView] = useState<AuthView>(initialView);
  const [email, setEmail] = useState('');
  const [prototypeNotice, setPrototypeNotice] = useState<string | null>(null);

  // Reset states when changing views
  const switchView = (nextView: AuthView) => {
    setView(nextView);
    setPrototypeNotice(null);
  };

  const handlePrototypeAction = (actionName: string) => {
    setPrototypeNotice(
      `[v2.0 UI Prototype]: ${actionName} interaction captured. Backend Supabase Auth will be wired during Phase 2B.`
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 border border-accent/30 text-accent">
            <Shield className="h-4 w-4" />
          </div>
          <span className="font-bold text-foreground">
            {view === 'session-info' && 'CredLock Account & Cloud Sync'}
            {view === 'login' && 'Sign In to CredLock'}
            {view === 'register' && 'Create CredLock Account'}
            {view === 'forgot-password' && 'Recover Account Access'}
            {view === 'verify-email' && 'Verify Email Address'}
          </span>
        </div>
      }
      description="CredLock v2.0 Authentication & Cross-Device Sync Architecture Preview"
    >
      <div className="space-y-5 text-left font-sans">
        {/* Architectural Prototype Banner */}
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-3.5 flex items-start gap-3">
          <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2 font-semibold text-accent">
              <span>v2.0 Preview — Zero-Knowledge Cloud Enclave</span>
              <Badge variant="amber" size="sm">Prototype UI</Badge>
            </div>
            <p className="text-foreground-secondary leading-relaxed">
              In CredLock v2.0, accounts enable cross-device history sync. In accordance with our
              strict security model, <strong>passwords are never transmitted or stored in the cloud</strong>.
              Only sanitized telemetry and audit metadata are synchronized.
            </p>
          </div>
        </div>

        {/* Prototype feedback toast inside dialog */}
        {prototypeNotice && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{prototypeNotice}</span>
          </div>
        )}

        {/* VIEW: SESSION INFO / OVERVIEW */}
        {view === 'session-info' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-background-secondary p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground-muted">Current Session State</span>
                <Badge variant="neutral" size="sm" dot>
                  Local Enclave (Guest)
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-foreground-muted block">Local Storage Engine</span>
                  <span className="text-xs font-mono font-medium text-foreground">IndexedDB (credlock-db)</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[11px] text-foreground-muted block">Cloud Synchronization</span>
                  <span className="text-xs font-mono text-accent">Pending v2.0 Pairing</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground tracking-tight uppercase tracking-wider text-[11px] text-foreground-muted">
                v2.0 Account Capabilities
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border/70 bg-background-secondary/40">
                  <Cloud className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground block">Cross-Device Synchronized History</strong>
                    <span className="text-foreground-secondary">
                      Access your sanitized password audit scores and breach checks across phone, tablet, and desktop.
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border/70 bg-background-secondary/40">
                  <Smartphone className="w-4 h-4 text-status-info shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground block">Device Authorization & Revocation</strong>
                    <span className="text-foreground-secondary">
                      Inspect active sessions and revoke compromised browsers with cryptographic token rotation.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => switchView('login')}
                leftIcon={<Lock className="w-3.5 h-3.5" />}
              >
                Sign In (Preview)
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => switchView('register')}
                leftIcon={<KeyRound className="w-3.5 h-3.5" />}
              >
                Create Account (Preview)
              </Button>
            </div>
          </div>
        )}

        {/* VIEW: LOGIN */}
        {view === 'login' && (
          <div className="space-y-4">
            <SignInForm
              isCompact
              onSuccess={() => {
                onClose();
              }}
              onNavigateToSignUp={() => switchView('register')}
              onForgotPassword={() => switchView('forgot-password')}
            />

            <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => switchView('session-info')}
                className="text-foreground-muted hover:text-foreground"
              >
                ← Back to Enclave Info
              </button>
            </div>
          </div>
        )}

        {/* VIEW: REGISTER */}
        {view === 'register' && (
          <div className="space-y-4">
            <SignUpForm
              isCompact
              onNavigateToSignIn={() => switchView('login')}
            />

            <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => switchView('session-info')}
                className="text-foreground-muted hover:text-foreground"
              >
                ← Back to Enclave Info
              </button>
            </div>
          </div>
        )}

        {/* VIEW: FORGOT PASSWORD */}
        {view === 'forgot-password' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-background-secondary p-3 text-xs text-foreground-secondary space-y-1">
              <span className="font-semibold text-foreground">Zero-Knowledge Key Reset Notice</span>
              <p>
                Resetting an account password initiates cryptographic token rotation. Previously encrypted local records
                will require your offline backup recovery phrase.
              </p>
            </div>

            <Input
              label="Account Recovery Email"
              type="email"
              placeholder="analyst@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftElement={<Mail className="w-4 h-4" />}
            />

            <Button
              variant="primary"
              className="w-full"
              onClick={() => handlePrototypeAction('Recovery Dispatch Request')}
            >
              Send Recovery Dispatch (v2.0 Preview)
            </Button>

            <div className="flex items-center justify-center text-xs pt-1">
              <button
                type="button"
                onClick={() => switchView('login')}
                className="text-accent font-medium hover:underline"
              >
                ← Return to Sign In
              </button>
            </div>
          </div>
        )}

        {/* VIEW: VERIFY EMAIL */}
        {view === 'verify-email' && (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 border border-accent/30 text-accent">
                <Mail className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">Verification Dispatch Dispatched</h4>
              <p className="text-xs text-foreground-muted">
                A cryptographic validation token has been queued for {email || 'your email'}.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-border bg-background-secondary text-xs text-foreground-secondary">
              <p>Click the link inside the confirmation email or input the one-time authentication code.</p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => handlePrototypeAction('Resend Verification')}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Resend Verification Token
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => switchView('login')}
              >
                Return to Sign In
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
