import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isItemActive, NAV_ITEMS } from '../src/components/layout/navUtils.ts';

describe('Phase UI-1 — Global Layout & Navigation Test Suite', () => {
  describe('1. Navigation Destinations & Desktop Labels', () => {
    it('preserves all 5 canonical security navigation destinations with backward-compatible names', () => {
      assert.strictEqual(NAV_ITEMS.length, 5);
      const names = NAV_ITEMS.map((item) => item.name);
      assert.deepStrictEqual(names, ['Home', 'Analyze', 'Generate', 'Breach', 'About']);
    });

    it('provides polished desktop navigation labels', () => {
      const desktopNames = NAV_ITEMS.map((item) => item.desktopName ?? item.name);
      assert.deepStrictEqual(desktopNames, ['Home', 'Analyzer', 'Generator', 'Breach Checker', 'About']);
    });

    it('ensures each destination has a valid internal route path', () => {
      NAV_ITEMS.forEach((item) => {
        assert.ok(item.to.startsWith('/'), `Path ${item.to} must start with /`);
        assert.ok(item.icon !== undefined, `Icon must be defined for ${item.name}`);
      });
    });
  });

  describe('2. Active Route Matching Logic for Desktop & Mobile', () => {
    it('matches root route precisely and isolates it from subpaths', () => {
      assert.strictEqual(isItemActive('/', '/'), true);
      assert.strictEqual(isItemActive('/', '/analyzer'), false);
      assert.strictEqual(isItemActive('/', '/generator'), false);
      assert.strictEqual(isItemActive('/', '/breach-checker'), false);
      assert.strictEqual(isItemActive('/', '/profile'), false);
    });

    it('matches analyzer and historical sub-routes', () => {
      assert.strictEqual(isItemActive('/analyzer', '/analyzer'), true);
      assert.strictEqual(isItemActive('/analyzer', '/analysis-history'), true);
      assert.strictEqual(isItemActive('/analyzer', '/analysis-history/any-uuid-123'), true);
      assert.strictEqual(isItemActive('/analyzer', '/generator'), false);
    });

    it('matches breach checker and historical sub-routes', () => {
      assert.strictEqual(isItemActive('/breach-checker', '/breach-checker'), true);
      assert.strictEqual(isItemActive('/breach-checker', '/breach-history'), true);
      assert.strictEqual(isItemActive('/breach-checker', '/breach-history/any-uuid-456'), true);
      assert.strictEqual(isItemActive('/breach-checker', '/analyzer'), false);
    });

    it('matches generator and profile routes', () => {
      assert.strictEqual(isItemActive('/generator', '/generator'), true);
      assert.strictEqual(isItemActive('/profile', '/profile'), true);
      assert.strictEqual(isItemActive('/profile', '/analyzer'), false);
    });
  });

  describe('3. Semantic Container Size System', () => {
    const SIZES: Record<string, string> = {
      compact: 'max-w-3xl',
      editorial: 'max-w-4xl',
      default: 'max-w-5xl',
      wide: 'max-w-7xl',
      sm: 'max-w-xl',
      md: 'max-w-3xl',
      lg: 'max-w-5xl',
      xl: 'max-w-7xl',
      full: 'max-w-full',
    };

    it('defines expected max-width classes for new semantic sizes', () => {
      assert.strictEqual(SIZES.compact, 'max-w-3xl');
      assert.strictEqual(SIZES.editorial, 'max-w-4xl');
      assert.strictEqual(SIZES.default, 'max-w-5xl');
      assert.strictEqual(SIZES.wide, 'max-w-7xl');
    });

    it('preserves legacy sizing aliases for 100% backward compatibility', () => {
      assert.strictEqual(SIZES.sm, 'max-w-xl');
      assert.strictEqual(SIZES.md, 'max-w-3xl');
      assert.strictEqual(SIZES.lg, 'max-w-5xl');
      assert.strictEqual(SIZES.xl, 'max-w-7xl');
      assert.strictEqual(SIZES.full, 'max-w-full');
    });
  });
});
