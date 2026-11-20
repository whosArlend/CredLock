import { Link, useLocation } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { Container } from './Container';
import { NAV_ITEMS, isItemActive } from './navUtils';
import { cn } from '@/lib/utils';

export function Header() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background-base/95 backdrop-blur-md">
      <Container size="wide">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-4">
          {/* Brand Logo & Version */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0"
            aria-label="CredLock Home"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 border border-accent/30 text-accent transition-transform group-hover:scale-105">
              <Shield className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-bold tracking-tight text-foreground group-hover:text-accent transition-colors font-sans">
                CredLock
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-muted border border-border hidden xs:inline-block">
                v0.1.0
              </span>
            </div>
          </Link>

          {/* Desktop Primary Navigation (hidden on mobile/tablet, visible on lg+) */}
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

          {/* Security Status / Privacy Indicator */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Desktop Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-elevated/60 border border-border text-[11px] font-mono text-muted">
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
          </div>
        </div>
      </Container>
    </header>
  );
}
