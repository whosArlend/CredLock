import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generatePassword,
  getSecureRandomInt,
  secureShuffle,
  validateGeneratorOptions,
  calculatePoolSize,
  calculateTheoreticalEntropy,
  isWebCryptoAvailable,
  WebCryptoUnavailableError,
  LOWERCASE_CHARS,
  UPPERCASE_CHARS,
  NUMBER_CHARS,
  SYMBOL_CHARS,
  MIN_GENERATOR_LENGTH,
  MAX_GENERATOR_LENGTH,
  DEFAULT_GENERATOR_OPTIONS,
} from '../src/services/passwordGenerator.ts';

describe('Phase 2.4 — Secure Password Generator Test Suite', () => {
  // Test 1: Cryptographically Secure Random Number Generation Availability
  it('1. Web Crypto API is available and detected', () => {
    assert.strictEqual(isWebCryptoAvailable(), true);
    assert.strictEqual(typeof globalThis.crypto.getRandomValues, 'function');
  });

  // Test 2: Rejection Sampling & Unbiased Index Selection
  describe('2. Rejection Sampling (getSecureRandomInt)', () => {
    it('returns 0 when max is 1', () => {
      assert.strictEqual(getSecureRandomInt(1), 0);
    });

    it('rejects non-positive and non-integer bounds', () => {
      assert.throws(() => getSecureRandomInt(0), RangeError);
      assert.throws(() => getSecureRandomInt(-5), RangeError);
      assert.throws(() => getSecureRandomInt(3.14), RangeError);
    });

    it('consistently produces integers in valid bounds [0, max - 1]', () => {
      const bounds = [2, 10, 26, 32, 62, 94];
      for (const max of bounds) {
        for (let i = 0; i < 100; i++) {
          const val = getSecureRandomInt(max);
          assert.ok(
            val >= 0 && val < max,
            `Expected ${val} to be in [0, ${max - 1}]`
          );
        }
      }
    });

    it('secureShuffle produces a permutation containing all original elements', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const shuffled = secureShuffle(original);

      assert.strictEqual(shuffled.length, original.length);
      // Verify elements remain identical as a set
      assert.deepStrictEqual([...shuffled].sort((a, b) => a - b), original);
    });
  });

  // Test 3: Correct Password Length
  describe('3. Password Length Accuracy', () => {
    it('produces passwords matching requested lengths exactly', () => {
      const lengths = [8, 12, 16, 20, 24, 32, 48, 64];
      for (const len of lengths) {
        const result = generatePassword({
          ...DEFAULT_GENERATOR_OPTIONS,
          length: len,
        });
        assert.strictEqual(result.password.length, len);
        assert.strictEqual(result.length, len);
      }
    });
  });

  // Test 4: Guaranteed Inclusion of Every Selected Category
  describe('4. Guaranteed Category Coverage', () => {
    it('guarantees at least 1 character from every active category', () => {
      // Run multiple trials to ensure invariant is guaranteed
      for (let trial = 0; trial < 50; trial++) {
        const result = generatePassword({
          length: 16,
          includeLowercase: true,
          includeUppercase: true,
          includeNumbers: true,
          includeSymbols: true,
        });

        assert.ok(
          result.characterCounts.lowercase >= 1,
          'Expected at least 1 lowercase character'
        );
        assert.ok(
          result.characterCounts.uppercase >= 1,
          'Expected at least 1 uppercase character'
        );
        assert.ok(
          result.characterCounts.numbers >= 1,
          'Expected at least 1 number character'
        );
        assert.ok(
          result.characterCounts.symbols >= 1,
          'Expected at least 1 symbol character'
        );
      }
    });

    it('works with minimum length (8) and all 4 categories', () => {
      for (let trial = 0; trial < 20; trial++) {
        const result = generatePassword({
          length: 8,
          includeLowercase: true,
          includeUppercase: true,
          includeNumbers: true,
          includeSymbols: true,
        });

        assert.strictEqual(result.password.length, 8);
        assert.ok(result.characterCounts.lowercase >= 1);
        assert.ok(result.characterCounts.uppercase >= 1);
        assert.ok(result.characterCounts.numbers >= 1);
        assert.ok(result.characterCounts.symbols >= 1);
      }
    });
  });

  // Test 5: Strict Exclusion of Unselected Categories
  describe('5. Strict Exclusion of Unselected Categories', () => {
    it('excludes uppercase and symbols when only lowercase and numbers are selected', () => {
      for (let trial = 0; trial < 30; trial++) {
        const result = generatePassword({
          length: 20,
          includeLowercase: true,
          includeUppercase: false,
          includeNumbers: true,
          includeSymbols: false,
        });

        assert.strictEqual(result.characterCounts.uppercase, 0);
        assert.strictEqual(result.characterCounts.symbols, 0);
        assert.ok(result.characterCounts.lowercase > 0);
        assert.ok(result.characterCounts.numbers > 0);

        // Character-by-character verification
        for (const char of result.password) {
          assert.ok(
            LOWERCASE_CHARS.includes(char) || NUMBER_CHARS.includes(char),
            `Unexpected character '${char}' found in output`
          );
        }
      }
    });

    it('only contains symbols when only symbols are selected', () => {
      const result = generatePassword({
        length: 16,
        includeLowercase: false,
        includeUppercase: false,
        includeNumbers: false,
        includeSymbols: true,
      });

      assert.strictEqual(result.characterCounts.lowercase, 0);
      assert.strictEqual(result.characterCounts.uppercase, 0);
      assert.strictEqual(result.characterCounts.numbers, 0);
      assert.strictEqual(result.characterCounts.symbols, 16);

      for (const char of result.password) {
        assert.ok(
          SYMBOL_CHARS.includes(char),
          `Character '${char}' must be in SYMBOL_CHARS`
        );
      }
    });

    it('only contains uppercase when only uppercase is selected', () => {
      const result = generatePassword({
        length: 16,
        includeLowercase: false,
        includeUppercase: true,
        includeNumbers: false,
        includeSymbols: false,
      });

      assert.strictEqual(result.characterCounts.lowercase, 0);
      assert.strictEqual(result.characterCounts.uppercase, 16);
      assert.strictEqual(result.characterCounts.numbers, 0);
      assert.strictEqual(result.characterCounts.symbols, 0);

      for (const char of result.password) {
        assert.ok(
          UPPERCASE_CHARS.includes(char),
          `Character '${char}' must be in UPPERCASE_CHARS`
        );
      }
    });
  });

  // Test 6: Empty Category Selection Validation
  describe('6. Empty Category Selection Validation', () => {
    it('rejects configurations with zero selected categories', () => {
      const emptyOptions = {
        length: 16,
        includeLowercase: false,
        includeUppercase: false,
        includeNumbers: false,
        includeSymbols: false,
      };

      const validation = validateGeneratorOptions(emptyOptions);
      assert.strictEqual(validation.isValid, false);
      assert.ok(
        validation.error?.includes('At least one character category'),
        'Expected error message for zero selected categories'
      );

      assert.throws(() => generatePassword(emptyOptions), /At least one character category/);
    });
  });

  // Test 7: Minimum and Maximum Length Validation
  describe('7. Length Bounds Validation', () => {
    it('rejects lengths below minimum (8)', () => {
      const invalidShort = {
        ...DEFAULT_GENERATOR_OPTIONS,
        length: 7,
      };
      const validation = validateGeneratorOptions(invalidShort);
      assert.strictEqual(validation.isValid, false);
      assert.throws(() => generatePassword(invalidShort));
    });

    it('rejects lengths above maximum (64)', () => {
      const invalidLong = {
        ...DEFAULT_GENERATOR_OPTIONS,
        length: 65,
      };
      const validation = validateGeneratorOptions(invalidLong);
      assert.strictEqual(validation.isValid, false);
      assert.throws(() => generatePassword(invalidLong));
    });

    it('rejects non-integer lengths', () => {
      const invalidFloat = {
        ...DEFAULT_GENERATOR_OPTIONS,
        length: 16.5,
      };
      const validation = validateGeneratorOptions(invalidFloat);
      assert.strictEqual(validation.isValid, false);
      assert.throws(() => generatePassword(invalidFloat));
    });

    it('accepts boundary lengths 8 and 64', () => {
      assert.strictEqual(
        validateGeneratorOptions({ ...DEFAULT_GENERATOR_OPTIONS, length: MIN_GENERATOR_LENGTH }).isValid,
        true
      );
      assert.strictEqual(
        validateGeneratorOptions({ ...DEFAULT_GENERATOR_OPTIONS, length: MAX_GENERATOR_LENGTH }).isValid,
        true
      );
    });
  });

  // Test 8: Length Smaller Than Selected Categories
  describe('8. Length vs Selected Categories Validation', () => {
    it('rejects configurations where length is smaller than number of active categories', () => {
      // 4 categories selected, but length = 3
      const invalidConfig = {
        length: 3,
        includeLowercase: true,
        includeUppercase: true,
        includeNumbers: true,
        includeSymbols: true,
      };

      const validation = validateGeneratorOptions(invalidConfig);
      assert.strictEqual(validation.isValid, false);
      assert.throws(() => generatePassword(invalidConfig));
    });
  });

  // Test 9: Web Crypto Unavailable Handling (Zero Math.random fallback)
  describe('9. Web Crypto Unavailable Handling', () => {
    it('throws WebCryptoUnavailableError if crypto.getRandomValues is missing', () => {
      const originalCrypto = globalThis.crypto;
      try {
        // Temporarily stub crypto to simulate unsupported environment
        Object.defineProperty(globalThis, 'crypto', {
          value: { getRandomValues: undefined },
          configurable: true,
        });

        assert.strictEqual(isWebCryptoAvailable(), false);
        assert.throws(
          () => getSecureRandomInt(10),
          (err) => err instanceof WebCryptoUnavailableError
        );
        assert.throws(
          () => generatePassword(DEFAULT_GENERATOR_OPTIONS),
          (err) => err instanceof WebCryptoUnavailableError
        );
      } finally {
        // Restore original crypto
        Object.defineProperty(globalThis, 'crypto', {
          value: originalCrypto,
          configurable: true,
        });
      }
    });
  });

  // Test 10: Regenerate Behavior and State Freshness
  describe('10. Regenerate Behavior & Theoretical Calculations', () => {
    it('consecutive generations produce distinct passwords', () => {
      const res1 = generatePassword(DEFAULT_GENERATOR_OPTIONS);
      const res2 = generatePassword(DEFAULT_GENERATOR_OPTIONS);
      const res3 = generatePassword(DEFAULT_GENERATOR_OPTIONS);

      assert.notStrictEqual(res1.password, res2.password);
      assert.notStrictEqual(res2.password, res3.password);
      assert.notStrictEqual(res1.password, res3.password);
    });

    it('accurately calculates theoretical character pool size and entropy bits', () => {
      // All 4 categories: 26 + 26 + 10 + 32 = 94 chars
      const pool94 = calculatePoolSize(DEFAULT_GENERATOR_OPTIONS);
      assert.strictEqual(pool94, 94);

      // Entropy for length 16: 16 * log2(94) = 16 * 6.55458886 = ~104.9 bits
      const entropy16 = calculateTheoreticalEntropy(16, pool94);
      assert.strictEqual(entropy16, 104.9);

      // Only numbers: 10 chars
      const poolNumbers = calculatePoolSize({
        length: 8,
        includeLowercase: false,
        includeUppercase: false,
        includeNumbers: true,
        includeSymbols: false,
      });
      assert.strictEqual(poolNumbers, 10);
      // 8 * log2(10) = 8 * 3.3219 = ~26.6 bits
      const entropyNumbers = calculateTheoreticalEntropy(8, poolNumbers);
      assert.strictEqual(entropyNumbers, 26.6);
    });
  });
});
