import React from 'react';
import { ShieldCheck, Cpu, ClipboardCopy, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export const GeneratorNoticeCard: React.FC = () => {
  return (
    <Card className="border-border/70 bg-background-surface/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyber-cyan" aria-hidden="true" />
          <CardTitle className="text-sm">Cryptographic Design & Privacy Safeguards</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-foreground-muted leading-relaxed">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card 1: Web Crypto CSPRNG */}
          <div className="rounded-lg border border-border/50 bg-background-base/60 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-foreground font-semibold">
              <Cpu className="w-4 h-4 text-cyber-cyan" aria-hidden="true" />
              <span>Web Crypto CSPRNG</span>
            </div>
            <p className="text-[11px] text-foreground-muted/80">
              Entropy is sourced directly from <code className="text-cyber-cyan">crypto.getRandomValues()</code>.
              CredLock implements rejection sampling to eliminate modulo bias, ensuring strictly uniform index selection.
            </p>
          </div>

          {/* Card 2: Zero-Knowledge In-Memory */}
          <div className="rounded-lg border border-border/50 bg-background-base/60 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-foreground font-semibold">
              <Lock className="w-4 h-4 text-cyber-emerald" aria-hidden="true" />
              <span>Zero-Knowledge & Memory Only</span>
            </div>
            <p className="text-[11px] text-foreground-muted/80">
              Generated keys exist solely in transient component memory. They are never sent to external servers, never logged to console, and never saved in persistent storage or history.
            </p>
          </div>

          {/* Card 3: Clipboard Considerations */}
          <div className="rounded-lg border border-border/50 bg-background-base/60 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-foreground font-semibold">
              <ClipboardCopy className="w-4 h-4 text-cyber-amber" aria-hidden="true" />
              <span>Clipboard Reality</span>
            </div>
            <p className="text-[11px] text-foreground-muted/80">
              Copying transfers secrets to your operating system clipboard. Clipboard contents may be accessible to background apps or system clipboard history. Clear clipboard after pasting.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
