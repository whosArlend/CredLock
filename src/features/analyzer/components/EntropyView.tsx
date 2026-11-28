import { useMemo } from 'react';
import { analyzeEntropy } from '@/services/analyzer/entropyAnalyzer';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, AlertTriangle, Binary, Info } from 'lucide-react';

interface EntropyViewProps {
  password: string;
}

export function EntropyView({ password }: EntropyViewProps) {
  const result = useMemo(() => analyzeEntropy(password), [password]);
  const isEmpty = password.length === 0;

  return (
    <div className="space-y-5 text-left">
      {/* 1. Main Entropy Metric Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-enclave-plate border border-border-strong shadow-card-tactical space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground-secondary">
              Theoretical Keyspace Entropy
            </span>
          </div>
          <Badge
            variant={
              result.rating === 'Very Strong' || result.rating === 'Strong'
                ? 'emerald'
                : result.rating === 'Moderate'
                ? 'amber'
                : 'rose'
            }
            size="sm"
          >
            {result.rating}
          </Badge>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-foreground tracking-tight">
                {isEmpty ? '0.0' : result.theoreticalEntropyBits.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-accent font-semibold">bits</span>
            </div>
            <p className="text-xs text-foreground-secondary font-sans mt-1">
              Theoretical search space: {isEmpty ? '0' : `~10^${result.keyspaceLog10}`} possible permutations
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-right sm:text-left text-xs font-mono">
            <div className="p-2 rounded-lg bg-enclave-card border border-border-subtle">
              <span className="text-[10px] text-foreground-dim block">LENGTH (L)</span>
              <span className="font-bold text-foreground text-sm">{result.length}</span>
            </div>
            <div className="p-2 rounded-lg bg-enclave-card border border-border-subtle">
              <span className="text-[10px] text-foreground-dim block">POOL SIZE (R)</span>
              <span className="font-bold text-foreground text-sm">{result.poolSize}</span>
            </div>
          </div>
        </div>

        {/* Visual Bit Progress Meter */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[10px] font-mono text-foreground-dim">
            <span>0 bits</span>
            <span>36 (Moderate)</span>
            <span>60 (Strong)</span>
            <span>80+ (Crypto-Grade)</span>
          </div>
          <div className="h-2 w-full rounded-full bg-enclave-card overflow-hidden border border-border-subtle flex">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${Math.min(100, (result.theoreticalEntropyBits / 100) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Mathematical Formula Breakdown Card */}
      <div className="p-5 rounded-2xl bg-enclave-plate border border-border-strong space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-foreground-dim">
          <Binary className="w-4 h-4 text-accent" />
          <span>Formula Breakdown</span>
        </div>

        <div className="p-3 rounded-xl bg-enclave-card border border-border-subtle font-mono text-xs text-foreground space-y-1">
          <div className="text-accent font-bold">
            H = L × log₂(R)
          </div>
          <div className="text-foreground-secondary text-[11px]">
            {isEmpty ? (
              <span>H = 0 × log₂(0) = 0 bits</span>
            ) : (
              <span>
                H = {result.length} × log₂({result.poolSize}) = {result.length} × {(Math.log2(result.poolSize || 1)).toFixed(3)} = {result.theoreticalEntropyBits} bits
              </span>
            )}
          </div>
        </div>

        {/* Character Categories Breakdown */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-foreground-dim block">
            Detected Character Categories:
          </span>
          {result.categoryBreakdown.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              {result.categoryBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-enclave-card/70 border border-border-subtle text-foreground-secondary text-[11px] flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-foreground-dim font-sans italic">
              No characters entered yet.
            </p>
          )}
        </div>
      </div>

      {/* 3. Critical Methodological Caution Banner */}
      <div className="p-4 rounded-xl bg-status-warning/10 border border-status-warning/30 space-y-2">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-foreground font-sans">
              Critical Uniform Randomness Assumption
            </h4>
            <p className="text-foreground-secondary leading-relaxed font-sans text-[11px]">
              This entropy calculation strictly assumes that every character was generated uniformly and independently at random by a machine CSPRNG.
            </p>
            <p className="text-foreground-secondary leading-relaxed font-sans text-[11px]">
              <strong className="text-foreground">Human Bias Reality:</strong> If this password contains dictionary words, keyboard walks, or names (e.g. <code className="font-mono text-accent">Password123!</code>), its real-world crack resistance is significantly lower than the calculated keyspace entropy.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Model Interpretation Guidance */}
      <div className="p-4 rounded-xl bg-enclave-plate border border-border-strong text-xs space-y-2">
        <div className="flex items-center gap-1.5 font-mono text-foreground-dim text-[11px] font-semibold">
          <Info className="w-3.5 h-3.5 text-accent" />
          <span>Entropy Interpretation Scale</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-foreground-secondary">
          <div className="p-1.5 rounded bg-enclave-card border border-border-subtle">
            <strong className="text-status-danger block">&lt; 28 bits</strong>
            <span>Trivial / Instant</span>
          </div>
          <div className="p-1.5 rounded bg-enclave-card border border-border-subtle">
            <strong className="text-status-warning block">36–59 bits</strong>
            <span>Moderate Resistance</span>
          </div>
          <div className="p-1.5 rounded bg-enclave-card border border-border-subtle">
            <strong className="text-status-success block">60–79 bits</strong>
            <span>Strong Security</span>
          </div>
          <div className="p-1.5 rounded bg-enclave-card border border-border-subtle">
            <strong className="text-accent block">80+ bits</strong>
            <span>Cryptographic Target</span>
          </div>
        </div>
      </div>
    </div>
  );
}
