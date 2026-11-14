import type {
  GeneratorOptions,
  GeneratorResult,
  GeneratorValidationResult,
} from '@/types';

/**
 * Character Set Constants for Password Generation
 * Standard printable ASCII character classes.
 */
export const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz'; // 26 chars
export const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // 26 chars
export const NUMBER_CHARS = '0123456789';                     // 10 chars
// 32 standard printable ASCII symbols (excluding space and control characters)
export const SYMBOL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~"\'\\`'; // 32 chars

export const MIN_GENERATOR_LENGTH = 8;
export const MAX_GENERATOR_LENGTH = 64;
export const DEFAULT_GENERATOR_LENGTH = 16;

/**
 * Default generator configuration options.
 */
export const DEFAULT_GENERATOR_OPTIONS: GeneratorOptions = {
  length: DEFAULT_GENERATOR_LENGTH,
  includeLowercase: true,
  includeUppercase: true,
  includeNumbers: true,
  includeSymbols: true,
};

/**
 * Custom error thrown when the Web Crypto API is unavailable.
 * Never silently fall back to Math.random().
 */
export class WebCryptoUnavailableError extends Error {
  constructor(
    message = 'Web Crypto API (crypto.getRandomValues) is not available in this environment. CredLock prohibits insecure pseudo-random fallback.'
  ) {
    super(message);
    this.name = 'WebCryptoUnavailableError';
  }
}

/**
 * Verifies whether the Web Crypto API (crypto.getRandomValues) is present.
 */
export function isWebCryptoAvailable(): boolean {
  try {
    const cryptoObj =
      typeof globalThis !== 'undefined' && 'crypto' in globalThis
        ? globalThis.crypto
        : undefined;

    return (
      typeof cryptoObj !== 'undefined' &&
      typeof cryptoObj.getRandomValues === 'function'
    );
  } catch {
    return false;
  }
}

/**
 * Generates an unbiased cryptographically secure random integer in the range [0, max - 1].
 *
 * Implements rejection sampling over 32-bit unsigned integers to eliminate modulo bias.
 * Standard `rand % max` introduces bias unless 2^32 is an exact multiple of max.
 *
 * @param max The exclusive upper bound (must be an integer > 0 and <= 2^32).
 * @returns A cryptographically uniform integer in [0, max - 1].
 * @throws WebCryptoUnavailableError if crypto.getRandomValues is missing.
 */
export function getSecureRandomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0) {
    throw new RangeError(`Upper bound 'max' must be a positive integer. Received: ${max}`);
  }

  if (max === 1) {
    return 0;
  }

  if (!isWebCryptoAvailable()) {
    throw new WebCryptoUnavailableError();
  }

  const cryptoObj = globalThis.crypto;
  const maxUint32 = 0x100000000; // 2^32 = 4294967296
  // Largest multiple of 'max' less than or equal to 2^32
  const limit = maxUint32 - (maxUint32 % max);
  const buffer = new Uint32Array(1);

  // Rejection sampling loop
  let randomValue: number;
  do {
    cryptoObj.getRandomValues(buffer);
    randomValue = buffer[0]!;
  } while (randomValue >= limit);

  return randomValue % max;
}

/**
 * Performs an unbiased Fisher-Yates (Knuth) shuffle on an array using CSPRNG.
 * Every permutation of array elements has equal probability 1 / (N!).
 *
 * @param array The array to shuffle.
 * @returns A new shuffled array.
 */
export function secureShuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    const temp = result[i]!;
    result[i] = result[j]!;
    result[j] = temp;
  }
  return result;
}

/**
 * Validates password generator configuration options.
 */
export function validateGeneratorOptions(
  options: GeneratorOptions
): GeneratorValidationResult {
  if (
    !Number.isInteger(options.length) ||
    options.length < MIN_GENERATOR_LENGTH ||
    options.length > MAX_GENERATOR_LENGTH
  ) {
    return {
      isValid: false,
      error: `Password length must be an integer between ${MIN_GENERATOR_LENGTH} and ${MAX_GENERATOR_LENGTH} characters.`,
    };
  }

  const selectedCount =
    (options.includeLowercase ? 1 : 0) +
    (options.includeUppercase ? 1 : 0) +
    (options.includeNumbers ? 1 : 0) +
    (options.includeSymbols ? 1 : 0);

  if (selectedCount === 0) {
    return {
      isValid: false,
      error: 'At least one character category (lowercase, uppercase, numbers, or symbols) must be selected.',
    };
  }

  if (options.length < selectedCount) {
    return {
      isValid: false,
      error: `Password length (${options.length}) cannot be smaller than the number of selected categories (${selectedCount}).`,
    };
  }

  return { isValid: true };
}

