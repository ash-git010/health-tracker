import { useEffect, useRef } from 'react'

export interface NavState {
  sectionId: string | null
  tabId: string
  showSettings: boolean
}

export function useHistoryNav(
  state: NavState,
  onPop: (state: NavState) => void
) {
  const isPopping = useRef(false)
  const previous = useRef<string>('')

  useEffect(() => {
    function handlePop(event: PopStateEvent) {
      isPopping.current = true
      const s = (event.state ?? null) as NavState | null
      onPop(s ?? { sectionId: null, tabId: '', showSettings: false })
    }

    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [onPop])

  useEffect(() => {
    const key = `${state.sectionId}|${state.tabId}|${state.showSettings}`

    if (isPopping.current) {
      isPopping.current = false
      previous.current = key
      return
    }

    if (previous.current === '') {
      window.history.replaceState(state, '')
      previous.current = key
      return
    }

    if (previous.current !== key) {
      window.history.pushState(state, '')
      previous.current = key
    }
  }, [state])
}