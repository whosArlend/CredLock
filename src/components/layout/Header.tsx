import { Link } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import { Container } from './Container';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background-base/90 backdrop-blur-md">
      <Container size="lg">
        <div className="flex h-14 items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2.5 group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="CredLock Home"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 border border-accent/30 text-accent transition-transform group-hover:scale-105">
              <Shield className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5 group-hover:text-accent transition-colors font-sans">
                CredLock
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-muted border border-border">
                  v0.1.0
                </span>
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Badge variant="emerald" size="sm" dot>
              <span className="hidden sm:inline">Privacy-Focused</span> Client
            </Badge>
            <Tooltip content="All cryptographic and entropy operations execute locally in browser memory" position="bottom">
              <button
                type="button"
                className="flex items-center p-1.5 rounded hover:bg-surface-elevated text-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
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
