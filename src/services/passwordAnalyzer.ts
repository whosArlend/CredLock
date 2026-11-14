import { ZxcvbnFactory, type ZxcvbnResult } from '@zxcvbn-ts/core';
import * as common from '@zxcvbn-ts/language-common';
import * as en from '@zxcvbn-ts/language-en';
import type { SanitizedAnalysisRecord } from '@/types';

// Instantiate the zxcvbn engine with common and English dictionaries
const zxcvbnInstance = new ZxcvbnFactory({
  translations: en.translations,
  graphs: common.adjacencyGraphs,
  dictionary: {
    ...common.dictionary,
    ...en.dictionary,
  },
});

export type StrengthScore = 0 | 1 | 2 | 3 | 4;
export type StrengthLabel = 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';

export interface CharacterComposition {
  length: number;
  hasLowercase: boolean;
  lowercaseCount: number;
  hasUppercase: boolean;
  uppercaseCount: number;
  hasNumbers: boolean;
  numbersCount: number;
  hasSymbols: boolean;
  symbolsCount: number;
  theoreticalPoolSize: number;
  theoreticalPoolEntropyBits: number;
}

export interface AttackScenarioCrackTime {
  onlineThrottled: string;    // 100 per hour (throttled login endpoint)
  onlineUnthrottled: string;  // 10 per second (unthrottled login endpoint)
  offlineSlowHash: string;    // 10,000 per second (e.g. bcrypt, Argon2, scrypt)
  offlineFastHash: string;    // 10,000,000,000 per second (e.g. MD5, SHA-256 on GPUs)
}

export interface DetectedPattern {
  pattern: string;
  token: string;
  description: string;
}

export interface PasswordAnalysisResult {
  score: StrengthScore;
  scoreLabel: StrengthLabel;
  scorePercentage: number;
  guesses: number;
  guessesLog10: number;
  crackDifficultyBits: number; // log2(guesses) — estimated guess difficulty, NOT Shannon entropy
  crackTimes: AttackScenarioCrackTime;
  feedback: {
    warning: string | null;
    suggestions: string[];
  };
  patternsDetected: DetectedPattern[];
  composition: CharacterComposition;
  calculationTimeMs: number;
}

export const STRENGTH_LABELS: Record<StrengthScore, StrengthLabel> = {
  0: 'Very Weak',
  1: 'Weak',
  2: 'Fair',
  3: 'Strong',
  4: 'Very Strong',
};

export const STRENGTH_VARIANTS: Record<
  StrengthScore,
  {
    label: StrengthLabel;
    badgeVariant: 'rose' | 'amber' | 'emerald';
    barColor: string;
    description: string;
  }
> = {
  0: {
    label: 'Very Weak',
    badgeVariant: 'rose',
    barColor: 'bg-cyber-rose',
    description: 'Extremely vulnerable to instant dictionary attacks and automated guessing.',
  },
  1: {
    label: 'Weak',
    badgeVariant: 'rose',
    barColor: 'bg-cyber-rose/80',
    description: 'Vulnerable to offline cracking tools and wordlist permutations.',
  },
  2: {
    label: 'Fair',
    badgeVariant: 'amber',
    barColor: 'bg-cyber-amber',
    description: 'Provides moderate resistance against online attacks, but susceptible to GPU-accelerated cracking.',
  },
  3: {
    label: 'Strong',
    badgeVariant: 'emerald',
    barColor: 'bg-cyber-emerald/80',
    description: 'High resistance against brute-force and dictionary attacks across realistic threat models.',
  },
  4: {
    label: 'Very Strong',
    badgeVariant: 'emerald',
    barColor: 'bg-cyber-emerald',
    description: 'Exceptionally resilient against large-scale offline cracking clusters.',
  },
};

/**
 * Calculates character counts and theoretical pool size.
 */
function analyzeComposition(password: string): CharacterComposition {
  const lowercaseMatches = password.match(/[a-z]/g);
  const uppercaseMatches = password.match(/[A-Z]/g);
  const numberMatches = password.match(/[0-9]/g);
  const symbolMatches = password.match(/[^a-zA-Z0-9]/g);

  const lowercaseCount = lowercaseMatches ? lowercaseMatches.length : 0;
  const uppercaseCount = uppercaseMatches ? uppercaseMatches.length : 0;
  const numbersCount = numberMatches ? numberMatches.length : 0;
  const symbolsCount = symbolMatches ? symbolMatches.length : 0;

  let poolSize = 0;
  if (lowercaseCount > 0) poolSize += 26;
  if (uppercaseCount > 0) poolSize += 26;
  if (numbersCount > 0) poolSize += 10;
  if (symbolsCount > 0) poolSize += 33; // Standard printable ASCII symbol count

  // Theoretical pool entropy: L * log2(poolSize)
  // Note: This assumes completely uniform independent character selection, which user-chosen passwords do not have.
  const theoreticalPoolEntropyBits =
    password.length > 0 && poolSize > 0
      ? Math.round(password.length * Math.log2(poolSize) * 10) / 10
      : 0;

  return {
    length: password.length,
    hasLowercase: lowercaseCount > 0,
    lowercaseCount,
    hasUppercase: uppercaseCount > 0,
    uppercaseCount,
    hasNumbers: numbersCount > 0,
    numbersCount,
    hasSymbols: symbolsCount > 0,
    symbolsCount,
    theoreticalPoolSize: poolSize,
    theoreticalPoolEntropyBits,
  };
}

