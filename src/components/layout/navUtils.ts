import { Home, ShieldCheck, KeyRound, AlertTriangle, User } from 'lucide-react';
import type { ComponentType } from 'react';

export interface NavItem {
  name: string;
  desktopName?: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
}

export const DEFAULT_NAV_ITEM: NavItem = {
  name: 'Home',
  desktopName: 'Home',
  to: '/',
  icon: Home,
};

export const NAV_ITEMS: NavItem[] = [
  DEFAULT_NAV_ITEM,
  { name: 'Analyze', desktopName: 'Analyzer', to: '/analyzer', icon: ShieldCheck },
  { name: 'Generate', desktopName: 'Generator', to: '/generator', icon: KeyRound },
  { name: 'Breach', desktopName: 'Breach Checker', to: '/breach-checker', icon: AlertTriangle },
  { name: 'About', desktopName: 'About', to: '/profile', icon: User },
];

/**
 * Route matching logic for active navigation indicators.
 */
export function isItemActive(to: string, currentPath: string): boolean {
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
}
