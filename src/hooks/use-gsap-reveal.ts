'use client'

import { useEffect, useRef, RefObject } from 'react'
import { gsap } from 'gsap'

export type GsapRevealFrom = 'bottom' | 'left' | 'fade' | 'scale'

export interface GsapRevealOptions {
  /** Which child selector to target, e.g. '.card', 'li'. Defaults to direct children. */
  selector?: string
  /** Stagger delay between each child (seconds). Default 0.07 */
  stagger?: number
  /** Delay before the animation begins (seconds). Default 0 */
  delay?: number
  /** Enter direction. Default 'bottom' */
  from?: GsapRevealFrom
  /** Y offset for 'bottom' (px). Default 24 */
  yOffset?: number
  /** Duration (seconds). Default 0.6 */
  duration?: number
  /** Whether to trigger once on mount (true) or on IntersectionObserver. Default false */
  immediate?: boolean
}

function getFromVars(from: GsapRevealFrom, yOffset: number): gsap.TweenVars {
  switch (from) {
    case 'bottom':
      return { opacity: 0, y: yOffset, clipPath: 'inset(100% 0 0 0)' }
    case 'left':
      return { opacity: 0, x: -24, clipPath: 'inset(0 100% 0 0)' }
    case 'scale':
      return { opacity: 0, scale: 0.95 }
    case 'fade':
    default:
      return { opacity: 0 }
  }
}

function getToVars(from: GsapRevealFrom): gsap.TweenVars {
  switch (from) {
    case 'bottom':
      return { opacity: 1, y: 0, clipPath: 'inset(0% 0 0 0)' }
    case 'left':
      return { opacity: 1, x: 0, clipPath: 'inset(0 0% 0 0)' }
    case 'scale':
      return { opacity: 1, scale: 1 }
    case 'fade':
    default:
      return { opacity: 1 }
  }
}

/**
 * Animates the container's children (or a selector subset) with GSAP
 * when the container enters the viewport.
 *
 * Uses gsap.context() for proper React cleanup.
 *
 * @example
 * const listRef = useGsapReveal<HTMLUListElement>({ stagger: 0.08 })
 * return <ul ref={listRef}> ... </ul>
 */
export function useGsapReveal<T extends HTMLElement = HTMLDivElement>(
  options: GsapRevealOptions = {}
): RefObject<T | null> {
  const ref = useRef<T | null>(null)
  const {
    selector,
    stagger = 0.07,
    delay = 0,
    from = 'bottom',
    yOffset = 24,
    duration = 0.55,
    immediate = false,
  } = options

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const ctx = gsap.context(() => {
      const targets = selector
        ? el.querySelectorAll(selector)
        : Array.from(el.children)

      if (!targets.length) return

      const fromVars = getFromVars(from, yOffset)
      const toVars = getToVars(from)

      const animate = () => {
        gsap.fromTo(targets, fromVars, {
          ...toVars,
          duration,
          delay,
          stagger,
          ease: 'power3.out',
          clearProps: 'clip-path',
        })
      }

      if (immediate) {
        animate()
        return
      }

      // Set initial hidden state
      gsap.set(targets, fromVars)

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            animate()
            observer.disconnect()
          }
        },
        { threshold: 0.1 }
      )
      observer.observe(el)

      return () => observer.disconnect()
    }, el)

    return () => ctx.revert()
  }, [from, yOffset, stagger, delay, duration, selector, immediate])

  return ref
}

/**
 * Simple single-element fade/reveal on mount.
 *
 * @example
 * const titleRef = useGsapMountReveal({ from: 'bottom', delay: 0.1 })
 * return <h1 ref={titleRef}>...</h1>
 */
export function useGsapMountReveal<T extends HTMLElement = HTMLDivElement>(
  options: Omit<GsapRevealOptions, 'selector' | 'stagger'> = {}
): RefObject<T | null> {
  const ref = useRef<T | null>(null)
  const { from = 'bottom', yOffset = 20, duration = 0.5, delay = 0 } = options

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        getFromVars(from, yOffset),
        {
          ...getToVars(from),
          duration,
          delay,
          ease: 'power3.out',
          clearProps: 'clip-path',
        }
      )
    }, el)

    return () => ctx.revert()
  }, [from, yOffset, duration, delay])

  return ref
}
