import { Check, X } from 'lucide-react';
import type { PasswordEvaluation } from '../types';
import { cn } from '@/lib/utils';

export interface PasswordRequirementsProps {
  evaluation: PasswordEvaluation;
  showRequirements?: boolean;
}

export function PasswordRequirements({
  evaluation,
  showRequirements = true,
}: PasswordRequirementsProps) {
  const { score, scoreLabel, requirements } = evaluation;

  // Strength score styling
  const strengthColors: Record<number, { bar: string; text: string; bg: string }> = {
    0: { bar: 'bg-zinc-700', text: 'text-zinc-500', bg: 'bg-zinc-800/40' },
    1: { bar: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10' },
    2: { bar: 'bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10' },
    3: { bar: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    4: { bar: 'bg-emerald-400', text: 'text-emerald-300', bg: 'bg-emerald-400/10' },
  };

  const fallbackTheme = { bar: 'bg-zinc-700', text: 'text-zinc-500', bg: 'bg-zinc-800/40' };
  const currentTheme = strengthColors[score] ?? fallbackTheme;

  return (
    <div className="space-y-3 font-sans" aria-live="polite">
      {/* Strength Header & Indicator Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted font-mono uppercase tracking-wider text-[11px]">
            Password Complexity
          </span>
          <span className={cn('font-mono font-semibold text-xs', currentTheme.text)}>
            {scoreLabel}
          </span>
        </div>

        {/* 4-Segment Strength Track */}
        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
          {[1, 2, 3, 4].map((step) => {
            const isActive = score >= step;
            return (
              <div
                key={step}
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  isActive ? currentTheme.bar : 'bg-surface-elevated/80 border border-border/50'
                )}
              />
            );
          })}
        </div>
      </div>

      {/* Granular Requirement Checklist */}
      {showRequirements && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
          {requirements.map((req) => (
            <div
              key={req.id}
              className={cn(
                'flex items-center gap-2 text-xs py-1 px-2 rounded-md transition-colors',
                req.met
                  ? 'text-emerald-400 bg-emerald-500/5'
                  : 'text-muted bg-surface-elevated/30'
              )}
            >
              <div
                className={cn(
                  'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[10px]',
                  req.met
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-surface-elevated text-zinc-600 border border-border/60'
                )}
                aria-hidden="true"
              >
                {req.met ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : <X className="h-2.5 w-2.5" />}
              </div>
              <span className={req.met ? 'font-medium' : ''}>{req.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
