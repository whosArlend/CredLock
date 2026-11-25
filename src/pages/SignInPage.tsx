import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { Badge } from '@/components/ui/Badge';
import { SignInForm } from '@/features/auth/components/SignInForm';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { useAuth } from '@/hooks/useAuth';

export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Preserve intended redirect destination or default to home
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';

  // If already authenticated, redirect automatically
  if (isAuthenticated) {
    navigate(from, { replace: true });
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] pt-3 pb-24 sm:py-12 flex flex-col justify-center animate-in fade-in duration-200">
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
            <Badge variant="amber" size="sm">v2.0 // ENCLAVE AUTHORIZATION</Badge>
          </div>

          {/* Tactical Main Card */}
          <div className="rounded-2xl bg-enclave-plate/95 border border-enclave-border/80 shadow-plate-tactical p-5 sm:p-8 relative overflow-hidden text-left space-y-4 sm:space-y-6">
            {/* Ambient decorative glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header section */}
            <div className="space-y-1.5 sm:space-y-2 border-b border-border/70 pb-4 sm:pb-5">
              <div className="flex items-center gap-2 font-mono text-[11px] font-semibold text-accent uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" />
                <span>Zero-Knowledge Identity Enclave</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans">
                Sign In to CredLock
              </h1>
              <p className="text-xs sm:text-sm text-muted leading-relaxed font-sans">
                Authenticate your identity session. Once authorized, access synchronized threat telemetry, local storage controls, and verified audit histories.
              </p>
            </div>

            {/* Form */}
            <SignInForm
              onSuccess={() => {
                navigate(from, { replace: true });
              }}
              onNavigateToSignUp={() => navigate('/signup')}
              onForgotPassword={() => setIsAuthModalOpen(true)}
            />

            {/* Cryptographic Specs Pill */}
            <div className="pt-2 border-t border-border/50 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-mono text-muted">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>SUPABASE AUTH</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span>ZERO-KNOWLEDGE</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>AES-GCM ENCLAVE</span>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* AuthModal instance for forgot password view */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialView="forgot-password"
      />
    </div>
  );
}

export default SignInPage;
