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
    <div className="space-y-3.5 p-4 rounded-xl bg-surface border border-border">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5 font-mono">
          <Lightbulb className="w-3.5 h-3.5 text-accent" />
          <span>Vulnerability Analysis & Guidance</span>
        </h3>
        <span className="text-[10px] font-mono text-muted-dim">Heuristic Audit</span>
      </div>

      {/* Warning Banner */}
      {warning && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 flex items-start gap-2.5 text-xs text-danger">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="block font-semibold">Security Warning:</strong>
            {warning}
          </div>
        </div>
      )}

      {/* Suggestions List */}
      {suggestions.length > 0 && (
        <div className="space-y-1.5 text-xs">
          <span className="font-mono text-[11px] text-muted uppercase tracking-wider block">
            Actionable Recommendations:
          </span>
          <ul className="space-y-1 pl-1">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-foreground/90 leading-relaxed text-xs"
              >
                <span className="text-accent mt-0.5 font-bold">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detected Patterns */}
      {patterns.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/40 text-xs">
          <span className="font-mono text-[11px] text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Search className="w-3 h-3 text-accent" />
            Detected Heuristic Patterns:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {patterns.map((pat, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded bg-surface-elevated/40 border border-border/40 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-accent uppercase font-semibold">
                    {pat.pattern}
                  </span>
                  <span className="text-muted font-mono truncate max-w-[120px]">
                    "{pat.token}"
                  </span>
                </div>
                <span className="text-[11px] text-muted mt-1 leading-snug">
                  {pat.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasFeedback && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>No common dictionary words, spatial keyboard sequences, or repetition detected.</span>
        </div>
      )}
    </div>
  );
}