/**
 * Extracts human-readable pattern descriptions from zxcvbn match sequences.
 */
function extractPatterns(result: ZxcvbnResult): DetectedPattern[] {
  if (!result.sequence || !Array.isArray(result.sequence)) {
    return [];
  }

  const patterns: DetectedPattern[] = [];

  for (const match of result.sequence) {
    let description = 'Pattern match';
    const token = match.token;

    switch (match.pattern) {
      case 'dictionary': {
        const dictName = (match as unknown as { dictionaryName?: string }).dictionaryName || 'dictionary';
        description = `Dictionary word or common term (${dictName.replace('-', ' ')})`;
        break;
      }
      case 'spatial':
        description = 'Keyboard pattern or adjacent key walk (e.g. QWERTY)';
        break;
      case 'repeat':
        description = 'Repeated consecutive characters';
        break;
      case 'sequence':
        description = 'Sequential sequence (e.g. abc, 123)';
        break;
      case 'regex':
        description = 'Common numeric sequence or date pattern';
        break;
      case 'date':
        description = 'Recognizable calendar date';
        break;
      case 'bruteforce':
        // Bruteforce matches are filler/residual segments, skip from user-facing pattern list
        continue;
      default:
        description = `Identified pattern: ${match.pattern}`;
        break;
    }

    patterns.push({
      pattern: match.pattern,
      token,
      description,
    });
  }

  return patterns;
}

/**
 * Analyzes a password string locally in the browser sandbox.
 * Never transmits, persists, or logs the input string.
 */
export function analyzePassword(password: string): PasswordAnalysisResult {
  const composition = analyzeComposition(password);

  if (!password || password.length === 0) {
    return {
      score: 0,
      scoreLabel: 'Very Weak',
      scorePercentage: 0,
      guesses: 0,
      guessesLog10: 0,
      crackDifficultyBits: 0,
      crackTimes: {
        onlineThrottled: 'instant',
        onlineUnthrottled: 'instant',
        offlineSlowHash: 'instant',
        offlineFastHash: 'instant',
      },
      feedback: {
        warning: null,
        suggestions: ['Enter a password to evaluate its strength.'],
      },
      patternsDetected: [],
      composition,
      calculationTimeMs: 0,
    };
  }

  const result = zxcvbnInstance.check(password);

  // Convert estimator guesses to bits of crack difficulty: log2(guesses)
  // Be precise: this is guess-work difficulty, NOT information-theoretic Shannon entropy
  const crackDifficultyBits =
    result.guesses > 0
      ? Math.round(Math.log2(result.guesses) * 10) / 10
      : 0;

  const score = result.score as StrengthScore;
  const scoreLabel = STRENGTH_LABELS[score];
  const scorePercentage = (score / 4) * 100;

  const crackTimes: AttackScenarioCrackTime = {
    onlineThrottled: result.crackTimes.onlineThrottlingXPerHour.display || 'instant',
    onlineUnthrottled: result.crackTimes.onlineNoThrottlingXPerSecond.display || 'instant',
    offlineSlowHash: result.crackTimes.offlineSlowHashingXPerSecond.display || 'instant',
    offlineFastHash: result.crackTimes.offlineFastHashingXPerSecond.display || 'instant',
  };

  const patternsDetected = extractPatterns(result);

  return {
    score,
    scoreLabel,
    scorePercentage,
    guesses: result.guesses,
    guessesLog10: Math.round(result.guessesLog10 * 100) / 100,
    crackDifficultyBits,
    crackTimes,
    feedback: {
      warning: result.feedback.warning || null,
      suggestions: result.feedback.suggestions || [],
    },
    patternsDetected,
    composition,
    calculationTimeMs: result.calcTime || 0,
  };
}

/**
 * Creates a sanitized analysis record suitable for memory/audit history.
 * Under no circumstances does this function retain the plaintext password.
 */
export function createSanitizedAnalysisRecord(
  result: PasswordAnalysisResult
): SanitizedAnalysisRecord {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ana-${Date.now()}`,
    timestamp: new Date().toISOString(),
    passwordLength: result.composition.length,
    entropyBits: result.crackDifficultyBits,
    score: result.score,
    hasLowercase: result.composition.hasLowercase,
    hasUppercase: result.composition.hasUppercase,
    hasNumbers: result.composition.hasNumbers,
    hasSymbols: result.composition.hasSymbols,
    crackTimeDisplay: result.crackTimes.offlineSlowHash,
    strengthLabel: result.scoreLabel,
    warning: result.feedback.warning,
  };
}
