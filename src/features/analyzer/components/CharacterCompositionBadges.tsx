import { Check, X, Layers, Info } from 'lucide-react';
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
      label: 'Lowercase (a-z)',
      present: composition.hasLowercase,
      count: composition.lowercaseCount,
    },
    {
      label: 'Uppercase (A-Z)',
      present: composition.hasUppercase,
      count: composition.uppercaseCount,
    },
    {
      label: 'Numbers (0-9)',
      present: composition.hasNumbers,
      count: composition.numbersCount,
    },
    {
      label: 'Symbols (!@#$)',
      present: composition.hasSymbols,
      count: composition.symbolsCount,
    },
  ];

  return (
    <div className="space-y-3 p-4 rounded-xl bg-surface border border-border">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5 font-mono">
          <Layers className="w-3.5 h-3.5 text-accent" />
          <span>Character Diversity</span>
        </h3>
        <span className="text-xs font-mono text-muted">
          Length: <strong className="text-foreground">{composition.length}</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {categories.map((cat) => (
          <div
            key={cat.label}
            className="flex items-center justify-between p-2 rounded-lg bg-surface-elevated/40 border border-border/50 text-xs"
          >
            <span className="text-muted truncate mr-1 text-[11px]">{cat.label}</span>
            {cat.present ? (
              <Badge variant="emerald" size="sm">
                <Check className="w-3 h-3 mr-0.5" /> {cat.count}
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">
                <X className="w-3 h-3 mr-0.5" /> 0
              </Badge>
            )}
          </div>
        ))}
      </div>

      {composition.length > 0 && (
        <div className="pt-2 border-t border-border/40 text-[11px] text-muted flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-muted-dim shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-foreground">Theoretical Pool Entropy:</strong>{' '}
            <span className="font-mono text-accent font-semibold">
              {composition.theoreticalPoolEntropyBits} bits
            </span>{' '}
            ({composition.theoreticalPoolSize}-char pool). Upper bound under uniform random selection.
          </p>
        </div>
      )}
    </div>
  );
}
