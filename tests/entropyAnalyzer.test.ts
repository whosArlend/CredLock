import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeEntropy } from '../src/services/analyzer/entropyAnalyzer.ts';

describe('analyzeEntropy', () => {
  it('handles empty input gracefully', () => {
    const res = analyzeEntropy('');
    assert.strictEqual(res.theoreticalEntropyBits, 0);
    assert.strictEqual(res.poolSize, 0);
    assert.strictEqual(res.rating, 'Very Low');
    assert.strictEqual(res.detectedCategories.hasLowercase, false);
  });

  it('calculates single lowercase character entropy (L=1, R=26)', () => {
    const res = analyzeEntropy('a');
    assert.strictEqual(res.length, 1);
    assert.strictEqual(res.poolSize, 26);
    assert.strictEqual(res.detectedCategories.hasLowercase, true);
    assert.strictEqual(res.detectedCategories.hasUppercase, false);
    // H = 1 * log2(26) ≈ 4.7004
    assert.ok(Math.abs(res.theoreticalEntropyBits - 4.7) < 0.1);
  });

  it('accurately computes entropy across all 4 standard categories (L=12, R=95)', () => {
    // lowercase (26) + uppercase (26) + digits (10) + symbols (33) = 95
    const res = analyzeEntropy('Password123!');
    assert.strictEqual(res.length, 12);
    assert.strictEqual(res.poolSize, 95);
    assert.strictEqual(res.detectedCategories.hasLowercase, true);
    assert.strictEqual(res.detectedCategories.hasUppercase, true);
    assert.strictEqual(res.detectedCategories.hasNumbers, true);
    assert.strictEqual(res.detectedCategories.hasSymbols, true);
    // log2(95) ≈ 6.5698556; 12 * 6.5698556 ≈ 78.84
    assert.ok(Math.abs(res.theoreticalEntropyBits - 78.84) < 0.1);
    assert.strictEqual(res.rating, 'Strong');
  });

  it('correctly categorizes lowercase + numbers (R=36)', () => {
    const res = analyzeEntropy('abc123');
    assert.strictEqual(res.length, 6);
    assert.strictEqual(res.poolSize, 36);
    // log2(36) ≈ 5.1699; 6 * 5.1699 ≈ 31.02
    assert.ok(Math.abs(res.theoreticalEntropyBits - 31.02) < 0.1);
    assert.strictEqual(res.rating, 'Low');
  });

  it('correctly handles rating boundaries', () => {
    // Very Low: < 28
    assert.strictEqual(analyzeEntropy('abc').rating, 'Very Low');
    // Low: 28 - 35.9
    assert.strictEqual(analyzeEntropy('abcdefg').rating, 'Low');
    // Moderate: 36 - 59.9
    assert.strictEqual(analyzeEntropy('abcdefghij').rating, 'Moderate');
    // Strong: 60 - 79.9
    assert.strictEqual(analyzeEntropy('abcdefghijklmnop').rating, 'Strong');
    // Very Strong: >= 80
    assert.strictEqual(analyzeEntropy('abcdefghijklmnopqrst').rating, 'Very Strong');
  });

  it('never outputs NaN or Infinity on normal strings', () => {
    const longString = 'a'.repeat(256);
    const res = analyzeEntropy(longString);
    assert.ok(Number.isFinite(res.theoreticalEntropyBits));
    assert.ok(!Number.isNaN(res.theoreticalEntropyBits));
  });
});
