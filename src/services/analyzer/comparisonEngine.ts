import type { ComparisonAnalysisResult } from './types.ts';
import { analyzeEntropy } from './entropyAnalyzer.ts';
import { analyzeMarkov } from './markovAnalyzer.ts';
import { analyzePassword } from '../passwordAnalyzer.ts';

/**
 * Runs a simultaneous comparative evaluation of a password across all three methodologies:
 * 1. Zxcvbn (Pattern-aware dictionary guessability)
 * 2. Entropy (Theoretical keyspace under uniform randomness)
 * 3. Markov Chain (Probabilistic sequence transition surprisal)
 */
export function compareAllMethods(password: string): ComparisonAnalysisResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const zxcvbn = analyzePassword(password);
  const entropy = analyzeEntropy(password);
  const markov = analyzeMarkov(password);

  const discrepancyInsights: string[] = [];

  if (!password || password.length === 0) {
    discrepancyInsights.push('Enter a password to compare methodologies.');
    return {
      passwordLength: 0,
      zxcvbn,
      entropy,
      markov,
      discrepancyInsights,
      divergenceLevel: 'Aligned',
      calculationTimeMs: 0,
    };
  }

  // 1. Check for Dictionary / Pattern vs Theoretical Entropy Divergence
  // e.g. "Password123!" has theoretical entropy ~78 bits, but zxcvbn score 0 or 1
  const isHighEntropy = entropy.theoreticalEntropyBits >= 50;
  const isLowZxcvbn = zxcvbn.score <= 1;
  const isPredictableMarkov = markov.averageSurprisalBits < 3.5;

  let divergenceLevel: ComparisonAnalysisResult['divergenceLevel'] = 'Aligned';

  if (isHighEntropy && isLowZxcvbn) {
    divergenceLevel = 'High Divergence';
    discrepancyInsights.push(
      `Keyspace vs Heuristic Divergence: Theoretical entropy is ${entropy.theoreticalEntropyBits} bits (diverse character sets), but zxcvbn rates it as "${zxcvbn.scoreLabel}" because of recognized dictionary words or patterns.`
    );
  }

  if (isHighEntropy && isPredictableMarkov) {
    if (divergenceLevel !== 'High Divergence') divergenceLevel = 'Moderate Divergence';
    discrepancyInsights.push(
      `Sequence Predictability Warning: Despite a theoretical pool of ${entropy.poolSize} characters, Markov sequence analysis detects predictable character transitions (average surprisal: ${markov.averageSurprisalBits} bits/char).`
    );
  }

  if (zxcvbn.score >= 3 && entropy.theoreticalEntropyBits >= 60 && markov.averageSurprisalBits >= 5.0) {
    divergenceLevel = 'Aligned';
    discrepancyInsights.push(
      `Aligned High Strength: All three methodologies concur on strong resistance — high theoretical keyspace (${entropy.theoreticalEntropyBits} bits), robust zxcvbn guess-difficulty (${zxcvbn.crackDifficultyBits} bits), and high Markov sequence unpredictability (${markov.averageSurprisalBits} bits/char).`
    );
  } else if (zxcvbn.score <= 1 && entropy.theoreticalEntropyBits < 35 && markov.averageSurprisalBits < 3.2) {
    divergenceLevel = 'Aligned';
    discrepancyInsights.push(
      `Aligned Vulnerability: All three methodologies concur that this candidate is vulnerable — small theoretical keyspace (${entropy.theoreticalEntropyBits} bits), instant zxcvbn crack time, and predictable Markov transitions.`
    );
  } else if (discrepancyInsights.length === 0) {
    discrepancyInsights.push(
      `Methodological Differences: Zxcvbn assesses dictionary/pattern guessability (${zxcvbn.scoreLabel}), Entropy measures theoretical keyspace (${entropy.theoreticalEntropyBits} bits), and Markov measures character transition surprisal (${markov.averageSurprisalBits} bits/char).`
    );
  }

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const calculationTimeMs = Math.round((endTime - startTime) * 100) / 100;

  return {
    passwordLength: password.length,
    zxcvbn,
    entropy,
    markov,
    discrepancyInsights,
    divergenceLevel,
    calculationTimeMs,
  };
}
