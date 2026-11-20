import React from 'react';
import { Check, ShieldAlert, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  LOWERCASE_CHARS,
  UPPERCASE_CHARS,
  NUMBER_CHARS,
  SYMBOL_CHARS,
  calculatePoolSize,
  calculateTheoreticalPoolEntropy,
} from '@/services/passwordGenerator';
import type { GeneratorOptions } from '@/types';

interface CategoryTogglesProps {
  options: GeneratorOptions;
  onChange: (options: GeneratorOptions) => void;
  disabled?: boolean;
}

interface CategoryConfig {
  key: keyof Omit<GeneratorOptions, 'length'>;
  label: string;
  count: number;
  examples: string;
  tag: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'includeLowercase',
    label: 'Lowercase Letters',
    count: LOWERCASE_CHARS.length,
    examples: 'a-z (e.g. a, b, c...)',
    tag: '26 chars',
  },
  {
    key: 'includeUppercase',
    label: 'Uppercase Letters',
    count: UPPERCASE_CHARS.length,
    examples: 'A-Z (e.g. A, B, C...)',
    tag: '26 chars',
  },
  {
    key: 'includeNumbers',
    label: 'Numbers / Digits',
    count: NUMBER_CHARS.length,
    examples: '0-9 (e.g. 0, 1, 2...)',
    tag: '10 chars',
  },
  {
    key: 'includeSymbols',
    label: 'Special Symbols',
    count: SYMBOL_CHARS.length,
    examples: '!@#$%^&*()_+-=[]{}...',
    tag: '32 chars',
  },
];

export const CategoryToggles: React.FC<CategoryTogglesProps> = ({
  options,
  onChange,
  disabled = false,
}) => {
  const handleToggle = (key: keyof Omit<GeneratorOptions, 'length'>) => {
    onChange({
      ...options,
      [key]: !options[key],
    });
  };

  const poolSize = calculatePoolSize(options);
  const theoreticalPoolEntropyBits = calculateTheoreticalPoolEntropy(options.length, poolSize);
  const selectedCount =
    (options.includeLowercase ? 1 : 0) +
    (options.includeUppercase ? 1 : 0) +
    (options.includeNumbers ? 1 : 0) +
    (options.includeSymbols ? 1 : 0);

  const hasNoCategories = selectedCount === 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3.5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" aria-hidden="true" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted font-mono">
            Character Sets & Pool
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge variant={hasNoCategories ? 'rose' : 'cyan'} size="sm">
            Pool: <span className="font-mono">{poolSize}</span>
          </Badge>
          <Tooltip content="Theoretical pool-based entropy estimate: length * log2(poolSize). Upper bound assuming unconstrained uniform selection.">
            <div>
              <Badge variant={hasNoCategories ? 'rose' : 'emerald'} size="sm">
                ~<span className="font-mono">{theoreticalPoolEntropyBits}</span> bits
              </Badge>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Category Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {CATEGORIES.map((cat) => {
          const isChecked = options[cat.key];
          return (
            <button
              key={cat.key}
              type="button"
              role="checkbox"
              aria-checked={isChecked}
              disabled={disabled}
              onClick={() => handleToggle(cat.key)}
              className={`flex items-start justify-between p-2.5 rounded-lg border text-left transition-all select-none ${
                isChecked
                  ? 'border-accent/50 bg-accent/10 hover:border-accent text-foreground'
                  : 'border-border/60 bg-background-base/60 hover:border-border text-muted'
              } disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent`}
            >
              <div className="space-y-0.5 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold ${isChecked ? 'text-accent' : 'text-muted'}`}>
                    {cat.label}
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-background-base text-muted-dim border border-border/40">
                    {cat.tag}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-muted-dim truncate max-w-[170px]">
                  {cat.examples}
                </div>
              </div>

              {/* Styled Check Indicator */}
              <div
                className={`mt-0.5 shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                  isChecked
                    ? 'border-accent bg-accent text-background-base'
                    : 'border-border bg-surface text-transparent'
                }`}
                aria-hidden="true"
              >
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Validation Warning when no category selected */}
      {hasNoCategories && (
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/10 p-2.5 text-xs text-danger flex items-center gap-2"
        >
          <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>
            <strong>Configuration Required:</strong> Select at least one character category.
          </span>
        </div>
      )}
    </div>
  );
};
