import { useEffect, useState } from 'react'

/** Live boolean for a CSS media query; false where matchMedia is unavailable. */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : (window.matchMedia?.(query).matches ?? false)
  )

  useEffect(() => {
    const list = window.matchMedia?.(query)
    if (!list) return
    const update = () => setMatches(list.matches)
    update()
    list.addEventListener?.('change', update)
    return () => list.removeEventListener?.('change', update)
  }, [query])

  return matches
}
