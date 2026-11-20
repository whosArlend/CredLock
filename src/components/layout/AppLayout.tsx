import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Container, type ContainerProps } from './Container';
import { RouteLoadingFallback } from '@/components/ui/RouteLoadingFallback';

/**
 * Resolves the optimal container size variant based on current route semantics.
 * - 'wide' (max-w-7xl): Dashboards, catalogs, data tables, historical ledgers
 * - 'editorial' (max-w-4xl): Long-form articles and advisory reading
 * - 'default' (max-w-5xl): Focused utility tools, profile, and record details
 */
function getContainerSizeForRoute(pathname: string): ContainerProps['size'] {
  // Long-form editorial article reading
  if (pathname.startsWith('/articles/')) {
    return 'editorial';
  }

  // Focused utility tools & profile
  if (
    pathname === '/analyzer' ||
    pathname === '/generator' ||
    pathname === '/breach-checker' ||
    pathname === '/profile'
  ) {
    return 'default';
  }

  // Focused single record detail views
  if (
    pathname.startsWith('/analysis-history/') ||
    pathname.startsWith('/breach-history/')
  ) {
    return 'default';
  }

  // Dashboards, catalogues, feeds, tables:
  // '/', '/breaches', '/recommendations', '/articles', '/analysis-history', '/breach-history', '/breaches/:slug', '/recommendations/:slug'
  return 'wide';
}

export function AppLayout() {
  const location = useLocation();
  const containerSize = getContainerSizeForRoute(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-background-base text-foreground antialiased selection:bg-accent/30 selection:text-accent">
      {/* Accessible skip link for keyboard & screen reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-background-base focus:font-semibold focus:rounded-lg focus:shadow-elevated"
      >
        Skip to main content
      </a>

      <Header />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 pt-4 sm:pt-6 lg:pt-8 pb-20 sm:pb-24 lg:pb-12 focus:outline-none"
      >
        <Container size={containerSize}>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Outlet />
          </Suspense>
        </Container>
      </main>
      <BottomNav />
    </div>
  );
}
