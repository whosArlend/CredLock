import React from 'react';
import { Activity, AlertTriangle, Cpu, TrendingUp, Info } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { MarkovAnalysisResult } from '@/services/analyzer/types';

interface MarkovViewProps {
  result: MarkovAnalysisResult | null;
  passwordLength: number;
}

export const MarkovView: React.FC<MarkovViewProps> = ({ result, passwordLength }) => {
  if (!result || passwordLength === 0) {
    return (
      <div className="bg-enclave-plate rounded-xl border border-border-strong/50 p-6 text-center text-foreground-secondary text-sm">
        Enter a password to evaluate sequence predictability using the 1st-order Markov transition model.
      </div>
    );
  }

  // Color mapping based on predictability label
  const getBadgeVariant = (label: MarkovAnalysisResult['predictabilityLabel']): 'rose' | 'amber' | 'emerald' => {
    switch (label) {
      case 'Highly Predictable':
        return 'rose';
      case 'Moderately Predictable':
        return 'amber';
      case 'Moderate Unpredictability':
      case 'High Unpredictability':
        return 'emerald';
      default:
        return 'amber';
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Experimental Disclaimer Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-foreground-secondary leading-relaxed">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300">Experimental Heuristic Model: </span>
          {result.caveats[0]}
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Average Surprisal */}
        <div className="bg-enclave-plate rounded-xl border border-border-strong/50 p-5">
          <div className="flex items-center justify-between text-xs text-foreground-secondary mb-2">
            <span>Avg Surprisal (S̄)</span>
            <Activity className="w-4 h-4 text-accent" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold font-mono text-foreground tracking-tight">
              {result.averageSurprisalBits.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-foreground-secondary">bits/char</span>
          </div>
          <div className="text-[11px] text-foreground-secondary mt-2">
            Total surprisal: <span className="font-mono text-foreground">{result.totalSurprisalBits.toFixed(1)} bits</span> ({result.transitionsEvaluated} transitions)
          </div>
        </div>

        {/* Perplexity */}
        <div className="bg-enclave-plate rounded-xl border border-border-strong/50 p-5">
          <div className="flex items-center justify-between text-xs text-foreground-secondary mb-2">
            <span>Perplexity (2^S̄)</span>
            <Cpu className="w-4 h-4 text-status-info" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold font-mono text-foreground tracking-tight">
              {result.perplexity >= 1000 ? result.perplexity.toExponential(2) : result.perplexity.toFixed(1)}
            </span>
          </div>
          <div className="text-[11px] text-foreground-secondary mt-2">
            Effective branching factor per character transition
          </div>
        </div>

        {/* Predictability Score Gauge */}
        <div className="bg-enclave-plate rounded-xl border border-border-strong/50 p-5">
          <div className="flex items-center justify-between text-xs text-foreground-secondary mb-2">
            <span>Predictability Index</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold font-mono text-foreground tracking-tight">
              {result.predictabilityScore}
            </span>
            <span className="text-xs font-mono text-foreground-secondary">/ 100</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-enclave-card rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                result.predictabilityScore > 60
                  ? 'bg-rose-500'
                  : result.predictabilityScore > 35
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, result.predictabilityScore))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Model Rating Classification */}
      <div className="bg-enclave-plate rounded-xl border border-border-strong/50 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
              Sequence Classification
            </span>
            <Badge variant={getBadgeVariant(result.predictabilityLabel)} size="sm">
              {result.predictabilityLabel}
            </Badge>
          </div>
          <span className="text-xs text-foreground-secondary font-mono">
            Model: {result.modelInfo.name}
          </span>
        </div>
        <p className="text-xs text-foreground-secondary leading-relaxed">
          {result.modelInfo.description}
        </p>
      </div>

      {/* Transition Breakdown: Predictable vs Unusual */}
      {result.transitionsEvaluated > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Predictable Transitions */}
          <div className="bg-enclave-plate rounded-xl border border-border-strong/50 p-5">
            <div className="text-xs font-semibold text-foreground mb-3 flex items-center justify-between">
              <span>Top Predictable Transitions</span>
              <span className="text-[10px] text-foreground-secondary font-mono">Low surprisal</span>
            </div>
            {result.topPredictableTransitions.length === 0 ? (
              <div className="text-xs text-foreground-secondary italic py-2">No predictable transitions detected.</div>
            ) : (
              <div className="space-y-2">
                {result.topPredictableTransitions.map((t, idx) => (
                  <div
                    key={`pred-${idx}-${t.from}-${t.to}`}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-enclave-card border border-border-strong/40"
                  >
                    <div className="flex items-center gap-2 font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-enclave-plate border border-border text-foreground font-bold">
                        '{t.from}' → '{t.to}'
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-amber-400">{t.surprisalBits.toFixed(2)} bits</span>
                      <span className="text-foreground-secondary">P={(t.probability).toFixed(3)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Unusual Transitions */}
          <div className="bg-enclave-plate rounded-xl border border-border-strong/50 p-5">
            <div className="text-xs font-semibold text-foreground mb-3 flex items-center justify-between">
              <span>Top Unusual / Surprising Transitions</span>
              <span className="text-[10px] text-foreground-secondary font-mono">High surprisal</span>
            </div>
            {result.topUnusualTransitions.length === 0 ? (
              <div className="text-xs text-foreground-secondary italic py-2">No unusual transitions evaluated.</div>
            ) : (
              <div className="space-y-2">
                {result.topUnusualTransitions.map((t, idx) => (
                  <div
                    key={`unusual-${idx}-${t.from}-${t.to}`}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-enclave-card border border-border-strong/40"
                  >
                    <div className="flex items-center gap-2 font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-enclave-plate border border-border text-foreground font-bold">
                        '{t.from}' → '{t.to}'
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-accent">{t.surprisalBits.toFixed(2)} bits</span>
                      <span className="text-foreground-secondary">P={(t.probability).toExponential(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mathematical Reference Note */}
      <div className="p-4 rounded-xl bg-enclave-card border border-border-strong/40 text-xs text-foreground-secondary space-y-2">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <Info className="w-3.5 h-3.5 text-accent" />
          <span>About 1st-Order Markov Sequence Modeling</span>
        </div>
        <p className="leading-relaxed">
          The 1st-order Markov model calculates transition surprisal as{' '}
          <code className="text-accent font-mono">S = -log₂(P(c_{'{i}'} | c_{'{i-1}'}))</code>.
          Average surprisal measures sequence irregularity independent of password length, while perplexity{' '}
          <code className="text-accent font-mono">2^S̄</code> indicates the effective branching choice at each step.
        </p>
      </div>
    </div>
  );
};
