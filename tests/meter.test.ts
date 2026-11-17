import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Unit tests for Meter calculation and range mapping logic.
 */
describe('Stage 2 — Base UI Component Logic (Meter)', () => {
  it('correctly clamps values within min and max bounds', () => {
    const clamp = (val: number, min: number, max: number) =>
      Math.min(Math.max(val, min), max);

    assert.strictEqual(clamp(50, 0, 100), 50);
    assert.strictEqual(clamp(-10, 0, 100), 0);
    assert.strictEqual(clamp(150, 0, 100), 100);
    assert.strictEqual(clamp(3, 0, 4), 3);
    assert.strictEqual(clamp(5, 0, 4), 4);
  });

  it('correctly computes continuous percentage across arbitrary ranges', () => {
    const calcPercentage = (val: number, min: number, max: number) => {
      const clamped = Math.min(Math.max(val, min), max);
      const range = max - min;
      return range > 0 ? Math.round(((clamped - min) / range) * 100) : 0;
    };

    assert.strictEqual(calcPercentage(0, 0, 100), 0);
    assert.strictEqual(calcPercentage(50, 0, 100), 50);
    assert.strictEqual(calcPercentage(100, 0, 100), 100);
    assert.strictEqual(calcPercentage(2, 0, 4), 50);
    assert.strictEqual(calcPercentage(3, 0, 4), 75);
    assert.strictEqual(calcPercentage(4, 0, 4), 100);
  });

  it('correctly calculates segment thresholds for calibrated hardware meters', () => {
    const segments = 4;
    const min = 0;
    const max = 4;
    const range = max - min;

    // Segment thresholds should be 1, 2, 3, 4
    const thresholds = Array.from({ length: segments }).map(
      (_, index) => min + (range * (index + 1)) / segments
    );

    assert.deepStrictEqual(thresholds, [1, 2, 3, 4]);

    // Check which segments are active for score = 2
    const score = 2;
    const activeSegments = Array.from({ length: segments }).map((_, index) => {
      const segmentStart = min + (range * index) / segments;
      return score > segmentStart;
    });

    // Score 2: segment 0 (0-1) is active, segment 1 (1-2) is active, segments 2 & 3 inactive
    assert.deepStrictEqual(activeSegments, [true, true, false, false]);
  });
});
