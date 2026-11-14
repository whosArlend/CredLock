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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Web Crypto CSPRNG & Candidate Rejection */}
          <div className="rounded-lg border border-border/50 bg-background-base/60 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-foreground font-semibold">
              <Cpu className="w-4 h-4 text-cyber-cyan" aria-hidden="true" />
              <span>CSPRNG & Candidate Rejection</span>
            </div>
            <p className="text-[11px] text-foreground-muted/80">
              Randomness is sourced exclusively from <code className="text-cyber-cyan">crypto.getRandomValues()</code>.
              Candidate-level rejection sampling discards candidates missing any required category, ensuring a mathematically uniform distribution over all valid outputs.
            </p>
          </div>

          {/* Card 2: Pool-Based Entropy Estimate */}
          <div className="rounded-lg border border-border/50 bg-background-base/60 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-foreground font-semibold">
              <ShieldCheck className="w-4 h-4 text-cyber-cyan" aria-hidden="true" />
              <span>Pool-Based Entropy Estimate</span>
            </div>
            <p className="text-[11px] text-foreground-muted/80">
              Entropy is displayed as a theoretical pool-based estimate: <code className="text-cyber-cyan">L × log₂(Pool)</code>.
              This represents an upper bound under unrestricted selection; category constraints slightly restrict the keyspace.
            </p>
          </div>

          {/* Card 3: Zero-Knowledge In-Memory */}
          <div className="rounded-lg border border-border/50 bg-background-base/60 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-foreground font-semibold">
              <Lock className="w-4 h-4 text-cyber-emerald" aria-hidden="true" />
              <span>Zero-Knowledge & Memory Only</span>
            </div>
            <p className="text-[11px] text-foreground-muted/80">
              Generated keys exist solely in transient component memory. They are never sent to external servers, never logged to console, and never saved in persistent storage or history.
            </p>
          </div>

          {/* Card 4: Clipboard Considerations */}
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
