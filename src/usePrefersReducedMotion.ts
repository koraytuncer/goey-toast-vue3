import { ref, onMounted, onUnmounted } from 'vue'

const QUERY = '(prefers-reduced-motion: reduce)'

function getInitialState(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia(QUERY).matches
}

export function usePrefersReducedMotion() {
  const prefersReducedMotion = ref(getInitialState())

  let mql: MediaQueryList | null = null

  const handler = (event: MediaQueryListEvent) => {
    prefersReducedMotion.value = event.matches
  }

  onMounted(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    mql = window.matchMedia(QUERY)
    prefersReducedMotion.value = mql.matches
    mql.addEventListener('change', handler)
  })

  onUnmounted(() => {
    mql?.removeEventListener('change', handler)
  })

  return prefersReducedMotion
}
