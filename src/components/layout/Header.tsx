import { Shield, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Container } from './Container';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
      <Container size="lg">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyber-emerald-muted border border-cyber-emerald/30 text-cyber-emerald">
              <Shield className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5">
                CredLock
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-background-elevated text-foreground-dim border border-border">
                  v0.1.0
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="emerald" size="sm" dot>
              <span className="hidden sm:inline">Zero-Knowledge</span> Client
            </Badge>
            <div
              className="flex items-center text-xs text-foreground-dim"
              title="All cryptographic operations are executed locally"
            >
              <Lock className="w-3.5 h-3.5 ml-1 text-foreground-muted" />
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
}
