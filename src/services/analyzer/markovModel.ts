/**
 * Markov Chain Model Specification & Heuristic Baseline Model
 *
 * IMPORTANT TRANSPARENCY & METHODOLOGICAL DECLARATION:
 * 1. This model is an EXPERIMENTAL HEURISTIC PROTOTYPE, not an empirically trained breach model.
 * 2. It has NOT been trained on real password leak corpora (such as RockYou) in accordance with
 *    CredLock's academic integrity and ethical guidelines prohibiting unvetted leak corpora.
 * 3. Character transitions are structured around:
 *    - Standard English structural digraph frequencies
 *    - Sequential decimal runs (e.g. 1->2, 2->3)
 *    - Keyboard row adjacencies (e.g. q->w, a->s)
 *    - Uppercase-to-lowercase initial transitions
 * 4. The architecture is modular: future research can replace this heuristic model
 *    with an empirical n-gram corpus without modifying the analyzer logic.
 */

export interface MarkovModel {
  id: string;
  name: string;
  version: string;
  isExperimental: boolean;
  description: string;
  smoothingEpsilon: number; // Probability floor for unseen transitions (Laplace/additive smoothing)
  initialProbabilities: Record<string, number>; // P(c1)
  transitionProbabilities: Record<string, Record<string, number>>; // P(c_i | c_{i-1})
}

/**
 * Standard English letter frequencies (approximate relative probabilities for initial characters).
 */
const BASE_INITIAL_PROBABILITIES: Record<string, number> = {
  // Uppercase initials (common in password constructions)
  A: 0.035, B: 0.030, C: 0.032, D: 0.028, E: 0.030, F: 0.022, G: 0.020,
  H: 0.022, I: 0.020, J: 0.028, K: 0.022, L: 0.025, M: 0.032, N: 0.018,
  O: 0.015, P: 0.035, Q: 0.008, R: 0.025, S: 0.040, T: 0.035, U: 0.010,
  V: 0.012, W: 0.020, X: 0.005, Y: 0.010, Z: 0.008,

  // Lowercase initials
  a: 0.030, b: 0.022, c: 0.025, d: 0.022, e: 0.025, f: 0.018, g: 0.016,
  h: 0.018, i: 0.015, j: 0.018, k: 0.015, l: 0.020, m: 0.025, n: 0.015,
  o: 0.012, p: 0.025, q: 0.005, r: 0.020, s: 0.030, t: 0.028, u: 0.010,
  v: 0.010, w: 0.015, x: 0.004, y: 0.008, z: 0.005,

  // Digit initials
  '1': 0.035, '0': 0.015, '2': 0.015, '3': 0.010, '4': 0.008,
  '5': 0.008, '6': 0.006, '7': 0.008, '8': 0.008, '9': 0.008,

  // Symbol initials (less common as first character)
  '!': 0.005, '@': 0.006, '#': 0.005, $: 0.004, _: 0.005, '.': 0.004,
};

/**
 * Common heuristic character transitions:
 * - English digraphs (th, he, in, er, an, re, on, at, en, nd, ed, es, or, te, of)
 * - Number sequences (0->1, 1->2, 2->3, etc.)
 * - Keyboard adjacencies (q->w, w->e, e->r, a->s, s->d, z->x)
 * - Common word roots & suffixes (ing, ion, pass, word, admin, love, 123)
 */
