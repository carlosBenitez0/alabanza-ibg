'use client'

import { RefCallback, useEffect, useLayoutEffect, useState } from 'react'
import { gsap } from 'gsap'
import { DURATION, EASE, prefersReducedMotion, staggerFor } from '@/lib/motion'

// Layout effect in the browser (hide before first paint, no flash); plain effect on the server
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export type GsapRevealFrom = 'bottom' | 'fade'

export interface GsapRevealOptions {
  /** Which descendants to animate, e.g. '.card', 'li'. Defaults to direct children. */
  selector?: string
  /** Enter style. Default 'bottom' (small rise + fade) */
  from?: GsapRevealFrom
  /** Travel for 'bottom' (px). Default 10 */
  yOffset?: number
  /**
   * Keep watching the container and bring in children added later
   * (search results, a newly added row). Default false.
   */
  watch?: boolean
}

function fromVars(from: GsapRevealFrom, yOffset: number): gsap.TweenVars {
  return from === 'bottom' ? { opacity: 0, y: yOffset } : { opacity: 0 }
}

function collect(el: HTMLElement, selector?: string): HTMLElement[] {
  return (selector ? Array.from(el.querySelectorAll<HTMLElement>(selector)) : (Array.from(el.children) as HTMLElement[]))
}

/**
 * Lists and grids arrive as a list: a short staggered rise when the container
 * scrolls into view. Returns a callback ref, so it works even when the
 * container mounts late (after a skeleton or loader), which a ref read once
 * on mount could not.
 *
 * Content is only hidden from JS, and never when the user prefers reduced motion.
 */
export function useGsapReveal<T extends HTMLElement = HTMLDivElement>(
  options: GsapRevealOptions = {}
): RefCallback<T> {
  const [el, setEl] = useState<T | null>(null)
  const { selector, from = 'bottom', yOffset = 10, watch = false } = options

  useIsoLayoutEffect(() => {
    if (!el || prefersReducedMotion()) return
    const seen = new WeakSet<Element>()
    let mutations: MutationObserver | null = null

    const ctx = gsap.context(() => {
      const targets = collect(el, selector)
      targets.forEach((t) => seen.add(t))
      if (targets.length) gsap.set(targets, fromVars(from, yOffset))

      const reveal = () =>
        gsap.to(targets, {
          opacity: 1,
          y: 0,
          duration: DURATION.slow,
          ease: EASE.out,
          stagger: staggerFor(targets.length),
          clearProps: 'transform,opacity',
        })

      const io = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            reveal()
            io.disconnect()
          }
        },
        // threshold 0: long lists taller than the screen still reveal right away
        { threshold: 0, rootMargin: '0px 0px -24px 0px' }
      )
      io.observe(el)

      if (watch) {
        mutations = new MutationObserver(() => {
          const fresh = collect(el, selector).filter((t) => !seen.has(t))
          if (!fresh.length) return
          fresh.forEach((t) => seen.add(t))
          gsap.fromTo(fresh, fromVars(from, yOffset * 0.6), {
            opacity: 1,
            y: 0,
            duration: DURATION.base,
            ease: EASE.out,
            stagger: staggerFor(fresh.length, 0.03),
            clearProps: 'transform,opacity',
          })
        })
        mutations.observe(el, { childList: true, subtree: Boolean(selector) })
      }

      return () => io.disconnect()
    }, el)

    return () => {
      mutations?.disconnect()
      ctx.revert()
    }
  }, [el, selector, from, yOffset, watch])

  return setEl as RefCallback<T>
}

/**
 * One element fading up into place when it mounts (page headers, auth cards).
 */
export function useGsapMountReveal<T extends HTMLElement = HTMLDivElement>(
  options: Pick<GsapRevealOptions, 'from' | 'yOffset'> = {}
): RefCallback<T> {
  const [el, setEl] = useState<T | null>(null)
  const { from = 'bottom', yOffset = 8 } = options

  useIsoLayoutEffect(() => {
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.fromTo(el, fromVars(from, yOffset), {
        opacity: 1,
        y: 0,
        duration: DURATION.slow,
        ease: EASE.out,
        clearProps: 'transform,opacity',
      })
    }, el)
    return () => ctx.revert()
  }, [el, from, yOffset])

  return setEl as RefCallback<T>
}
