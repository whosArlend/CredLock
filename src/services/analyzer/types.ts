import type { PasswordAnalysisResult } from '../passwordAnalyzer.js';

export type AnalysisMethod = 'zxcvbn' | 'entropy' | 'markov' | 'compare';

export interface MethodInfo {
  id: AnalysisMethod;
  label: string;
  shortLabel: string;
  badge: string;
  badgeVariant: 'neutral' | 'emerald' | 'amber' | 'rose';
  description: string;
  assumptions: string;
  isExperimental?: boolean;
}

export const ANALYSIS_METHODS: Record<AnalysisMethod, MethodInfo> = {
  zxcvbn: {
    id: 'zxcvbn',
    label: 'Zxcvbn Analysis',
    shortLabel: 'Zxcvbn',
    badge: 'Pattern-Aware Baseline',
    badgeVariant: 'emerald',
    description:
      'Pattern-aware password strength estimation using dictionary matching, common patterns, sequences, and guessability estimation.',
    assumptions:
      'Simulates attacker brute-force search strategies based on known dictionaries, spatial keyboard walks, l33t substitutions, and repeat sequences.',
  },
  entropy: {
    id: 'entropy',
    label: 'Entropy Analysis',
    shortLabel: 'Entropy',
    badge: 'Theoretical Model',
    badgeVariant: 'amber',
    description:
      'Estimates theoretical entropy based on password length and character-set assumptions.',
    assumptions:
      'Strictly assumes uniformly distributed, independent character selection from the detected character pool (H = L × log2(R)). Does not account for human pattern bias.',
  },
  markov: {
    id: 'markov',
    label: 'Markov Chain Analysis (Experimental)',
    shortLabel: 'Markov Chain',
    badge: 'Experimental Heuristic',
    badgeVariant: 'rose',
    description:
      'Experimental probabilistic analysis of character sequences. Results depend on the underlying probability model and are not a validated cracking-time prediction.',
    assumptions:
      'Evaluates character-to-character transition likelihood under a 1st-order heuristic transition matrix. Unseen transitions use Laplace smoothing.',
    isExperimental: true,
  },
  compare: {
    id: 'compare',
    label: 'Compare All Methods',
    shortLabel: 'Compare All',
    badge: 'Multi-Method View',
    badgeVariant: 'neutral',
    description:
      'Simultaneously analyzes the password across all available methods and contrasts theoretical, heuristic, and probabilistic assessments.',
    assumptions:
      'Highlights divergence between mathematical keyspace, pattern-matching guessability, and sequence surprisal without conflating them into a false unified score.',
  },
};

export interface EntropyAnalysisResult {
  theoreticalEntropyBits: number; // H = L * log2(R)
  length: number;                 // L
  poolSize: number;               // R
  detectedCategories: {
    hasLowercase: boolean;
    lowercaseCount: number;
    hasUppercase: boolean;
    uppercaseCount: number;
    hasNumbers: boolean;
    numbersCount: number;
    hasSymbols: boolean;
    symbolsCount: number;
  };
  categoryBreakdown: string[];
  rating: 'Very Low' | 'Low' | 'Moderate' | 'Strong' | 'Very Strong';
  ratingColor: string;
  keyspaceLog10: number;          // log10(R^L) = L * log10(R)
  assumptionsText: string;
  cautions: string[];
  calculationTimeMs: number;
}

export interface MarkovTransitionDetail {
  from: string;
  to: string;
  probability: number;
  log2Probability: number;
  surprisalBits: number;
  isUnseen: boolean;
}

export interface MarkovAnalysisResult {
  totalSurprisalBits: number;     // -log2(P(password))
  averageSurprisalBits: number;   // -log2(P(password)) / L (bits/char)
  perplexity: number;             // 2^(averageSurprisal)
  predictabilityLabel:
    | 'Highly Predictable'
    | 'Moderately Predictable'
    | 'Moderate Unpredictability'
    | 'High Unpredictability';
  predictabilityScore: number;    // 0 (completely unpredictable) to 100 (heavily predictable)
  length: number;
  transitionsEvaluated: number;
  topPredictableTransitions: MarkovTransitionDetail[];
  topUnusualTransitions: MarkovTransitionDetail[];
  modelInfo: {
    id: string;
    name: string;
    isExperimental: boolean;
    description: string;
  };
  caveats: string[];
  calculationTimeMs: number;
}

export interface ComparisonAnalysisResult {
  passwordLength: number;
  zxcvbn: PasswordAnalysisResult;
  entropy: EntropyAnalysisResult;
  markov: MarkovAnalysisResult;
  discrepancyInsights: string[];
  divergenceLevel: 'Aligned' | 'Moderate Divergence' | 'High Divergence';
  calculationTimeMs: number;
}