const BASE_TRANSITIONS: Record<string, Record<string, number>> = {
  // Digit sequences
  '0': { '1': 0.25, '0': 0.15, '9': 0.05, '!': 0.05 },
  '1': { '2': 0.40, '1': 0.10, '0': 0.08, '!': 0.10, '@': 0.05 },
  '2': { '3': 0.40, '2': 0.10, '1': 0.08, '0': 0.05, '!': 0.05 },
  '3': { '4': 0.35, '3': 0.10, '2': 0.08, '!': 0.05, '@': 0.05 },
  '4': { '5': 0.35, '4': 0.10, '3': 0.05, '!': 0.05 },
  '5': { '6': 0.35, '5': 0.10, '4': 0.05, '!': 0.05 },
  '6': { '7': 0.35, '6': 0.10, '!': 0.05 },
  '7': { '8': 0.35, '7': 0.10, '!': 0.05 },
  '8': { '9': 0.35, '8': 0.10, '!': 0.05 },
  '9': { '0': 0.25, '9': 0.10, '!': 0.08 },

  // Uppercase to lowercase (title-case words)
  P: { a: 0.35, o: 0.15, e: 0.12, r: 0.10, l: 0.08, '@': 0.05 },
  A: { d: 0.25, l: 0.15, n: 0.12, s: 0.10, b: 0.08, m: 0.08 },
  S: { e: 0.20, u: 0.15, t: 0.15, h: 0.10, a: 0.10, o: 0.08 },
  M: { a: 0.25, o: 0.15, e: 0.15, i: 0.12, u: 0.10 },
  L: { o: 0.30, e: 0.20, i: 0.15, a: 0.15, u: 0.08 },
  C: { h: 0.25, o: 0.20, a: 0.18, e: 0.12, r: 0.10 },
  D: { a: 0.25, e: 0.20, o: 0.18, i: 0.12 },
  J: { o: 0.25, a: 0.22, u: 0.18, e: 0.15 },
  T: { h: 0.35, o: 0.20, e: 0.15, a: 0.12 },
  W: { e: 0.25, a: 0.20, o: 0.18, i: 0.15 },

  // Lowercase common transitions
  a: { n: 0.18, s: 0.15, t: 0.14, r: 0.12, l: 0.10, d: 0.08, b: 0.05, m: 0.05 },
  b: { e: 0.25, o: 0.20, a: 0.18, l: 0.12, r: 0.10 },
  c: { h: 0.30, o: 0.18, a: 0.15, k: 0.12, e: 0.10, t: 0.08 },
  d: { e: 0.22, m: 0.15, o: 0.15, i: 0.12, a: 0.10, '1': 0.08, '!': 0.05 },
  e: { r: 0.35, n: 0.18, s: 0.15, d: 0.12, w: 0.08, '1': 0.05 },
  f: { o: 0.25, i: 0.20, e: 0.18, a: 0.12, l: 0.10 },
  g: { e: 0.20, h: 0.18, a: 0.15, o: 0.15, '1': 0.05 },
  h: { e: 0.35, a: 0.20, i: 0.18, o: 0.12 },
  i: { o: 0.35, n: 0.25, s: 0.15, t: 0.10, k: 0.08, c: 0.05 },
  j: { a: 0.25, o: 0.25, e: 0.20, u: 0.15 },
  k: { e: 0.25, l: 0.20, i: 0.15, o: 0.10, '1': 0.08, '!': 0.05 },
  l: { e: 0.25, o: 0.22, i: 0.18, a: 0.15, l: 0.08 },
  m: { a: 0.25, e: 0.22, i: 0.18, o: 0.15, b: 0.08 },
  n: { d: 0.22, g: 0.20, t: 0.18, e: 0.12, o: 0.08, '1': 0.05 },
  o: { p: 0.35, r: 0.20, n: 0.15, u: 0.12, w: 0.10, l: 0.08 },
  p: { a: 0.30, e: 0.20, o: 0.18, l: 0.12, r: 0.10 },
  q: { u: 0.85, w: 0.10, a: 0.05 },
  r: { e: 0.25, t: 0.25, d: 0.15, o: 0.12, a: 0.10, f: 0.08 },
  s: { s: 0.25, t: 0.20, e: 0.18, a: 0.12, o: 0.08, '1': 0.05 },
  t: { h: 0.35, y: 0.25, e: 0.15, o: 0.10, a: 0.08, i: 0.07 },
  u: { i: 0.35, n: 0.20, r: 0.15, s: 0.12, l: 0.10, j: 0.08 },
  v: { e: 0.40, a: 0.20, i: 0.15, o: 0.15 },
  w: { e: 0.35, o: 0.25, a: 0.20, s: 0.10, i: 0.10 },
  x: { t: 0.20, e: 0.20, a: 0.15, '1': 0.10 },
  y: { u: 0.30, s: 0.15, e: 0.15, h: 0.15, '1': 0.12, '!': 0.08 },
  z: { a: 0.25, e: 0.20, o: 0.15, '1': 0.08 },

  // Common symbol pairings
  '!': { '!': 0.40, '@': 0.15, '1': 0.15 },
  '@': { '@': 0.30, '!': 0.20, '1': 0.10 },
  '#': { '#': 0.30, '!': 0.15 },
  $: { $: 0.30, '!': 0.15 },
};

export const HEURISTIC_BASELINE_MARKOV_MODEL: MarkovModel = {
  id: 'heuristic-baseline-v1',
  name: 'CredLock Heuristic N-Gram Baseline',
  version: '1.0.0-prototype',
  isExperimental: true,
  description:
    'Heuristic character transition model based on English digraph frequencies, QWERTY keyboard walks, and decimal sequence progressions. Uses Laplace smoothing for unseen pairs.',
  smoothingEpsilon: 0.0001, // 1e-4 floor for unseen transitions
  initialProbabilities: BASE_INITIAL_PROBABILITIES,
  transitionProbabilities: BASE_TRANSITIONS,
};
