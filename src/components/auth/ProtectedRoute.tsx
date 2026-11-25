import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Route protection wrapper.
 * - Displays tactical loader while authentication session initializes.
 * - Redirects guests to /signin with previous location state to allow redirect back after login.
 * - Renders protected children once authenticated.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
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
    const isAuthRoute = location.pathname === '/signin' || location.pathname === '/signup' || location.pathname === '/login';
    return (
      <Navigate
        to="/signin"
        state={!isAuthRoute ? { from: location } : undefined}
        replace
      />
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
