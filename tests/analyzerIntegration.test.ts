import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzePassword,
  createSanitizedAnalysisRecord,
  compareAllMethods,
  analyzeEntropy,
  analyzeMarkov,
  initZxcvbn,
} from '../src/services/passwordAnalyzer.ts';

describe('Analyzer Integration & Multi-Method Synthesis', () => {
  it('preserves existing Zxcvbn baseline output structure and scoring', () => {
    const res = analyzePassword('CorrectHorseBatteryStaple!');
    assert.ok(res.score >= 3);
    assert.ok(res.feedback !== undefined);
    assert.ok(res.crackTimes !== undefined);
    assert.ok(res.crackTimes.offlineSlowHash !== undefined);
    assert.ok(res.patternsDetected !== undefined);
  });

  it('accurately detects divergence between Zxcvbn and Keyspace Entropy for "Password123!"', async () => {
    await initZxcvbn();
    const zxcvbnRes = analyzePassword('Password123!');
    const entropyRes = analyzeEntropy('Password123!');
    const comparison = compareAllMethods('Password123!');

    // Zxcvbn detects common word & pattern -> score <= 1
    assert.ok(zxcvbnRes.score <= 1);

    // Entropy sees 4 categories (95 chars) -> ~78.8 bits -> 'Strong' rating
    assert.strictEqual(entropyRes.poolSize, 95);
    assert.strictEqual(entropyRes.rating, 'Strong');

    // Synthesis must detect divergence
    assert.strictEqual(comparison.divergenceLevel, 'High Divergence');
    assert.ok(comparison.discrepancyInsights.some(insight => insight.includes('Divergence')));
  });

  it('guarantees zero password or sequence leakage in createSanitizedAnalysisRecord', () => {
    const rawPassword = 'SuperSecretPlaintextPassword123!';
    const zxcvbnRes = analyzePassword(rawPassword);
    const entropyRes = analyzeEntropy(rawPassword);
    const markovRes = analyzeMarkov(rawPassword);

    const record = createSanitizedAnalysisRecord(zxcvbnRes, {
      method: 'markov',
      theoreticalEntropyBits: entropyRes.theoreticalEntropyBits,
      markovSurprisalBits: markovRes.averageSurprisalBits,
    });

    const serialized = JSON.stringify(record);

    // Plaintext or raw words must NOT exist in the record
    assert.ok(!serialized.includes(rawPassword));
    assert.ok(!serialized.includes('SuperSecret'));
    assert.ok(!serialized.includes('PlaintextPassword'));

    // Structural metrics are preserved
    assert.strictEqual(record.passwordLength, rawPassword.length);
    assert.strictEqual(record.score, zxcvbnRes.score);
    assert.strictEqual(record.analysisMethod, 'markov');
    assert.ok(Math.abs((record.theoreticalEntropyBits ?? 0) - entropyRes.theoreticalEntropyBits) < 0.1);
    assert.ok(Math.abs((record.markovSurprisalBits ?? 0) - markovRes.averageSurprisalBits) < 0.1);
  });

  it('maintains backwards compatibility when createSanitizedAnalysisRecord is called without metadata', () => {
    const res = analyzePassword('testpassword');
    const record = createSanitizedAnalysisRecord(res);

    assert.ok(record.id !== undefined);
    assert.ok(record.timestamp !== undefined);
    assert.strictEqual(record.passwordLength, 12);
    assert.strictEqual(record.analysisMethod, 'zxcvbn');
    assert.strictEqual(record.theoreticalEntropyBits, undefined);
    assert.strictEqual(record.markovSurprisalBits, undefined);
  });
});
