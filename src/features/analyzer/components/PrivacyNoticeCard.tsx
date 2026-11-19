import { Lock } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

export function PrivacyNoticeCard() {
  return (
    <div className="p-3 rounded-lg bg-surface border border-border flex items-center justify-between text-xs text-muted">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
        <span className="font-semibold text-foreground">Evaluated locally</span>
        <span className="text-border-strong hidden sm:inline">•</span>
        <span className="hidden sm:inline text-muted">
          All analysis runs in local memory. Input is never transmitted.
        </span>
      </div>

      <Tooltip
        content="Calculations execute entirely in-browser using @zxcvbn-ts. No plaintext passwords, hashes, or identifiers are logged or sent to remote servers."
        position="top"
      >
        <button
          type="button"
          className="inline-flex items-center gap-1 font-mono text-[11px] text-accent hover:underline focus:outline-none"
          aria-label="Local client evaluation privacy details"
        >
          <Lock className="w-3 h-3" />
          <span>Details</span>
        </button>
      </Tooltip>
    </div>
  );
}
