import type { EntropyAnalysisResult } from './types.js';

export const LOWERCASE_POOL = 26;
export const UPPERCASE_POOL = 26;
export const NUMBERS_POOL = 10;
export const SYMBOLS_POOL = 33; // Standard printable ASCII symbols

/**
 * Computes theoretical keyspace entropy based on:
 * H = L × log2(R)
 *
 * Where:
 * - H: Theoretical entropy in bits
 * - L: Password length
 * - R: Detected character pool size
 *
 * IMPORTANT SECURITY CAVEAT:
 * This model assumes each character was chosen independently and uniformly at random (i.i.d.).
 * It does NOT reflect human password selection biases, dictionary words, or keyboard patterns.
 */
export function analyzeEntropy(password: string): EntropyAnalysisResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const length = password ? password.length : 0;

  if (length === 0) {
    return {
      theoreticalEntropyBits: 0,
      length: 0,
      poolSize: 0,
      detectedCategories: {
        hasLowercase: false,
        lowercaseCount: 0,
        hasUppercase: false,
        uppercaseCount: 0,
        hasNumbers: false,
        numbersCount: 0,
        hasSymbols: false,
        symbolsCount: 0,
      },
      categoryBreakdown: [],
      rating: 'Very Low',
      ratingColor: 'text-status-danger',
      keyspaceLog10: 0,
      assumptionsText:
        'Theoretical entropy H = L × log2(R) assumes strictly uniform, independent random selection from the character pool.',
      cautions: [
        'Enter a password to evaluate its theoretical keyspace entropy.',
      ],
      calculationTimeMs: 0,
    };
  }

  const lowercaseMatches = password.match(/[a-z]/g);
  const uppercaseMatches = password.match(/[A-Z]/g);
  const numberMatches = password.match(/[0-9]/g);
  const symbolMatches = password.match(/[^a-zA-Z0-9]/g);

  const lowercaseCount = lowercaseMatches ? lowercaseMatches.length : 0;
  const uppercaseCount = uppercaseMatches ? uppercaseMatches.length : 0;
  const numbersCount = numberMatches ? numberMatches.length : 0;
  const symbolsCount = symbolMatches ? symbolMatches.length : 0;

  let poolSize = 0;
  const categoryBreakdown: string[] = [];

  if (lowercaseCount > 0) {
    poolSize += LOWERCASE_POOL;
    categoryBreakdown.push(`Lowercase a-z (26 chars, ${lowercaseCount} used)`);
  }
  if (uppercaseCount > 0) {
    poolSize += UPPERCASE_POOL;
    categoryBreakdown.push(`Uppercase A-Z (26 chars, ${uppercaseCount} used)`);
  }
  if (numbersCount > 0) {
    poolSize += NUMBERS_POOL;
    categoryBreakdown.push(`Numbers 0-9 (10 chars, ${numbersCount} used)`);
  }
  if (symbolsCount > 0) {
    poolSize += SYMBOLS_POOL;
    categoryBreakdown.push(`Symbols & punctuation (33 chars, ${symbolsCount} used)`);
  }

  // Calculate H = L * log2(R)
  const theoreticalEntropyBits =
    poolSize > 0 ? Math.round(length * Math.log2(poolSize) * 10) / 10 : 0;

  // Log10 of keyspace: log10(R^L) = L * log10(R)
  const keyspaceLog10 =
    poolSize > 0 ? Math.round(length * Math.log10(poolSize) * 100) / 100 : 0;

  // Assign rating based on theoretical entropy bits
  let rating: EntropyAnalysisResult['rating'] = 'Very Low';
  let ratingColor = 'text-status-danger';

  if (theoreticalEntropyBits >= 80) {
    rating = 'Very Strong';
    ratingColor = 'text-status-success';
  } else if (theoreticalEntropyBits >= 60) {
    rating = 'Strong';
    ratingColor = 'text-status-success';
  } else if (theoreticalEntropyBits >= 36) {
    rating = 'Moderate';
    ratingColor = 'text-status-warning';
  } else if (theoreticalEntropyBits >= 28) {
    rating = 'Low';
    ratingColor = 'text-status-danger';
  }

  const cautions: string[] = [
    'Uniform Selection Assumption: This calculation strictly assumes every character was chosen by a cryptographically secure random number generator with equal probability.',
  ];

  if (categoryBreakdown.length >= 3 && length < 10) {
    cautions.push(
      'Short Length Risk: Although diverse character sets are present, the short length limits total possible permutations against modern GPU clusters.'
    );
  }

  if (theoreticalEntropyBits > 60) {
    cautions.push(
      'Human Predictability Caveat: If this password contains dictionary words, name sequences, or personal dates, its actual attack resistance will be orders of magnitude lower than this theoretical upper bound.'
    );
  }

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const calculationTimeMs = Math.round((endTime - startTime) * 100) / 100;

  return {
    theoreticalEntropyBits,
    length,
    poolSize,
    detectedCategories: {
      hasLowercase: lowercaseCount > 0,
      lowercaseCount,
      hasUppercase: uppercaseCount > 0,
      uppercaseCount,
      hasNumbers: numbersCount > 0,
      numbersCount,
      hasSymbols: symbolsCount > 0,
      symbolsCount,
    },
    categoryBreakdown,
    rating,
    ratingColor,
    keyspaceLog10,
    assumptionsText:
      'H = L × log2(R) measures the size of the theoretical search space. It provides an upper bound assuming uniformly random generation.',
    cautions,
    calculationTimeMs,
  };
}
