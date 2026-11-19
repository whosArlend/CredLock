import { ShieldCheck, ChevronDown } from 'lucide-react';

export function BreachPrivacyNotice() {
  return (
    <div className="p-3.5 rounded-card bg-background-surface/60 border border-border/80 space-y-2">
      {/* Compact Primary Privacy Statement */}
      <div className="flex items-center gap-2 text-xs">
        <ShieldCheck className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
        <span className="font-medium text-foreground">
          Only a 5-character hash prefix is transmitted.
        </span>
        <span className="text-border-strong hidden sm:inline">•</span>
        <span className="text-muted hidden sm:inline">
          Protected by k-Anonymity.
        </span>
      </div>

      {/* Progressive Disclosure: How does the privacy-preserving lookup work? */}
      <details className="group border-t border-border/40 pt-2 text-xs">
        <summary className="cursor-pointer font-mono text-[11px] text-accent hover:underline flex items-center gap-1.5 select-none focus:outline-none">
          <span>How does the privacy-preserving lookup work?</span>
          <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
        </summary>

        <div className="mt-3 space-y-2.5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] text-muted leading-relaxed">
            {/* Step 1: Local SHA-1 Computation */}
            <div className="p-2.5 rounded bg-background-base/60 border border-border/50 space-y-1">
              <strong className="text-foreground block font-mono text-[10px] uppercase tracking-wider text-accent">
                01 // Local SHA-1 Hash
              </strong>
              <p>
                Your browser computes a 40-character hexadecimal SHA-1 digest locally via <code className="font-mono text-foreground">crypto.subtle.digest</code>. The plaintext password is never sent anywhere.
              </p>
            </div>

            {/* Step 2: 5-Character Prefix Transmission & Range Query */}
            <div className="p-2.5 rounded bg-background-base/60 border border-border/50 space-y-1">
              <strong className="text-foreground block font-mono text-[10px] uppercase tracking-wider text-accent">
                02 // Prefix Range Query
              </strong>
              <p>
                Only the first 5 characters (e.g. <code className="font-mono text-accent">5BAA6</code>) are sent to Have I Been Pwned. This prefix matches hundreds of thousands of unrelated candidate hashes.
              </p>
            </div>

            {/* Step 3: Local Suffix Matching */}
            <div className="p-2.5 rounded bg-background-base/60 border border-border/50 space-y-1">
              <strong className="text-foreground block font-mono text-[10px] uppercase tracking-wider text-accent">
                03 // Local Suffix Match
              </strong>
              <p>
                HIBP returns a list of candidate suffixes matching that prefix. Your browser compares the remaining 35 characters locally to confirm or refute exposure.
              </p>
            </div>
          </div>

          <p className="text-[10px] text-muted-dim font-mono pt-1">
            * Protocol Note: SHA-1 is used strictly because it is required by the Have I Been Pwned Pwned Passwords range lookup API standard.
          </p>
        </div>
      </details>
    </div>
  );
}
