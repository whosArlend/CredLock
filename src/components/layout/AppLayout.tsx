import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Container } from './Container';

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-cyber-emerald/30 selection:text-cyber-emerald">
      {/* Accessible skip link for keyboard & screen reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyber-emerald focus:text-background focus:font-semibold focus:rounded-lg focus:shadow-elevated"
      >
        Skip to main content
      </a>

      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 pb-24 pt-6 focus:outline-none">
        <Container size="lg">
          <Outlet />
        </Container>
      </main>
      <BottomNav />
    </div>
  );
}
