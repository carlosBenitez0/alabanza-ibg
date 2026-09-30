'use client'

import { SetStateAction, useCallback, useEffect, useState } from 'react'

/**
 * Runs `fetcher` whenever it changes (wrap it in useCallback) or `reload()`
 * is called. State is only set after the promise settles, and results from
 * a superseded request are dropped.
 *
 * `loading` is true until data for the *current* fetcher has arrived, so
 * changing a dependency (e.g. the selected week) never shows stale rows.
 * `reload()` refreshes in place without flashing a loader.
 * `error` is set when the fetcher rejects, so pages can tell "nothing here"
 * apart from "couldn't load" (keep `data` as the last good value).
 */
export function useAsyncData<T>(fetcher: (() => Promise<T>) | null, initial: T) {
  const [state, setState] = useState<{ data: T; source: unknown; error: Error | null }>({
    data: initial,
    source: null,
    error: null,
  })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!fetcher) return
    let active = true
    fetcher().then(
      (result) => {
        if (active) setState({ data: result, source: fetcher, error: null })
      },
      (reason: unknown) => {
        if (active) {
          const error = reason instanceof Error ? reason : new Error(String(reason))
          setState((prev) => ({ ...prev, source: fetcher, error }))
        }
      }
    )
    return () => {
      active = false
    }
  }, [fetcher, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  const setData = useCallback((action: SetStateAction<T>) => {
    setState((prev) => ({
      ...prev,
      data: typeof action === 'function' ? (action as (p: T) => T)(prev.data) : action,
    }))
  }, [])

  return {
    data: state.data,
    setData,
    loading: fetcher === null || state.source !== fetcher,
    error: state.error,
    reload,
  }
}
