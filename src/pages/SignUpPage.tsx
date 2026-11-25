import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { Badge } from '@/components/ui/Badge';
import { SignUpForm } from '@/features/auth/components/SignUpForm';
import { AuthModal } from '@/features/auth/components/AuthModal';

export function SignUpPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-[calc(100vh-4rem)] pt-6 pb-28 sm:py-12 flex flex-col justify-center animate-in fade-in duration-200">
      <Container size="compact">
        <div className="space-y-6">
          {/* Breadcrumb / Back Link */}
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-foreground transition-colors group rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent px-1.5 py-1 -ml-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>RETURN_TO_COMMAND_CENTER</span>
            </Link>
            <Badge variant="amber" size="sm">v2.0 // AUTH FOUNDATION</Badge>
          </div>

          {/* Tactical Main Card */}
          <div className="rounded-2xl bg-enclave-plate/95 border border-enclave-border/80 shadow-plate-tactical p-6 sm:p-8 relative overflow-hidden text-left space-y-6">
            {/* Ambient decorative grid glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header section */}
            <div className="space-y-2 border-b border-border/70 pb-5">
              <div className="flex items-center gap-2 font-mono text-[11px] font-semibold text-accent uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" />
                <span>Zero-Knowledge Identity Enclave</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans">
                Create CredLock Account
              </h1>
              <p className="text-xs sm:text-sm text-muted leading-relaxed font-sans">
                Initialize your authenticated credential enclave. Account ownership provides cross-device encrypted telemetry synchronization with strict client-side data isolation.
              </p>
            </div>

            {/* Form */}
            <SignUpForm
              onNavigateToSignIn={() => setIsAuthModalOpen(true)}
            />

            {/* Cryptographic Specs Pill */}
            <div className="pt-2 border-t border-border/50 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-mono text-muted">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>SUPABASE AUTH</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span>ROW LEVEL SECURITY</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>OWASP COMPLIANT</span>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* AuthModal instance for navigation to Sign In preview */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialView="login"
      />
    </div>
  );
}

export default SignUpPage;
