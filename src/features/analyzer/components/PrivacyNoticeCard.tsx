import { Shield, Lock } from 'lucide-react';

export function PrivacyNoticeCard() {
  return (
    <div className="p-3.5 rounded-card bg-background-elevated/40 border border-border/60 flex items-start gap-3 text-xs text-foreground-dim">
      <div className="p-1.5 rounded bg-background-surface border border-border/80 text-cyber-emerald shrink-0 mt-0.5">
        <Lock className="w-3.5 h-3.5" />
      </div>
      <div className="space-y-1 leading-relaxed">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <Shield className="w-3.5 h-3.5 text-cyber-emerald" />
          <span>Local Client-Side Evaluation Notice</span>
        </div>
        <p>
          CredLock evaluates passwords entirely in-memory using the open-source zxcvbn estimator. Your input is never transmitted to an external server, written to cookies, or logged. When you save an entry to history, only sanitized metrics (length, score, entropy, and composition flags) are recorded—never the password itself.
        </p>
      </div>
    </div>
  );
}
