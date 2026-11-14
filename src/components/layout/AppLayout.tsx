import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Container } from './Container';

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-cyber-emerald/30 selection:text-cyber-emerald">
      <Header />
      <main id="main-content" className="flex-1 pb-24 pt-6">
        <Container size="lg">
          <Outlet />
        </Container>
      </main>
      <BottomNav />
    </div>
  );
}
