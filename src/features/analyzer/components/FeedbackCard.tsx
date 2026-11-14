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
    <div className="space-y-3.5 p-4 rounded-card bg-background-surface/80 border border-border">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-dim flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-cyber-amber" />
          Estimator Feedback & Vulnerability Patterns
        </h3>
        <span className="text-[11px] font-mono text-foreground-dim">Actionable Guidance</span>
      </div>

      {/* Warning Banner */}
      {warning && (
        <div className="p-3 rounded-lg bg-cyber-rose-muted border border-cyber-rose-border flex items-start gap-2.5 text-xs text-cyber-rose">
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
          <span className="font-medium text-foreground-muted block">
            Recommendations to Strengthen This Password:
          </span>
          <ul className="space-y-1 pl-1">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-foreground-muted leading-relaxed"
              >
                <span className="text-cyber-emerald mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detected Patterns */}
      {patterns.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/40 text-xs">
          <span className="font-medium text-foreground-muted flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-cyber-cyan" />
            Detected Heuristic Patterns:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {patterns.map((pat, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded bg-background-elevated/40 border border-border/40 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-cyber-cyan uppercase font-semibold">
                    {pat.pattern}
                  </span>
                  <span className="text-foreground-dim font-mono">
                    "{pat.token}"
                  </span>
                </div>
                <span className="text-[11px] text-foreground-dim mt-1 leading-snug">
                  {pat.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasFeedback && (
        <div className="p-3 rounded-lg bg-cyber-emerald-muted border border-cyber-emerald-border flex items-center gap-2 text-xs text-cyber-emerald">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>No common dictionary words, spatial keyboard sequences, or repeated patterns detected.</span>
        </div>
      )}
    </div>
  );
}
