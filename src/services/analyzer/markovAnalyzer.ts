import type {
  MarkovAnalysisResult,
  MarkovTransitionDetail,
} from './types.ts';
import {
  type MarkovModel,
  HEURISTIC_BASELINE_MARKOV_MODEL,
} from './markovModel.ts';

/**
 * Evaluates sequence predictability using a 1st-order Markov chain character model.
 *
 * Mathematical Formulation:
 * P(password) = P(c1) × ∏_{i=2}^n P(c_i | c_{i-1})
 *
 * Using base-2 logarithms to prevent numerical underflow:
 * log2 P(password) = log2 P(c1) + ∑_{i=2}^n log2 P(c_i | c_{i-1})
 *
 * Surprisal (Negative Log-Likelihood) = -log2 P(password) (bits)
 * Average Surprisal = Surprisal / n (bits per character)
 * Perplexity = 2^(Average Surprisal)
 */
export function analyzeMarkov(
  password: string,
  model: MarkovModel = HEURISTIC_BASELINE_MARKOV_MODEL
): MarkovAnalysisResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const length = password ? password.length : 0;

  if (length === 0) {
    return {
      totalSurprisalBits: 0,
      averageSurprisalBits: 0,
      perplexity: 1,
      predictabilityLabel: 'Highly Predictable',
      predictabilityScore: 0,
      length: 0,
      transitionsEvaluated: 0,
      topPredictableTransitions: [],
      topUnusualTransitions: [],
      modelInfo: {
        id: model.id,
        name: model.name,
        isExperimental: model.isExperimental,
        description: model.description,
      },
      caveats: [
        'Experimental Model: Markov analysis evaluates transition likelihood under a heuristic matrix.',
        'Enter a password to evaluate sequence predictability.',
      ],
      calculationTimeMs: 0,
    };
  }

  const epsilon = model.smoothingEpsilon > 0 ? model.smoothingEpsilon : 0.0001;
  const transitions: MarkovTransitionDetail[] = [];

  // 1. Initial character evaluation: P(c1)
  const firstChar = password[0] ?? '';
  const initialProb = (firstChar ? model.initialProbabilities[firstChar] : undefined) ?? epsilon;
  const initialLog2Prob = Math.log2(initialProb);
  let totalLog2Prob = initialLog2Prob;

  // 2. Transition evaluations: P(c_i | c_{i-1})
  for (let i = 1; i < length; i++) {
    const fromChar = password[i - 1] ?? '';
    const toChar = password[i] ?? '';

    if (!fromChar || !toChar) continue;

    const transitionMap = model.transitionProbabilities[fromChar];
    const rawProb = transitionMap ? transitionMap[toChar] : undefined;
    const isUnseen = rawProb === undefined;
    const prob = isUnseen ? epsilon : rawProb;

    const log2Prob = Math.log2(prob);
    totalLog2Prob += log2Prob;

    const surprisalBits = Math.round(-log2Prob * 100) / 100;

    transitions.push({
      from: fromChar,
      to: toChar,
      probability: prob,
      log2Probability: log2Prob,
      surprisalBits,
      isUnseen,
    });
  }

  // Total surprisal (bits) = -log2(P(password))
  const totalSurprisalBits = Math.max(0, Math.round(-totalLog2Prob * 10) / 10);

  // Average surprisal per character (bits/char)
  const rawAvgSurprisal = length > 0 ? totalSurprisalBits / length : 0;
  const averageSurprisalBits = Math.round(rawAvgSurprisal * 100) / 100;

  // Perplexity = 2^(averageSurprisal)
  // Clamp exponent to prevent Infinity on adversarial sequences
  const safeExponent = Math.min(averageSurprisalBits, 16);
  const perplexity = Math.round(Math.pow(2, safeExponent) * 10) / 10;

  // Predictability Score: normalized 0-100 (100 = heavily predictable sequence, 0 = highly unpredictable)
  // Baseline assumption: avg surprisal < 2.5 is very predictable; > 6.5 is highly randomized
  const normalizedPred = 100 - ((averageSurprisalBits - 2.0) / 5.0) * 100;
  const predictabilityScore = Math.max(0, Math.min(100, Math.round(normalizedPred)));

  // Predictability Label
  let predictabilityLabel: MarkovAnalysisResult['predictabilityLabel'] = 'Highly Predictable';
  if (averageSurprisalBits >= 5.8) {
    predictabilityLabel = 'High Unpredictability';
  } else if (averageSurprisalBits >= 4.5) {
    predictabilityLabel = 'Moderate Unpredictability';
  } else if (averageSurprisalBits >= 3.0) {
    predictabilityLabel = 'Moderately Predictable';
  }

  // Identify top 3 most predictable transitions (lowest surprisal)
  const sortedByPredictability = [...transitions].sort(
    (a, b) => a.surprisalBits - b.surprisalBits
  );
  const topPredictableTransitions = sortedByPredictability.slice(0, 3);

  // Identify top 3 most unusual / atypical transitions (highest surprisal)
  const sortedBySurprisal = [...transitions].sort(
    (a, b) => b.surprisalBits - a.surprisalBits
  );
  const topUnusualTransitions = sortedBySurprisal.slice(0, 3);

  const caveats: string[] = [
    'Experimental & Heuristic Model: This Markov model provides a relative sequence predictability metric based on structural digraphs, keyboard walks, and decimal sequences.',
    'Not an Attack Model: High surprisal does not guarantee brute-force immunity; it merely indicates atypical character transitions under this specific model.',
    'No Leaked Passwords: This model is intentionally not trained on real leaked password archives in adherence to CredLock academic privacy standards.',
  ];

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const calculationTimeMs = Math.round((endTime - startTime) * 100) / 100;

  return {
    totalSurprisalBits,
    averageSurprisalBits,
    perplexity,
    predictabilityLabel,
    predictabilityScore,
    length,
    transitionsEvaluated: transitions.length,
    topPredictableTransitions,
    topUnusualTransitions,
    modelInfo: {
      id: model.id,
      name: model.name,
      isExperimental: model.isExperimental,
      description: model.description,
    },
    caveats,
    calculationTimeMs,
  };
}
