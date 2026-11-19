import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

export interface UseAdaptiveScrollNavOptions {
  /**
   * Minimum vertical scroll delta in pixels required to trigger navigation collapse.
   * Defends against microscopic jitter or sub-pixel touch vibrations.
   * Default: 28px
   */
  threshold?: number;
  /**
   * Initial expanded state on mount.
   * Default: true
   */
  initialExpanded?: boolean;
}

export interface UseAdaptiveScrollNavReturn {
  isExpanded: boolean;
  expand: () => void;
  collapse: () => void;
  toggle: () => void;
}

/**
 * Custom hook managing the adaptive floating capsule navigation state machine.
 *
 * State Machine Invariants:
 * 1. Initial State: Always expanded on mount.
 * 2. Route Change: Always resets to expanded and resets scroll reference anchor.
 * 3. Scrolling: When user scrolls beyond `threshold`, collapses to compact capsule.
 * 4. Scroll Persistence: Scrolling up or down while compact NEVER auto-expands; remains compact.
 * 5. Manual Expansion: Clicking compact capsule expands it and resets the scroll anchor to the
 *    current scroll position, preventing immediate re-collapse.
 * 6. Re-scrolling after manual expansion: Collapses only when a NEW scroll delta exceeds threshold.
 */
export function useAdaptiveScrollNav({
  threshold = 28,
  initialExpanded = true,
}: UseAdaptiveScrollNavOptions = {}): UseAdaptiveScrollNavReturn {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState<boolean>(initialExpanded);
  const lastScrollYRef = useRef<number>(0);
  const isExpandedRef = useRef<boolean>(initialExpanded);
  const tickingRef = useRef<boolean>(false);

  // Synchronize ref to prevent stale closures inside passive listeners & animation frames
  isExpandedRef.current = isExpanded;

  const getScrollY = (): number => {
    if (typeof window === 'undefined') return 0;
    return window.scrollY || document.documentElement.scrollTop || 0;
  };

  const expand = useCallback(() => {
    setIsExpanded(true);
    lastScrollYRef.current = getScrollY();
  }, []);

  const collapse = useCallback(() => {
    setIsExpanded(false);
    lastScrollYRef.current = getScrollY();
  }, []);

  const toggle = useCallback(() => {
    if (isExpandedRef.current) {
      collapse();
    } else {
      expand();
    }
  }, [collapse, expand]);

  // Route navigation trigger: Reset to expanded on every route change
  useEffect(() => {
    setIsExpanded(true);
    lastScrollYRef.current = getScrollY();
  }, [location.pathname]);

  // Scroll listener: Monitored passively with requestAnimationFrame throttling
  useEffect(() => {
    lastScrollYRef.current = getScrollY();

    const handleScroll = () => {
      // Invariant: If already compact, scrolling up or down MUST NOT expand
      if (!isExpandedRef.current) {
        return;
      }

      if (tickingRef.current) {
        return;
      }

      tickingRef.current = true;

      window.requestAnimationFrame(() => {
        tickingRef.current = false;
        if (!isExpandedRef.current) return;

        const currentScrollY = getScrollY();
        const delta = Math.abs(currentScrollY - lastScrollYRef.current);

        if (delta >= threshold) {
          setIsExpanded(false);
          lastScrollYRef.current = currentScrollY;
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold]);

  return {
    isExpanded,
    expand,
    collapse,
    toggle,
  };
}
