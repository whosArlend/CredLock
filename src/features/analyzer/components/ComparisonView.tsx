import React from 'react';
import { Columns3, AlertCircle, Lightbulb, Shield, Hash, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { ComparisonAnalysisResult } from '@/services/analyzer/types';

interface ComparisonViewProps {
  result: ComparisonAnalysisResult | null;
  passwordLength: number;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ result, passwordLength }) => {
  if (!result || passwordLength === 0) {
    return (
      <div className="bg-enclave-plate rounded-xl border border-border-strong/50 p-6 text-center text-foreground-secondary text-sm">
        Enter a password to compare Zxcvbn, Theoretical Keyspace Entropy, and Markov Sequence Surprisal simultaneously.
      </div>
    );
  }

  const { zxcvbn, entropy, markov, discrepancyInsights, divergenceLevel } = result;
  const isDivergent = divergenceLevel !== 'Aligned';

  return (
    <div className="space-y-6 text-left">
      {/* Divergence Synthesis Card */}
      <div
        className={`p-5 rounded-xl border transition-colors ${
          isDivergent
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-enclave-plate border-border-strong/50'
        }`}
      >
        <div className="flex items-start gap-3">
          {isDivergent ? (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <Lightbulb className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          )}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Comparative Method Synthesis
              </span>
              <Badge variant={isDivergent ? 'amber' : 'emerald'} size="sm">
                {divergenceLevel}
              </Badge>
            </div>
            <div className="space-y-1.5">
              {discrepancyInsights.map((insight, idx) => (
                <p key={idx} className="text-xs sm:text-sm font-medium text-foreground leading-snug">
                  {insight}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Method Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Zxcvbn */}
        <div className="bg-enclave-plate rounded-xl border border-border-strong/50 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-status-info" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Zxcvbn</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-enclave-card text-foreground-secondary font-mono">
                Pattern-Aware
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-foreground-secondary">Estimated Strength</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold font-mono text-foreground">
                    Score {zxcvbn.score}
                  </span>
                  <span className="text-xs text-foreground-secondary">/ 4</span>
                </div>
              </div>

              <div className="text-xs space-y-1.5 pt-2 border-t border-border/20">
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Online Crack Time:</span>
                  <span className="font-mono text-foreground truncate max-w-[140px] text-right">
                    {zxcvbn.crackTimes.onlineUnthrottled}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Offline Fast Hash:</span>
                  <span className="font-mono text-foreground truncate max-w-[140px] text-right">
                    {zxcvbn.crackTimes.offlineFastHash}
                  </span>
                </div>
              </div>

              {zxcvbn.feedback.warning && (
                <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-400 leading-tight">
                  {zxcvbn.feedback.warning}
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-foreground-secondary pt-4 mt-4 border-t border-border/30">
            Penalizes common dictionary words, leetspeak, repeated chars, and dates.
          </div>
        </div>

        {/* Card 2: Keyspace Entropy */}
        <div className="bg-enclave-plate rounded-xl border border-border-strong/50 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Entropy</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-enclave-card text-foreground-secondary font-mono">
                Theoretical H
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-foreground-secondary">Theoretical Keyspace</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold font-mono text-foreground">
                    {entropy.theoreticalEntropyBits.toFixed(1)}
                  </span>
                  <span className="text-xs font-mono text-foreground-secondary">bits</span>
                </div>
              </div>

              <div className="text-xs space-y-1.5 pt-2 border-t border-border/20">
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Pool Size (R):</span>
                  <span className="font-mono text-foreground">{entropy.poolSize} chars</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Permutations:</span>
                  <span className="font-mono text-foreground truncate max-w-[140px] text-right">
                    ~10^{entropy.keyspaceLog10}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-1 text-xs">
                <span className="text-foreground-secondary">Rating:</span>
                <span className="font-semibold text-accent capitalize">{entropy.rating}</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-foreground-secondary pt-4 mt-4 border-t border-border/30">
            Assumes each character was selected with independent uniform randomness.
          </div>
        </div>

        {/* Card 3: Markov Chain */}
        <div className="bg-enclave-plate rounded-xl border border-border-strong/50 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Markov</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-enclave-card text-foreground-secondary font-mono">
                1st-Order Sequence
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-foreground-secondary">Average Surprisal (S̄)</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold font-mono text-foreground">
                    {markov.averageSurprisalBits.toFixed(2)}
                  </span>
                  <span className="text-xs font-mono text-foreground-secondary">bits/char</span>
                </div>
              </div>

              <div className="text-xs space-y-1.5 pt-2 border-t border-border/20">
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Total Surprisal:</span>
                  <span className="font-mono text-foreground">{markov.totalSurprisalBits.toFixed(1)} bits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Perplexity (2^S̄):</span>
                  <span className="font-mono text-foreground">
                    {markov.perplexity >= 1000 ? markov.perplexity.toExponential(1) : markov.perplexity.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-1 text-xs">
                <span className="text-foreground-secondary">Classification:</span>
                <span className="font-semibold text-amber-400 capitalize">{markov.predictabilityLabel}</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-foreground-secondary pt-4 mt-4 border-t border-border/30">
            Flags predictable digraphs, keyboard walks, and decimal sequences via transition logs.
          </div>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-enclave-plate rounded-xl border border-border-strong/50 overflow-hidden">
        <div className="p-4 border-b border-border/40 flex items-center gap-2">
          <Columns3 className="w-4 h-4 text-foreground-secondary" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Side-by-Side Model Comparison
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-enclave-card/50 text-foreground-secondary font-mono text-[11px]">
              <tr>
                <th className="p-3">Dimension</th>
                <th className="p-3">Zxcvbn</th>
                <th className="p-3">Keyspace Entropy</th>
                <th className="p-3">Markov Chain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20 text-foreground-secondary">
              <tr>
                <td className="p-3 font-medium text-foreground">Primary Question</td>
                <td className="p-3">Can common cracking tools guess this via dictionaries & rules?</td>
                <td className="p-3">How large is the brute-force search space under uniform randomness?</td>
                <td className="p-3">How surprising is the sequence of character transitions?</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground">Vulnerability to "Password123!"</td>
                <td className="p-3 text-rose-400 font-medium">High (flags dictionary word & sequence)</td>
                <td className="p-3 text-amber-400 font-medium">Low (appears high due to 4 char categories)</td>
                <td className="p-3 text-rose-400 font-medium">High (flags predictable 'pass' and '123')</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground">Core Assumption</td>
                <td className="p-3">Attacker uses dictionary, leetspeak, spatial & brute-force hybrid attacks</td>
                <td className="p-3">Attacker only does exhaustive search; characters chosen randomly</td>
                <td className="p-3">Attacker exploits 1st-order sequential Markov typing/word probabilities</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground">Recommended Context</td>
                <td className="p-3">Real-world user password defense & enforcement</td>
                <td className="p-3">Cryptographic keys & machine-generated tokens</td>
                <td className="p-3">Heuristic sequence regularity & keyboard pattern diagnostics</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
