import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SignUpForm } from './SignUpForm';
import { SignInForm } from './SignInForm';
import {
  Shield,
  Lock,
  KeyRound,
  Smartphone,
  Cloud,
  Info,
} from 'lucide-react';

export type AuthView =
  | 'login'
  | 'register'
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

  const switchView = (nextView: AuthView) => {
    setView(nextView);
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
          </span>
        </div>
      }
      description="CredLock v2.0 Username-Only Identity Enclave"
    >
      <div className="space-y-5 text-left font-sans">
        {/* Architectural Privacy Banner */}
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-3.5 flex items-start gap-3">
          <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2 font-semibold text-accent">
              <span>Zero-Knowledge Identity Enclave</span>
              <Badge variant="amber" size="sm">Privacy First</Badge>
            </div>
            <p className="text-foreground-secondary leading-relaxed">
              CredLock authenticates using <strong>Username + Master Passphrase only</strong>. No personal emails or phone numbers are ever collected or stored.
            </p>
          </div>
        </div>

        {/* VIEW: SESSION INFO / OVERVIEW */}
        {view === 'session-info' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-background-secondary p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground-muted">Current Session State</span>
                <Badge variant="neutral" size="sm" dot>
                  Local Enclave
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-foreground-muted block">Local Storage Engine</span>
                  <span className="text-xs font-mono font-medium text-foreground">IndexedDB (credlock-db)</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[11px] text-foreground-muted block">Identity Authentication</span>
                  <span className="text-xs font-mono text-accent">Username Enclave</span>
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
                    <strong className="text-foreground block">Cross-Device Synchronized Telemetry</strong>
                    <span className="text-foreground-secondary">
                      Access your sanitized password audit scores and breach checks across devices with cryptographic isolation.
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border/70 bg-background-secondary/40">
                  <Smartphone className="w-4 h-4 text-status-info shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground block">Device Authorization</strong>
                    <span className="text-foreground-secondary">
                      Inspect active sessions and terminate unneeded browser authorizations with token revocation.
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
                Sign In
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => switchView('register')}
                leftIcon={<KeyRound className="w-3.5 h-3.5" />}
              >
                Create Account
              </Button>
            </div>
          </div>
        )}

        {/* VIEW: LOGIN */}
        {view === 'login' && (
          <div className="space-y-4">
            <SignInForm
              onSuccess={() => {
                onClose();
              }}
              onNavigateToSignUp={() => switchView('register')}
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
      </div>
    </Modal>
  );
}
