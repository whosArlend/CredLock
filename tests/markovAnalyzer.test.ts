import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeMarkov } from '../src/services/analyzer/markovAnalyzer.ts';
import type { MarkovModel } from '../src/services/analyzer/markovModel.ts';

describe('analyzeMarkov', () => {
  it('handles empty input gracefully', () => {
    const res = analyzeMarkov('');
    assert.strictEqual(res.totalSurprisalBits, 0);
    assert.strictEqual(res.averageSurprisalBits, 0);
    assert.strictEqual(res.perplexity, 1);
    assert.strictEqual(res.predictabilityScore, 0);
    assert.strictEqual(res.transitionsEvaluated, 0);
    assert.strictEqual(res.topPredictableTransitions.length, 0);
    assert.strictEqual(res.topUnusualTransitions.length, 0);
  });

  it('handles single-character input gracefully (0 transitions)', () => {
    const res = analyzeMarkov('a');
    assert.strictEqual(res.transitionsEvaluated, 0);
    assert.ok(res.totalSurprisalBits > 0);
    assert.ok(res.averageSurprisalBits > 0);
    assert.ok(res.perplexity >= 1);
  });

  it('evaluates multi-character input and calculates positive surprisal', () => {
    const res = analyzeMarkov('password');
    assert.strictEqual(res.transitionsEvaluated, 7);
    assert.ok(res.totalSurprisalBits > 0);
    assert.ok(res.averageSurprisalBits > 0);
    assert.ok(res.perplexity > 1);
    assert.ok(res.predictabilityScore >= 0);
    assert.ok(res.predictabilityScore <= 100);
  });

  it('detects common predictable patterns with lower surprisal and higher predictability index', () => {
    const seqRes = analyzeMarkov('123456');
    const randRes = analyzeMarkov('q~9^z');

    assert.ok(seqRes.averageSurprisalBits < randRes.averageSurprisalBits);
    assert.ok(seqRes.predictabilityScore > randRes.predictabilityScore);
  });

  it('falls back to Laplace smoothing floor on unseen transitions without NaN or Infinity', () => {
    const res = analyzeMarkov('æøå!§');
    assert.ok(Number.isFinite(res.totalSurprisalBits));
    assert.ok(!Number.isNaN(res.totalSurprisalBits));
    assert.ok(Number.isFinite(res.averageSurprisalBits));
    assert.strictEqual(res.transitionsEvaluated, 4);
    for (const t of res.topUnusualTransitions) {
      assert.ok(t.probability >= 1e-4);
      assert.ok(Number.isFinite(t.surprisalBits));
    }
  });

  it('produces deterministic output for the same input', () => {
    const res1 = analyzeMarkov('Secr3t!P@ss');
    const res2 = analyzeMarkov('Secr3t!P@ss');
    assert.strictEqual(res1.totalSurprisalBits, res2.totalSurprisalBits);
    assert.strictEqual(res1.averageSurprisalBits, res2.averageSurprisalBits);
    assert.strictEqual(res1.predictabilityScore, res2.predictabilityScore);
    assert.strictEqual(res1.predictabilityLabel, res2.predictabilityLabel);
  });

  it('scales cleanly and fast on 100+ character strings', () => {
    const longPw = 'LongPasswordWithManyTransitionsAndSpecialCharacters!@#$%^1234567890abcdefghijklmnopqrstuvwxyz'.repeat(2);
    const start = performance.now();
    const res = analyzeMarkov(longPw);
    const duration = performance.now() - start;

    assert.strictEqual(res.transitionsEvaluated, longPw.length - 1);
    assert.ok(duration < 50);
  });

  it('supports swapping in a custom MarkovModel', () => {
    const customModel: MarkovModel = {
      id: 'test-custom-model',
      name: 'Test Custom Model',
      version: '1.0.0',
      description: 'Custom model for testing',
      isExperimental: true,
      smoothingEpsilon: 0.01,
      initialProbabilities: {
        'x': 0.5,
      },
      transitionProbabilities: {
        'x': { 'y': 0.9 },
      },
    };

    const res = analyzeMarkov('xy', customModel);
    assert.strictEqual(res.modelInfo.name, 'Test Custom Model');
    assert.strictEqual(res.topPredictableTransitions[0].probability, 0.9);
    // surprisal = -log2(0.9) ≈ 0.152
    assert.ok(Math.abs(res.topPredictableTransitions[0].surprisalBits - 0.152) < 0.05);
  });
});
