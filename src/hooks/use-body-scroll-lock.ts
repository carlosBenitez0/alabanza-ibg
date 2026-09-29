'use client'

import { useEffect } from 'react'

let lockCount = 0
let savedOverflow = ''
let savedPaddingRight = ''

/**
 * Locks page scroll while `active` is true. Ref-counted so stacked
 * overlays (drawer + modal) unlock only when the last one closes.
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    const body = document.body

    if (lockCount === 0) {
      savedOverflow = body.style.overflow
      savedPaddingRight = body.style.paddingRight
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`
    }
    lockCount++

    return () => {
      lockCount--
      if (lockCount === 0) {
        body.style.overflow = savedOverflow
        body.style.paddingRight = savedPaddingRight
      }
    }
  }, [active])
}
