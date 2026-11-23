import React from 'react';
import { Check, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
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
    label: 'Lowercase Characters',
    count: LOWERCASE_CHARS.length,
    examples: 'a-z (alphabetical set)',
    tag: '26 chars',
  },
  {
    key: 'includeUppercase',
    label: 'Uppercase Characters',
    count: UPPERCASE_CHARS.length,
    examples: 'A-Z (alphabetical set)',
    tag: '26 chars',
  },
  {
    key: 'includeNumbers',
    label: 'Numeric Digits',
    count: NUMBER_CHARS.length,
    examples: '0-9 (base-10 set)',
    tag: '10 chars',
  },
  {
    key: 'includeSymbols',
    label: 'Cryptographic Symbols',
    count: SYMBOL_CHARS.length,
    examples: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    tag: '32 chars',
  },
];

export const CategoryToggles: React.FC<CategoryTogglesProps> = ({
  options,
  onChange,
  disabled = false,
}) => {
  const poolSize = calculatePoolSize(options);
  const entropy = calculateTheoreticalPoolEntropy(options.length, poolSize);

  const activeCount = Object.entries(options).filter(
    ([k, v]) => k !== 'length' && Boolean(v)
  ).length;

  const handleToggle = (key: keyof Omit<GeneratorOptions, 'length'>) => {
    if (disabled) return;
    if (options[key] && activeCount <= 1) {
      return;
    }
    onChange({
      ...options,
      [key]: !options[key],
    });
  };

  return (
    <div className="rounded-2xl border border-border-strong bg-enclave-plate p-5 space-y-4 shadow-card-tactical text-left">
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-secondary font-mono">
            Character Space Allocation
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="cyan" size="sm">
            POOL: {poolSize}
          </Badge>
          <Badge variant="emerald" size="sm">
            ~{entropy} BITS
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CATEGORIES.map((cat) => {
          const isChecked = options[cat.key];
          const isOnlyOneActive = isChecked && activeCount <= 1;

          return (
            <div
              key={cat.key}
              onClick={() => !isOnlyOneActive && handleToggle(cat.key)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start justify-between gap-3 ${
                isChecked
                  ? 'bg-enclave-card border-border-strong hover:border-accent/40 shadow-sm'
                  : 'bg-enclave-void/50 border-border/60 opacity-60 hover:opacity-80'
              } ${isOnlyOneActive ? 'cursor-not-allowed opacity-90' : ''}`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold font-sans ${isChecked ? 'text-foreground' : 'text-foreground-dim'}`}>
                    {cat.label}
                  </span>
                  <span className="text-[10px] font-mono text-foreground-dim">({cat.tag})</span>
                </div>
                <p className="text-[11px] font-mono text-foreground-muted truncate">
                  {cat.examples}
                </p>
              </div>

              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                  isChecked
                    ? 'bg-accent border-accent text-enclave-void'
                    : 'bg-enclave-void border-border text-transparent'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
