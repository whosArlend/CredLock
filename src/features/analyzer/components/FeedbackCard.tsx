import { AlertTriangle, Lightbulb, Search, CheckCircle } from 'lucide-react';
import type { DetectedPattern } from '@/services/passwordAnalyzer';

export interface FeedbackCardProps {
  warning: string | null;
  suggestions: string[];
  patterns: DetectedPattern[];
  isEmpty: boolean;
}

export function FeedbackCard({
  warning,
  suggestions,
  patterns,
  isEmpty,
}: FeedbackCardProps) {
  if (isEmpty) {
    return null;
  }

  const hasFeedback = Boolean(warning) || suggestions.length > 0 || patterns.length > 0;

  return (
    <div className="space-y-4 p-5 rounded-2xl bg-enclave-plate border border-border-strong shadow-card-tactical text-left">
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-secondary flex items-center gap-2 font-mono">
          <Lightbulb className="w-4 h-4 text-accent" />
          <span>Vulnerability Analysis & Heuristics</span>
        </h3>
        <span className="text-[10px] font-mono text-foreground-dim uppercase">Heuristic Audit</span>
      </div>

      {/* Warning Banner */}
      {warning && (
        <div className="p-3.5 rounded-xl bg-status-danger/10 border border-status-danger/30 flex items-start gap-3 text-xs text-[#EF4444]">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="block font-bold">Vulnerability Warning:</strong>
            {warning}
          </div>
        </div>
      )}

      {/* Suggestions List */}
      {suggestions.length > 0 && (
        <div className="space-y-2 text-xs">
          <span className="font-mono text-[10px] text-foreground-dim uppercase tracking-wider block font-bold">
            Hardening Recommendations:
          </span>
          <ul className="space-y-1.5 pl-1">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="flex items-start gap-2.5 text-foreground leading-relaxed text-xs"
              >
                <span className="text-accent mt-0.5 font-bold font-mono">»</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Patterns Detected */}
      {patterns.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-border/80">
          <span className="font-mono text-[10px] text-foreground-dim uppercase tracking-wider block font-bold">
            Detected Structural Patterns:
          </span>
          <div className="flex flex-wrap gap-2">
            {patterns.map((pat, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-enclave-void border border-border-strong text-xs font-mono text-foreground-secondary"
              >
                <Search className="w-3 h-3 text-accent" />
                <span className="font-bold text-foreground">{pat.pattern}:</span>
                <span className="text-foreground-muted">{pat.token}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {!hasFeedback && (
        <div className="flex items-center gap-2.5 text-xs text-status-success p-3 rounded-xl bg-status-success/10 border border-status-success/20">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">No obvious dictionary words, keyboard walks, or repeat patterns detected.</span>
        </div>
      )}
    </div>
  );
}
