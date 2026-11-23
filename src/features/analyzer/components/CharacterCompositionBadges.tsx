import { Check, X, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { CharacterComposition } from '@/services/passwordAnalyzer';

export interface CharacterCompositionBadgesProps {
  composition: CharacterComposition;
}

export function CharacterCompositionBadges({
  composition,
}: CharacterCompositionBadgesProps) {
  const categories = [
    {
      label: 'Lowercase',
      sub: 'a-z',
      present: composition.hasLowercase,
      count: composition.lowercaseCount,
    },
    {
      label: 'Uppercase',
      sub: 'A-Z',
      present: composition.hasUppercase,
      count: composition.uppercaseCount,
    },
    {
      label: 'Numbers',
      sub: '0-9',
      present: composition.hasNumbers,
      count: composition.numbersCount,
    },
    {
      label: 'Symbols',
      sub: '!@#$',
      present: composition.hasSymbols,
      count: composition.symbolsCount,
    },
  ];

  return (
    <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-enclave-plate border border-border-strong shadow-card-tactical text-left">
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-secondary flex items-center gap-2 font-mono">
          <Layers className="w-4 h-4 text-accent" />
          <span>Character Diversity Matrix</span>
        </h3>
        <span className="text-xs font-mono text-foreground-dim">
          Total Length: <strong className="text-accent">{composition.length}</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {categories.map((cat) => (
          <div
            key={cat.label}
            className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
              cat.present
                ? 'bg-enclave-card border-border-strong text-foreground'
                : 'bg-enclave-void/60 border-border/50 text-foreground-dim'
            }`}
          >
            <div className="min-w-0 pr-2">
              <span className="text-xs font-bold block font-sans truncate">{cat.label}</span>
              <span className="text-[10px] font-mono text-foreground-dim">{cat.sub}</span>
            </div>
            {cat.present ? (
              <Badge variant="emerald" size="sm" className="shrink-0 tabular-nums">
                <Check className="w-3 h-3 mr-0.5" /> {cat.count}
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm" className="shrink-0 tabular-nums text-foreground-dim">
                <X className="w-3 h-3 mr-0.5" /> 0
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
