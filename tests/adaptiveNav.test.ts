import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isItemActive, NAV_ITEMS } from '../src/components/layout/navUtils.ts';

describe('Phase 2.7A.1 — Adaptive Capsule Navigation Test Suite', () => {
  describe('1. Active Route Matching Logic', () => {
    it('matches root route precisely', () => {
      assert.strictEqual(isItemActive('/', '/'), true);
      assert.strictEqual(isItemActive('/', '/analyzer'), false);
      assert.strictEqual(isItemActive('/', '/generator'), false);
    });

    it('matches analyzer and analysis history detail routes to Analyze destination', () => {
      assert.strictEqual(isItemActive('/analyzer', '/analyzer'), true);
      assert.strictEqual(isItemActive('/analyzer', '/analysis-history'), true);
      assert.strictEqual(isItemActive('/analyzer', '/analysis-history/rec-123'), true);
      assert.strictEqual(isItemActive('/analyzer', '/generator'), false);
    });

    it('matches breach checker and breach history detail routes to Breach destination', () => {
      assert.strictEqual(isItemActive('/breach-checker', '/breach-checker'), true);
      assert.strictEqual(isItemActive('/breach-checker', '/breach-history'), true);
      assert.strictEqual(isItemActive('/breach-checker', '/breach-history/rec-789'), true);
      assert.strictEqual(isItemActive('/breach-checker', '/analyzer'), false);
    });

    it('matches generator and profile routes', () => {
      assert.strictEqual(isItemActive('/generator', '/generator'), true);
      assert.strictEqual(isItemActive('/profile', '/profile'), true);
    });

    it('contains all 5 canonical security navigation destinations', () => {
      assert.strictEqual(NAV_ITEMS.length, 5);
      const names = NAV_ITEMS.map((item) => item.name);
      assert.deepStrictEqual(names, ['Home', 'Analyze', 'Generate', 'Breach', 'About']);
    });
  });

  describe('2. Scroll State Machine & Threshold Transitions', () => {
    // Model of the adaptive navigation scroll state machine
    class AdaptiveScrollNavStateMachine {
      public isExpanded: boolean;
      public lastScrollY: number;
      public readonly threshold: number;

      constructor(threshold = 28, initialExpanded = true) {
        this.threshold = threshold;
        this.isExpanded = initialExpanded;
        this.lastScrollY = 0;
      }

      public onScroll(currentScrollY: number) {
        // Invariant: Once compact, scrolling up or down NEVER auto-expands
        if (!this.isExpanded) {
          return;
        }

        const delta = Math.abs(currentScrollY - this.lastScrollY);
        if (delta >= this.threshold) {
          this.isExpanded = false;
          this.lastScrollY = currentScrollY;
        }
      }

      public expand(currentScrollY: number) {
        this.isExpanded = true;
        // Invariant: manual expansion re-anchors scroll position
        this.lastScrollY = currentScrollY;
      }

      public collapse(currentScrollY: number) {
        this.isExpanded = false;
        this.lastScrollY = currentScrollY;
      }

      public onNavigate(currentScrollY = 0) {
        // Invariant: route change always resets to expanded state
        this.isExpanded = true;
        this.lastScrollY = currentScrollY;
      }
    }

    it('initializes in expanded state', () => {
      const nav = new AdaptiveScrollNavStateMachine(28, true);
      assert.strictEqual(nav.isExpanded, true);
      assert.strictEqual(nav.lastScrollY, 0);
    });

    it('ignores small scroll movements below the threshold', () => {
      const nav = new AdaptiveScrollNavStateMachine(28, true);
      // Small 15px scroll jitter
      nav.onScroll(15);
      assert.strictEqual(nav.isExpanded, true);

      // Another small scroll down to 25px
      nav.onScroll(25);
      assert.strictEqual(nav.isExpanded, true);
    });

    it('collapses into compact capsule when scroll delta exceeds threshold', () => {
      const nav = new AdaptiveScrollNavStateMachine(28, true);
      nav.onScroll(50); // delta = 50 >= 28
      assert.strictEqual(nav.isExpanded, false);
      assert.strictEqual(nav.lastScrollY, 50);
    });

    it('remains compact when scrolling continues downwards or upwards', () => {
      const nav = new AdaptiveScrollNavStateMachine(28, true);
      nav.onScroll(60); // collapsed
      assert.strictEqual(nav.isExpanded, false);

      // Continuing to scroll down
      nav.onScroll(300);
      assert.strictEqual(nav.isExpanded, false);

      // Scrolling back up
      nav.onScroll(100);
      assert.strictEqual(nav.isExpanded, false);

      // Scrolling to top
      nav.onScroll(0);
      assert.strictEqual(nav.isExpanded, false);
    });

    it('remains compact when scrolling stops (no auto-expand timer)', () => {
      const nav = new AdaptiveScrollNavStateMachine(28, true);
      nav.onScroll(100);
      assert.strictEqual(nav.isExpanded, false);

      // Stationary scroll position
      nav.onScroll(100);
      assert.strictEqual(nav.isExpanded, false);
    });

    it('manually expands on user interaction and retains expanded state despite deep scroll offset', () => {
      const nav = new AdaptiveScrollNavStateMachine(28, true);
      nav.onScroll(400); // scrolled deep and collapsed
      assert.strictEqual(nav.isExpanded, false);

      // User clicks compact capsule to expand
      nav.expand(400);
      assert.strictEqual(nav.isExpanded, true);
      assert.strictEqual(nav.lastScrollY, 400);

      // If user does not scroll (delta = 0), remains expanded
      nav.onScroll(400);
      assert.strictEqual(nav.isExpanded, true);

      // Minor jitter after manual expansion (delta = 10 < 28) remains expanded
      nav.onScroll(410);
      assert.strictEqual(nav.isExpanded, true);
    });

    it('collapses again only when a new scroll interaction exceeds threshold from the new anchor', () => {
      const nav = new AdaptiveScrollNavStateMachine(28, true);
      nav.onScroll(300);
      nav.expand(300);
      assert.strictEqual(nav.isExpanded, true);

      // New scroll exceeds delta from 300 (340 - 300 = 40 >= 28)
      nav.onScroll(340);
      assert.strictEqual(nav.isExpanded, false);
      assert.strictEqual(nav.lastScrollY, 340);
    });

    it('resets to expanded state upon route navigation', () => {
      const nav = new AdaptiveScrollNavStateMachine(28, true);
      nav.onScroll(250);
      assert.strictEqual(nav.isExpanded, false);

      // User navigates to a new page
      nav.onNavigate(0);
      assert.strictEqual(nav.isExpanded, true);
      assert.strictEqual(nav.lastScrollY, 0);
    });

    it('supports manual collapse via dedicated affordance', () => {
      const nav = new AdaptiveScrollNavStateMachine(28, true);
      assert.strictEqual(nav.isExpanded, true);

      nav.collapse(50);
      assert.strictEqual(nav.isExpanded, false);
      assert.strictEqual(nav.lastScrollY, 50);
    });
  });
});
