import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import {
  type StrengthScore,
  STRENGTH_VARIANTS,
} from '@/services/passwordAnalyzer';
import { ShieldCheck, Zap, Activity } from 'lucide-react';

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

    if (score === 0 || score === 1) return 'bg-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.4)]';
    if (score === 2) return 'bg-accent shadow-[0_0_8px_rgba(245,158,11,0.4)]';
    return 'bg-status-success shadow-[0_0_8px_rgba(16,185,129,0.4)]';
  };

  return (
    <div className="space-y-4 p-5 rounded-2xl bg-enclave-plate border border-border-strong shadow-card-tactical text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-enclave-void border border-border-strong text-foreground">
            <ShieldCheck className={cn('w-5 h-5', isEmpty ? 'text-muted' : score >= 2 ? 'text-status-success' : 'text-status-danger')} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground-secondary font-mono uppercase tracking-wider">
                Resilience Score:
              </span>
              <Badge
                variant={isEmpty ? 'neutral' : currentVariant.badgeVariant}
                size="md"
                dot={!isEmpty}
              >
                {isEmpty ? 'AWAITING INPUT' : `${currentVariant.label.toUpperCase()} (${score}/4)`}
              </Badge>
            </div>
            <p className="text-xs text-foreground-muted mt-1 leading-relaxed">
              {isEmpty
                ? 'Enter a password above to execute multi-scenario heuristic analysis.'
                : currentVariant.description}
            </p>
          </div>
        </div>

        {!isEmpty && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-mono text-accent bg-enclave-void px-3 py-1 rounded-lg border border-border-strong">
            <Zap className="w-3.5 h-3.5 text-accent" />
            <span className="tabular-nums font-bold">{calculationTimeMs}ms local</span>
          </div>
        )}
      </div>

      {/* 4 Segmented Tactical Bars */}
      <div className="space-y-1.5 pt-1">
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={cn(
                'h-2.5 rounded-full transition-all duration-300',
                getSegmentColor(step)
              )}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] font-mono text-foreground-dim uppercase tracking-wider pt-0.5">
          <span>01 // Very Weak</span>
          <span>02 // Weak</span>
          <span>03 // Reasonable</span>
          <span>04 // Strong</span>
        </div>
      </div>

      {/* Telemetry Metrics Readout */}
      {!isEmpty && (
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/80">
          <div className="p-3 rounded-xl bg-enclave-void border border-border-strong space-y-0.5">
            <span className="text-[10px] font-mono text-foreground-dim uppercase block">
              THEORETICAL CRACK DIFFICULTY
            </span>
            <span className="text-sm sm:text-base font-bold font-mono text-accent tabular-nums">
              ~{crackDifficultyBits} Bits
            </span>
          </div>

          <div className="p-3 rounded-xl bg-enclave-void border border-border-strong space-y-0.5">
            <span className="text-[10px] font-mono text-foreground-dim uppercase block">
              ESTIMATED GUESS SPACE
            </span>
            <span className="text-sm sm:text-base font-bold font-mono text-foreground tabular-nums truncate block">
              {guesses.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
