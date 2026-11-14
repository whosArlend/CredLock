import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import {
  type StrengthScore,
  STRENGTH_VARIANTS,
} from '@/services/passwordAnalyzer';
import { ShieldCheck, Zap } from 'lucide-react';

export interface StrengthMeterProps {
  score: StrengthScore;
  isEmpty: boolean;
  crackDifficultyBits: number;
  guesses: number;
  calculationTimeMs: number;
}

export function StrengthMeter({
  score,
  isEmpty,
  crackDifficultyBits,
  guesses,
  calculationTimeMs,
}: StrengthMeterProps) {
  const currentVariant = STRENGTH_VARIANTS[score];

  const getSegmentColor = (segmentIndex: number) => {
    if (isEmpty) return 'bg-border/60';
    if (score < segmentIndex) return 'bg-border/60';

    if (score === 0 || score === 1) return 'bg-cyber-rose';
    if (score === 2) return 'bg-cyber-amber';
    return 'bg-cyber-emerald';
  };

  return (
    <div className="space-y-3.5 p-4 rounded-card bg-background-surface/80 border border-border">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-background-elevated text-foreground-dim">
            <ShieldCheck className="w-4 h-4 text-cyber-emerald" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground tracking-tight">
                Strength Score:
              </span>
              <Badge
                variant={isEmpty ? 'neutral' : currentVariant.badgeVariant}
                size="sm"
                dot={!isEmpty}
              >
                {isEmpty ? 'No Input' : `${currentVariant.label} (${score} / 4)`}
              </Badge>
            </div>
            <p className="text-xs text-foreground-muted mt-0.5">
              {isEmpty
                ? 'Type a password above to begin local heuristic evaluation.'
                : currentVariant.description}
            </p>
          </div>
        </div>

        {!isEmpty && (
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-foreground-dim bg-background-elevated/70 px-2.5 py-1 rounded border border-border/50">
            <Zap className="w-3.5 h-3.5 text-cyber-cyan" />
            <span>{calculationTimeMs}ms local</span>
          </div>
        )}
      </div>

      {/* Segmented Strength Bar */}
      <div className="space-y-1.5" role="progressbar" aria-valuenow={isEmpty ? 0 : score + 1} aria-valuemin={0} aria-valuemax={5}>
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((segmentIndex) => (
            <div
              key={segmentIndex}
              className={cn(
                'h-2.5 rounded-full transition-all duration-300',
                getSegmentColor(segmentIndex)
              )}
            />
          ))}
        </div>
        <div className="flex justify-between text-[11px] font-mono text-foreground-dim px-0.5">
          <span>Very Weak</span>
          <span>Weak</span>
          <span>Fair</span>
          <span>Very Strong</span>
        </div>
      </div>

      {/* Estimator Metrics */}
      {!isEmpty && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50 text-xs">
          <div className="flex justify-between items-center p-2 rounded bg-background-elevated/40 border border-border/40">
            <span className="text-foreground-muted">Estimated Guess-Work Difficulty:</span>
            <span className="font-mono text-cyber-emerald font-semibold">
              {crackDifficultyBits} bits
            </span>
          </div>
          <div className="flex justify-between items-center p-2 rounded bg-background-elevated/40 border border-border/40">
            <span className="text-foreground-muted">Estimated Attacker Guesses:</span>
            <span className="font-mono text-foreground font-semibold">
              {guesses.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
