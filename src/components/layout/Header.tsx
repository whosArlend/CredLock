import { Link } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import { Container } from './Container';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
      <Container size="lg">
        <div className="flex h-14 items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2.5 group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-emerald"
            aria-label="CredLock Home"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyber-emerald-muted border border-cyber-emerald/30 text-cyber-emerald transition-transform group-hover:scale-105">
              <Shield className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5 group-hover:text-cyber-emerald transition-colors">
                CredLock
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-background-elevated text-foreground-dim border border-border">
                  v0.1.0
                </span>
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Badge variant="emerald" size="sm" dot>
              <span className="hidden sm:inline">Zero-Knowledge</span> Client
            </Badge>
            <Tooltip content="All cryptographic operations execute locally in browser sandbox" position="bottom">
              <button
                type="button"
                className="flex items-center p-1 rounded hover:bg-background-elevated text-foreground-dim hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyber-emerald"
                aria-label="Cryptographic Security Isolation Information"
              >
                <Lock className="w-3.5 h-3.5 text-foreground-muted" />
              </button>
            </Tooltip>
          </div>
        </div>
      </Container>
    </header>
  );
}
