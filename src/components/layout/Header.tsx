import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Lock,
  User,
  LogOut,
  ChevronDown,
  Shield,
} from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { Container } from './Container';
import { NAV_ITEMS, isItemActive } from './navUtils';
import { AuthModal } from '@/features/auth';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, signOut } = useAuth();

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authModalView] = useState<'login' | 'register' | 'session-info'>('login');
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Close account dropdown on outside click or escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false);
      }
    }
    if (isAccountMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAccountMenuOpen]);

  // Derive display initials and name
  const displayName = profile?.displayName || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Operative';
  const displayEmail = user?.email || profile?.email || 'enclave@credlock.local';
  const initials = (displayName.slice(0, 2) || 'OP').toUpperCase();
  const roleLabel = (profile?.role || 'user').toUpperCase();

  const handleSignOut = async () => {
    setIsAccountMenuOpen(false);
    await signOut();
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background-base/95 backdrop-blur-md">
        <Container size="wide">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-4">
            {/* Brand Logo & Version */}
            <Link
              to="/"
              className="flex items-center gap-2.5 group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0"
              aria-label="CredLock Home"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-elevated/90 border border-border-strong text-foreground transition-all duration-200 group-hover:border-accent/50 group-hover:scale-105 p-1 shrink-0 overflow-hidden shadow-sm">
                <img
                  src="/favicon-white.svg"
                  alt="CredLock"
                  className="w-5 h-5 object-contain"
                  width="20"
                  height="20"
                  loading="eager"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-bold tracking-tight text-foreground group-hover:text-accent transition-colors font-sans">
                  CredLock
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-muted border border-border hidden sm:inline-block">
                  v2.0
                </span>
              </div>
            </Link>

            {/* Desktop Primary Navigation */}
            <nav
              role="navigation"
              aria-label="Desktop Primary Navigation"
              className="hidden lg:flex items-center gap-1"
            >
              {NAV_ITEMS.map((item) => {
                const active = isItemActive(item.to, location.pathname);
                const label = item.desktopName ?? item.name;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium font-sans transition-all duration-150 select-none relative focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent',
                      active
                        ? 'text-accent bg-accent/10 border border-accent/30 font-semibold shadow-sm'
                        : 'text-muted hover:text-foreground hover:bg-surface-elevated/70 border border-transparent'
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Security Indicator & Account Navigation */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Desktop Status Pill */}
              <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-elevated/60 border border-border text-[11px] font-mono text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                <span>Zero-Knowledge Engine</span>
              </div>

              {/* Privacy details tooltip trigger */}
              <Tooltip
                content="All cryptographic evaluations execute locally in browser memory. Plaintext passwords never leave your device."
                position="bottom"
              >
                <button
                  type="button"
                  className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-surface-elevated text-muted hover:text-foreground transition-colors border border-transparent hover:border-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                  aria-label="Client-Side Privacy Information"
                >
                  <Lock className="w-3.5 h-3.5 text-muted" />
                </button>
              </Tooltip>

              {/* AUTHENTICATION CONTROLS */}
              {isAuthenticated ? (
                /* Authenticated User Menu */
                <div className="relative" ref={accountMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                    aria-expanded={isAccountMenuOpen}
                    aria-haspopup="true"
                    className="flex items-center gap-2 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-medium bg-background-elevated hover:bg-[#25292E] text-foreground border border-border hover:border-border-strong transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent group"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 border border-accent/40 text-accent text-[10px] font-mono font-bold">
                      {initials}
                    </div>
                    <span className="hidden sm:inline font-sans text-xs max-w-[120px] truncate text-foreground font-medium">
                      {displayName}
                    </span>
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 text-muted transition-transform duration-150',
                        isAccountMenuOpen && 'rotate-180 text-foreground'
                      )}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isAccountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-xl bg-surface-elevated border border-border-strong shadow-plate-tactical p-2 space-y-1 animate-in fade-in zoom-in-95 z-50 text-left font-sans">
                      {/* Identity Card */}
                      <div className="p-2.5 rounded-lg bg-background-base/60 border border-border/60 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold text-foreground truncate">
                            {displayName}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-accent/10 text-accent border border-accent/30 font-semibold">
                            {roleLabel}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-muted truncate">
                          {displayEmail}
                        </p>
                        <div className="flex items-center gap-1.5 pt-1 text-[10px] font-mono text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Identity Enclave Active</span>
                        </div>
                      </div>

                      {/* Menu Links */}
                      <div className="pt-1 space-y-0.5">
                        <Link
                          to="/profile"
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="flex items-center gap-2 px-2.5 py-2 text-xs text-foreground-secondary hover:text-foreground hover:bg-surface-elevated/80 rounded-lg transition-colors"
                        >
                          <Shield className="w-3.5 h-3.5 text-accent" />
                          <span>Enclave Dossier & Arch</span>
                        </Link>
                      </div>

                      {/* Sign Out Action */}
                      <div className="pt-1 border-t border-border/70">
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Terminate Enclave Session</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Guest State: Sign In & Sign Up Affordances */
                <div className="flex items-center gap-1.5">
                  <Link
                    to="/signin"
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium bg-background-elevated hover:bg-[#25292E] text-foreground border border-border hover:border-border-strong transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent group"
                    aria-label="Sign In to CredLock"
                  >
                    <User className="w-3.5 h-3.5 text-accent group-hover:scale-105 transition-transform" />
                    <span>Sign In</span>
                  </Link>

                  <Link
                    to="/signup"
                    className="hidden sm:flex items-center gap-1 px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-medium bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 hover:border-accent/50 transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                    aria-label="Create CredLock Account"
                  >
                    <span>Sign Up</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </Container>
      </header>

      {/* AuthModal instance for modal-triggered auth */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialView={authModalView}
      />
    </>
  );
}

export default Header;