/**
 * Calculates the theoretical character pool size based on selected categories.
 */
export function calculatePoolSize(options: GeneratorOptions): number {
  let size = 0;
  if (options.includeLowercase) size += LOWERCASE_CHARS.length;
  if (options.includeUppercase) size += UPPERCASE_CHARS.length;
  if (options.includeNumbers) size += NUMBER_CHARS.length;
  if (options.includeSymbols) size += SYMBOL_CHARS.length;
  return size;
}

/**
 * Calculates theoretical character-pool entropy in bits:
 * Entropy = Length * log2(PoolSize)
 */
export function calculateTheoreticalEntropy(
  length: number,
  poolSize: number
): number {
  if (length <= 0 || poolSize <= 0) return 0;
  const entropy = length * Math.log2(poolSize);
  return Math.round(entropy * 10) / 10;
}

/**
 * Generates a cryptographically secure random password.
 *
 * Guarantees:
 * 1. Uses crypto.getRandomValues() with rejection sampling (zero modulo bias).
 * 2. Guaranteed category coverage: includes at least 1 character from every active category.
 * 3. Remaining positions filled uniformly from combined active character pool.
 * 4. Positions randomized with unbiased CSPRNG Fisher-Yates shuffle.
 * 5. Exactly matches requested length.
 * 6. Generates strictly in client memory; zero persistent storage, telemetry, or network exposure.
 *
 * @param options Generator configuration.
 * @returns GeneratorResult containing the password and cryptographic metadata.
 */
export function generatePassword(
  options: GeneratorOptions = DEFAULT_GENERATOR_OPTIONS
): GeneratorResult {
  if (!isWebCryptoAvailable()) {
    throw new WebCryptoUnavailableError();
  }

  const validation = validateGeneratorOptions(options);
  if (!validation.isValid) {
    throw new Error(validation.error ?? 'Invalid generator configuration.');
  }

  // Identify active categories
  const activeCategories: { name: string; chars: string }[] = [];
  if (options.includeLowercase) {
    activeCategories.push({ name: 'lowercase', chars: LOWERCASE_CHARS });
  }
  if (options.includeUppercase) {
    activeCategories.push({ name: 'uppercase', chars: UPPERCASE_CHARS });
  }
  if (options.includeNumbers) {
    activeCategories.push({ name: 'numbers', chars: NUMBER_CHARS });
  }
  if (options.includeSymbols) {
    activeCategories.push({ name: 'symbols', chars: SYMBOL_CHARS });
  }

  // Build combined pool of all selected categories
  const combinedPool = activeCategories.map((c) => c.chars).join('');
  const chars: string[] = [];

  // Step 1: Guaranteed coverage — pick at least 1 character from each selected category
  for (const category of activeCategories) {
    const charIndex = getSecureRandomInt(category.chars.length);
    chars.push(category.chars[charIndex]!);
  }

  // Step 2: Fill remaining positions uniformly from the combined pool
  const remainingCount = options.length - chars.length;
  for (let i = 0; i < remainingCount; i++) {
    const charIndex = getSecureRandomInt(combinedPool.length);
    chars.push(combinedPool[charIndex]!);
  }

  // Step 3: Unbiased Fisher-Yates shuffle to randomize character order
  const shuffledChars = secureShuffle(chars);
  const password = shuffledChars.join('');

  // Character breakdown counts
  const characterCounts = {
    lowercase: 0,
    uppercase: 0,
    numbers: 0,
    symbols: 0,
  };

  for (const char of password) {
    if (LOWERCASE_CHARS.includes(char)) characterCounts.lowercase++;
    else if (UPPERCASE_CHARS.includes(char)) characterCounts.uppercase++;
    else if (NUMBER_CHARS.includes(char)) characterCounts.numbers++;
    else if (SYMBOL_CHARS.includes(char)) characterCounts.symbols++;
  }

  const poolSize = calculatePoolSize(options);
  const theoreticalEntropyBits = calculateTheoreticalEntropy(options.length, poolSize);

  return {
    password,
    length: password.length,
    theoreticalEntropyBits,
    poolSize,
    options: { ...options },
    characterCounts,
  };
}
