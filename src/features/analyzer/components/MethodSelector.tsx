import React from 'react';
import {
  ANALYSIS_METHODS,
  type AnalysisMethod,
} from '@/services/analyzer/types';
import { Badge } from '@/components/ui/Badge';
import { Shield, Sparkles, Activity, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MethodSelectorProps {
  selectedMethod: AnalysisMethod;
  onSelectMethod: (method: AnalysisMethod) => void;
  disabled?: boolean;
}

const METHOD_ICONS: Record<AnalysisMethod, React.ComponentType<{ className?: string }>> = {
  zxcvbn: Shield,
  entropy: Sparkles,
  markov: Activity,
  compare: Layers,
};

export function MethodSelector({
  selectedMethod,
  onSelectMethod,
  disabled = false,
}: MethodSelectorProps) {
  const methodKeys: AnalysisMethod[] = ['zxcvbn', 'entropy', 'markov', 'compare'];

  return (
    <div className="space-y-2 text-left">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-foreground-dim flex items-center gap-1.5">
          <span>Analysis Methodology</span>
        </label>
        <span className="text-[10px] font-mono text-foreground-dim hidden sm:inline">
          {ANALYSIS_METHODS[selectedMethod].badge}
        </span>
      </div>

      <div
        role="tablist"
        aria-label="Password Analysis Methodology"
        className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-1.5 rounded-xl bg-enclave-plate border border-border-strong"
      >
        {methodKeys.map((key) => {
          const info = ANALYSIS_METHODS[key];
          const Icon = METHOD_ICONS[key];
          const isSelected = selectedMethod === key;

          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isSelected}
              disabled={disabled}
              onClick={() => onSelectMethod(key)}
              className={cn(
                'group relative flex flex-col items-start p-2.5 rounded-lg text-left transition-all duration-150',
                'focus:outline-none focus-visible:ring-1 focus-visible:ring-accent',
                isSelected
                  ? 'bg-enclave-card border border-accent/40 shadow-sm text-foreground'
                  : 'bg-transparent border border-transparent text-foreground-muted hover:text-foreground hover:bg-enclave-card/40'
              )}
            >
              <div className="flex items-center justify-between w-full gap-1 mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={cn(
                      'w-3.5 h-3.5 shrink-0 transition-colors',
                      isSelected ? 'text-accent' : 'text-foreground-dim group-hover:text-foreground-muted'
                    )}
                  />
                  <span className="text-xs font-bold font-sans tracking-tight">
                    {info.shortLabel}
                  </span>
                </div>
                <Badge
                  variant={isSelected ? info.badgeVariant : 'neutral'}
                  size="sm"
                  className="text-[9px] px-1.5 py-0 scale-90 origin-right"
                >
                  {key === 'markov' ? 'Exp' : key === 'compare' ? 'Multi' : key === 'entropy' ? 'Math' : 'Base'}
                </Badge>
              </div>

              <p className="text-[10px] text-foreground-dim line-clamp-1 font-sans">
                {info.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
