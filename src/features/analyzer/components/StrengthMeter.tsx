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

    if (score === 0 || score === 1) return 'bg-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.4)]';
    if (score === 2) return 'bg-accent shadow-[0_0_8px_rgba(245,158,11,0.4)]';
    return 'bg-status-success shadow-[0_0_8px_rgba(16,185,129,0.4)]';
  };

  // SVG Gauge Calculations: 240 degree arc from -210 deg to 30 deg
  const radius = 38;
  const strokeWidth = 6;
  const arcLength = 2 * Math.PI * radius * (240 / 360); // approx 159.2
  const normalizedEntropy = isEmpty ? 0 : Math.min(128, crackDifficultyBits);
  const strokeDashoffset = arcLength - (arcLength * (normalizedEntropy / 128));

  const getGaugeColor = () => {
    if (isEmpty) return '#383E46';
    if (score <= 1) return '#EF4444';
    if (score === 2) return '#E5A93C';
    if (score === 3) return '#34D399';
    return '#10B981';
  };

  return (
    <div className="space-y-5 p-5 sm:p-6 rounded-2xl bg-enclave-plate border border-border-strong shadow-card-tactical text-left relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div className="p-2.5 rounded-xl bg-enclave-void border border-border-strong text-foreground shrink-0 mt-0.5">
            <ShieldCheck className={cn('w-5 h-5', isEmpty ? 'text-muted' : score >= 2 ? 'text-status-success' : 'text-status-danger')} />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-foreground-secondary font-mono uppercase tracking-wider">
                Resilience Rating:
              </span>
              <Badge
                variant={isEmpty ? 'neutral' : currentVariant.badgeVariant}
                size="md"
                dot={!isEmpty}
              >
                {isEmpty ? 'AWAITING INPUT' : `${currentVariant.label.toUpperCase()} (${score}/4)`}
              </Badge>
            </div>
            <p className="text-xs text-foreground-muted leading-relaxed font-sans max-w-sm">
              {isEmpty
                ? 'Enter a password above to execute multi-scenario heuristic analysis.'
                : currentVariant.description}
            </p>
          </div>
        </div>

        {/* Interactive Circular Entropy Gauge */}
        <div className="flex items-center gap-4 self-center sm:self-auto shrink-0 p-2.5 rounded-xl bg-enclave-void/90 border border-enclave-border/80">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-20 h-20 -rotate-90 transform" viewBox="0 0 96 96">
              {/* Background Track */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="#242A34"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${arcLength} 360`}
                strokeLinecap="round"
                className="transform origin-center rotate-[30deg]"
              />
              {/* Dynamic Active Arc */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke={getGaugeColor()}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${arcLength} 360`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transform origin-center rotate-[30deg] transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
              <span className="text-sm font-black font-mono text-foreground tabular-nums">
                {isEmpty ? '0' : crackDifficultyBits}
              </span>
              <span className="text-[9px] font-mono text-foreground-dim uppercase tracking-wider pt-0.5">
                BITS
              </span>
            </div>
          </div>

          <div className="text-right space-y-1 font-mono text-xs">
            <span className="text-[10px] text-foreground-dim uppercase block">Engine Latency</span>
            <div className="flex items-center justify-end gap-1 text-accent font-bold">
              <Zap className="w-3 h-3 text-accent" />
              <span>{isEmpty ? '0' : calculationTimeMs}ms</span>
            </div>
            <span className="text-[9px] text-status-success font-semibold block uppercase">
              Client RAM
            </span>
          </div>
        </div>
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
