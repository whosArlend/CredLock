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
    <div className="space-y-3.5 p-4 rounded-xl bg-surface border border-border">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-surface-elevated text-foreground">
            <ShieldCheck className={cn('w-4 h-4', isEmpty ? 'text-muted' : score >= 2 ? 'text-emerald-500' : 'text-danger')} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground font-mono uppercase tracking-wider">
                Resilience Gauge:
              </span>
              <Badge
                variant={isEmpty ? 'neutral' : currentVariant.badgeVariant}
                size="sm"
                dot={!isEmpty}
              >
                {isEmpty ? 'Awaiting Input' : `${currentVariant.label} (${score}/4)`}
              </Badge>
            </div>
            <p className="text-[11px] text-muted mt-0.5">
              {isEmpty
                ? 'Enter a password above to begin heuristic strength analysis.'
                : currentVariant.description}
            </p>
          </div>
        </div>

        {!isEmpty && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto text-[11px] font-mono text-muted bg-surface-elevated/80 px-2 py-0.5 rounded border border-border/60">
            <Zap className="w-3 h-3 text-accent" />
            <span>{calculationTimeMs}ms local</span>
          </div>
        )}
      </div>

      {/* Segmented Strength Bar */}
      <div className="space-y-1.5" role="progressbar" aria-valuenow={isEmpty ? 0 : score + 1} aria-valuemin={0} aria-valuemax={5}>
        <div className="grid grid-cols-4 gap-1.5">
          {[0, 1, 2, 3].map((segmentIndex) => (
            <div
              key={segmentIndex}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                getSegmentColor(segmentIndex)
              )}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] font-mono text-muted-dim px-0.5">
          <span>Very Weak</span>
          <span>Weak</span>
          <span>Fair</span>
          <span>Strong</span>
        </div>
      </div>

      {/* Estimator Metrics */}
      {!isEmpty && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
          <div className="p-2 rounded bg-surface-elevated/50 border border-border/50 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-muted uppercase tracking-wider">Entropy Work</span>
            <span className="font-mono text-sm text-emerald-400 font-bold">
              {crackDifficultyBits} <span className="text-[10px] font-normal text-muted">bits</span>
            </span>
          </div>
          <div className="p-2 rounded bg-surface-elevated/50 border border-border/50 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-muted uppercase tracking-wider">Attacker Guesses</span>
            <span className="font-mono text-sm text-foreground font-bold truncate">
              {guesses.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
