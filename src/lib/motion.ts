/**
 * Shared motion vocabulary. Sober on purpose (PRODUCT.md: "if the UI draws
 * attention to itself, it has failed"): short, decelerating arrivals, faster
 * exits, small travel. Mirrors the --transition-* tokens in globals.css.
 */
export const DURATION = {
  /** Press feedback, toggles */
  fast: 0.15,
  /** Routine state change, list entries */
  base: 0.24,
  /** Overlays and larger moves */
  slow: 0.32,
} as const

export const EASE = {
  /** Confident arrival: quick start, long settle */
  out: 'power3.out',
  /** Leaving: accelerate away, faster than arriving */
  in: 'power2.in',
  /** Moving between two resting places (reorder, indicators) */
  inOut: 'power2.inOut',
} as const

/** Longest total stagger for a list, so long lists never feel slow */
export const MAX_STAGGER_TOTAL = 0.3

export function staggerFor(count: number, each = 0.04): number {
  if (count <= 1) return 0
  return Math.min(each, MAX_STAGGER_TOTAL / (count - 1))
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
