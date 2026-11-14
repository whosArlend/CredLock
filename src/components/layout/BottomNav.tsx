import { Link, useLocation } from 'react-router-dom';
import { Home, ShieldCheck, KeyRound, AlertTriangle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  name: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Home', to: '/', icon: Home },
  { name: 'Analyze', to: '/analyzer', icon: ShieldCheck },
  { name: 'Generate', to: '/generator', icon: KeyRound },
  { name: 'Breach', to: '/breach-checker', icon: AlertTriangle },
  { name: 'Profile', to: '/profile', icon: User },
];

export function BottomNav() {
  const location = useLocation();

  const isItemActive = (to: string): boolean => {
    const currentPath = location.pathname;
    if (to === '/') {
      return currentPath === '/';
    }
    if (to === '/analyzer') {
      return currentPath === '/analyzer' || currentPath.startsWith('/analysis-history');
    }
    if (to === '/breach-checker') {
      return currentPath === '/breach-checker' || currentPath.startsWith('/breach-history');
    }
    return currentPath === to || currentPath.startsWith(`${to}/`);
  };

  return (
    <nav
      aria-label="Primary Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1 px-2 text-xs font-medium transition-all duration-150 select-none relative group rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyber-emerald',
                isActive
                  ? 'text-cyber-emerald'
                  : 'text-foreground-dim hover:text-foreground-muted active:scale-95'
              )}
            >
              <div
                className={cn(
                  'p-1 rounded-md transition-all duration-150',
                  isActive ? 'bg-cyber-emerald-muted' : 'group-hover:bg-background-elevated'
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight font-medium">
                {item.name}
              </span>
              {isActive && (
                <span
                  className="absolute -top-[1px] w-8 h-[2px] bg-cyber-emerald rounded-full"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
