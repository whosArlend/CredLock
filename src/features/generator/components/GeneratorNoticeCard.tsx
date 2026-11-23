import React from 'react';
import { ShieldCheck, ChevronDown } from 'lucide-react';

export const GeneratorNoticeCard: React.FC = () => {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-enclave-plate/90 border border-enclave-border/80 shadow-plate-tactical space-y-2 text-left">
      {/* Compact Primary Security Note */}
      <div className="flex items-center gap-2 text-xs">
        <ShieldCheck className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
        <span className="font-medium text-foreground">
          Secure generation using your browser's cryptographic random number generator.
        </span>
      </div>

      {/* Progressive Disclosure: Technical Details */}
      <details className="group border-t border-border/40 pt-2 text-xs">
        <summary className="cursor-pointer font-mono text-[11px] text-accent hover:underline flex items-center gap-1.5 select-none focus:outline-none">
          <span>Technical & Cryptographic Details</span>
          <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
        </summary>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] text-muted leading-relaxed">
          {/* 1. CSPRNG */}
          <div className="p-2.5 rounded bg-background-base/60 border border-border/50 space-y-1">
            <strong className="text-foreground block font-mono text-[10px] uppercase tracking-wider text-accent">
              01 // CSPRNG Entropy
            </strong>
            <p>
              Randomness is sourced exclusively from <code className="font-mono text-foreground">crypto.getRandomValues()</code>. Standard pseudorandom generators like Math.random are strictly prohibited.
            </p>
          </div>

          {/* 2. Candidate Rejection Sampling */}
          <div className="p-2.5 rounded bg-background-base/60 border border-border/50 space-y-1">
            <strong className="text-foreground block font-mono text-[10px] uppercase tracking-wider text-accent">
              02 // Rejection Sampling
            </strong>
            <p>
              Candidate-level rejection sampling discards candidates missing any enabled category, guaranteeing a mathematically uniform distribution over all valid combinations.
            </p>
          </div>

          {/* 3. Pool-Based Entropy Estimation */}
          <div className="p-2.5 rounded bg-background-base/60 border border-border/50 space-y-1">
            <strong className="text-foreground block font-mono text-[10px] uppercase tracking-wider text-accent">
              03 // Pool Entropy Estimate
            </strong>
            <p>
              Entropy is reported as a theoretical pool estimate (<code className="font-mono text-foreground">L × log₂(Pool)</code>), representing an upper bound under unrestricted character selection.
            </p>
          </div>

          {/* 4. In-Memory Handling */}
          <div className="p-2.5 rounded bg-background-base/60 border border-border/50 space-y-1">
            <strong className="text-foreground block font-mono text-[10px] uppercase tracking-wider text-accent">
              04 // In-Memory Processing
            </strong>
            <p>
              Generated credentials exist solely in component state. They are never transmitted over the network, logged, or saved to local persistent storage.
            </p>
          </div>

          {/* 5. Clipboard Security Considerations */}
          <div className="p-2.5 rounded bg-background-base/60 border border-border/50 space-y-1 sm:col-span-2">
            <strong className="text-foreground block font-mono text-[10px] uppercase tracking-wider text-accent">
              05 // Clipboard Considerations
            </strong>
            <p>
              Copying places the credential into your operating system clipboard, which may be accessible to other local background applications or clipboard history utilities.
            </p>
          </div>
        </div>
      </details>
    </div>
  );
};
