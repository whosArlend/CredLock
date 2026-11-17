import { ShieldCheck, Cpu, Network, EyeOff, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function BreachPrivacyNotice() {
  return (
    <Card variant="default" padding="lg" className="border-border space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-accent" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted font-mono">
            PRIVACY GUARANTEE // k-ANONYMITY RANGE PROTOCOL
          </h2>
        </div>
        <span className="font-mono text-[11px] text-muted-dim">
          ZERO-KNOWLEDGE VERIFICATION
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1: Local Digest */}
        <div className="p-4 rounded-lg bg-background-base/60 border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-accent">01 // LOCAL HASH</span>
            <Cpu className="w-4 h-4 text-muted" />
          </div>
          <h3 className="text-xs font-semibold text-foreground">
            Client-Side SHA-1 Computation
          </h3>
          <p className="text-xs text-muted leading-relaxed">
            Your browser generates a 40-character hexadecimal SHA-1 digest locally via <code className="font-mono text-[11px] text-foreground">crypto.subtle.digest</code>. The plaintext password is never sent anywhere.
          </p>
        </div>

        {/* Step 2: 5-Character Prefix Query */}
        <div className="p-4 rounded-lg bg-background-base/60 border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-accent">02 // RANGE QUERY</span>
            <Network className="w-4 h-4 text-muted" />
          </div>
          <h3 className="text-xs font-semibold text-foreground">
            5-Character Prefix Transmission
          </h3>
          <p className="text-xs text-muted leading-relaxed">
            Only the first 5 characters (e.g., <code className="font-mono text-[11px] text-accent">5BAA6</code>) are sent to Have I Been Pwned. A 5-character prefix matches hundreds of thousands of unrelated hashes.
          </p>
        </div>

        {/* Step 3: Local Suffix Matching */}
        <div className="p-4 rounded-lg bg-background-base/60 border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-accent">03 // LOCAL MATCH</span>
            <EyeOff className="w-4 h-4 text-muted" />
          </div>
          <h3 className="text-xs font-semibold text-foreground">
            In-Browser Suffix Comparison
          </h3>
          <p className="text-xs text-muted leading-relaxed">
            HIBP responds with a list of candidate suffixes matching that prefix. Your browser compares the remaining 35 characters locally to confirm or refute exposure.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-background-base/40 border border-border/60 text-xs text-muted">
        <AlertCircle className="w-4 h-4 text-muted shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-foreground font-mono">Protocol Note:</strong> SHA-1 is utilized strictly because it is required by the Have I Been Pwned Pwned Passwords range lookup specification. CredLock does not advocate SHA-1 as a secure password storage hashing algorithm.
        </p>
      </div>
    </Card>
  );
}
