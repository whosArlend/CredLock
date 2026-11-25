import { type ReactNode } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface ProtectedRouteProps {
  children: ReactNode;
}

const AUTH_ROUTES = new Set(['/signin', '/signup', '/login', '/register']);

/**
 * Route protection wrapper.
 * - Displays tactical loader while authentication session initializes.
 * - Redirects guests to /signin with previous location state to allow redirect back after login.
 * - Blocks access if authenticated profile has isActive === false without causing a redirect loop.
 * - Renders protected children once authenticated and active.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, profile, signOut } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        className="min-h-[50vh] flex flex-col items-center justify-center gap-3 font-mono text-xs text-muted"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
        <span>VERIFYING_ENCLAVE_SESSION...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to /signin, preserving intended destination unless already on an auth route
    const normalizedPath = location.pathname.toLowerCase();
    const isAuthRoute = AUTH_ROUTES.has(normalizedPath);
    return (
      <Navigate
        to="/signin"
        state={!isAuthRoute ? { from: location } : undefined}
        replace
      />
    );
  }

  if (profile && profile.isActive === false) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <div
          className="max-w-md w-full rounded-2xl bg-enclave-plate/95 border border-red-500/40 shadow-plate-tactical p-6 space-y-4 text-left"
          role="alert"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15 border border-red-500/30 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground font-sans">
                Enclave Access Suspended
              </h2>
              <p className="text-[11px] font-mono text-red-400 uppercase tracking-wider">
                STATUS // ACCOUNT_DEACTIVATED
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-muted leading-relaxed font-sans">
            Your operative profile is currently deactivated and cannot access protected enclave routes.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Link to="/" className="flex-1">
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Command Center
              </Button>
            </Link>
            <Button
              variant="danger"
              size="sm"
              className="flex-1"
              onClick={() => void signOut()}
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
