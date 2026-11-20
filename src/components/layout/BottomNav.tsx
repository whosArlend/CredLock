import { Link, useLocation } from 'react-router-dom';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdaptiveScrollNav } from '@/hooks/useAdaptiveScrollNav';
import { NAV_ITEMS, DEFAULT_NAV_ITEM, isItemActive, type NavItem } from './navUtils';

/**
 * Adaptive Floating Capsule Navigation System.
 *
 * Implements Obsidian Vault × Cipher Ledger design tokens:
 * - Mobile & Tablet: Sleek floating dock with active route detection and scroll-aware collapse/expand.
 * - Desktop (lg+): Automatically hidden, as primary navigation is elevated to the global header.
 * - Interaction: Collapses on scroll beyond threshold; stays compact when scrolling ceases or shifts direction;
 *   re-expands on manual click or route change.
 */
export function BottomNav() {
  const location = useLocation();
  const { isExpanded, expand, collapse } = useAdaptiveScrollNav({ threshold: 28 });

  const activeItem: NavItem =
    NAV_ITEMS.find((item) => isItemActive(item.to, location.pathname)) ?? DEFAULT_NAV_ITEM;
  const ActiveIcon = activeItem.icon;

  return (
    <aside
      aria-label="Navigation Capsule Container"
      className="fixed bottom-3 sm:bottom-4 left-0 right-0 z-40 flex justify-center px-3 sm:px-4 pointer-events-none pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <nav
        role="navigation"
        aria-label="Primary Navigation"
        aria-expanded={isExpanded}
        className={cn(
          'pointer-events-auto transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
          'border border-border/80 bg-background-base/95 backdrop-blur-md shadow-2xl shadow-black/60',
          isExpanded
            ? 'w-full max-w-lg h-16 rounded-2xl px-2 flex items-center justify-between'
            : 'w-auto h-12 rounded-full px-3.5 flex items-center gap-2 hover:border-accent/40 hover:bg-surface-elevated/90 group cursor-pointer'
        )}
      >
        {isExpanded ? (
          <div className="flex items-center justify-between w-full h-full animate-in fade-in duration-200">
            <div className="flex items-center justify-around flex-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.to, location.pathname);

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex flex-col items-center justify-center flex-1 py-1 px-0.5 text-xs font-medium transition-all duration-150 select-none relative group rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent min-w-0',
                      active
                        ? 'text-accent'
                        : 'text-muted hover:text-foreground active:scale-95'
                    )}
                  >
                    <div
                      className={cn(
                        'p-1 sm:p-1.5 rounded-md transition-all duration-150',
                        active ? 'bg-accent/10 text-accent' : 'group-hover:bg-surface-elevated'
                      )}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    </div>
                    <span className="text-[10px] sm:text-[11px] mt-0.5 tracking-tight font-medium truncate max-w-full">
                      {item.name}
                    </span>
                    {active && (
                      <span
                        className="absolute -top-[1px] w-6 sm:w-8 h-[2px] bg-accent rounded-full"
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="w-[1px] h-6 bg-border/60 mx-1 flex-shrink-0" aria-hidden="true" />

            <button
              type="button"
              onClick={collapse}
              className="flex flex-col items-center justify-center py-1 px-1 sm:px-1.5 text-xs font-medium text-muted hover:text-foreground active:scale-95 transition-all select-none rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent group shrink-0"
              aria-label="Collapse navigation"
              title="Collapse navigation"
            >
              <div className="p-1 rounded-md group-hover:bg-surface-elevated transition-colors">
                <ChevronDown className="w-4 h-4 text-muted group-hover:text-accent transition-colors" />
              </div>
              <span className="text-[9px] tracking-tight text-muted font-mono">Hide</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={expand}
            className="flex items-center gap-2 sm:gap-2.5 h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-full select-none animate-in fade-in duration-200"
            aria-label={`Expand navigation (current page: ${activeItem.name})`}
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-accent/15 text-accent border border-accent/30 shadow-sm shrink-0">
              <ActiveIcon className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold tracking-tight text-foreground font-sans whitespace-nowrap">
              {activeItem.name}
            </span>
            <span className="w-1 h-1 rounded-full bg-border-strong shrink-0" aria-hidden="true" />
            <div className="flex items-center gap-1 text-muted group-hover:text-accent transition-colors pr-1 shrink-0">
              <span className="text-[10px] font-mono uppercase tracking-wider hidden xs:inline">Menu</span>
              <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
            </div>
          </button>
        )}
      </nav>
    </aside>
  );
}
