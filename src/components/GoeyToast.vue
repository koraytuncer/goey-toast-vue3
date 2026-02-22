<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
  nextTick,
  onWatcherCleanup,
  type Component,
  type VNode,
} from 'vue'
import { animate } from 'motion'
import { toast as sonnerToast } from 'vue-sonner'
import type {
  GoeyToastAction,
  GoeyToastClassNames,
  GoeyToastPhase,
  GoeyToastTimings,
  GoeyToastType,
  GoeyRenderable,
} from '../types'
import { getGoeyPosition, getGoeySpring, getGoeyBounce } from '../context'
import { usePrefersReducedMotion } from '../usePrefersReducedMotion'
import { styles } from './goey-styles'
import DefaultIcon from '../icons/DefaultIcon.vue'
import SuccessIcon from '../icons/SuccessIcon.vue'
import ErrorIcon from '../icons/ErrorIcon.vue'
import WarningIcon from '../icons/WarningIcon.vue'
import InfoIcon from '../icons/InfoIcon.vue'
import SpinnerIcon from '../icons/SpinnerIcon.vue'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface GoeyToastProps {
  title: string
  description?: GoeyRenderable
  type: GoeyToastType
  action?: GoeyToastAction
  icon?: GoeyRenderable
  phase: GoeyToastPhase
  classNames?: GoeyToastClassNames
  fillColor?: string
  borderColor?: string
  borderWidth?: number
  timing?: GoeyToastTimings
  spring?: boolean
  bounce?: number
  toastId?: string | number
}

const props = withDefaults(defineProps<GoeyToastProps>(), {
  fillColor: '#ffffff',
})

// ─── Constants ────────────────────────────────────────────────────────────────

const PH = 34
const DEFAULT_DISPLAY_DURATION = 4000
const DEFAULT_EXPAND_DUR = 0.6
const DEFAULT_COLLAPSE_DUR = 0.9
const SMOOTH_EASE = [0.4, 0, 0.2, 1] as const

// ─── Singleton MutationObserver registry ─────────────────────────────────────

const observerRegistry = new Map<Element, {
  observer: MutationObserver
  callbacks: Set<() => void>
}>()

function registerSonnerObserver(ol: Element, callback: () => void) {
  let entry = observerRegistry.get(ol)
  if (!entry) {
    const callbacks = new Set<() => void>()
    let applying = false
    const observer = new MutationObserver(() => {
      if (applying) return
      applying = true
      requestAnimationFrame(() => {
        callbacks.forEach(cb => cb())
        requestAnimationFrame(() => { applying = false })
      })
    })
    observer.observe(ol, {
      attributes: true,
      attributeFilter: ['style'],
      subtree: true,
      childList: true,
    })
    entry = { observer, callbacks }
    observerRegistry.set(ol, entry)
  }
  entry.callbacks.add(callback)
  return () => {
    entry!.callbacks.delete(callback)
    if (entry!.callbacks.size === 0) {
      entry!.observer.disconnect()
      observerRegistry.delete(ol)
    }
  }
}

// ─── Sonner height sync ───────────────────────────────────────────────────────

function syncSonnerHeights(wrapperEl: HTMLElement | null) {
  if (!wrapperEl) return
  const li = wrapperEl.closest('[data-sonner-toast]') as HTMLElement | null
  if (!li?.parentElement) return

  const ol = li.parentElement
  const toasts = Array.from(
    ol.querySelectorAll(':scope > [data-sonner-toast]')
  ) as HTMLElement[]

  for (const t of toasts) {
    const content = t.firstElementChild as HTMLElement | null
    const height = content ? content.getBoundingClientRect().height : 0
    if (height > 0) {
      t.style.setProperty('--initial-height', `${height}px`)
    }
  }
}

// ─── SVG morph path generators ───────────────────────────────────────────────

function morphPath(pw: number, bw: number, th: number, t: number): string {
  const pr = PH / 2
  const pillW = Math.min(pw, bw)
  const bodyH = PH + (th - PH) * t

  if (t <= 0 || bodyH - PH < 8) {
    return [
      `M 0,${pr}`,
      `A ${pr},${pr} 0 0 1 ${pr},0`,
      `H ${pillW - pr}`,
      `A ${pr},${pr} 0 0 1 ${pillW},${pr}`,
      `A ${pr},${pr} 0 0 1 ${pillW - pr},${PH}`,
      `H ${pr}`,
      `A ${pr},${pr} 0 0 1 0,${pr}`,
      `Z`,
    ].join(' ')
  }

  const curve = 14 * t
  const cr = Math.min(16, (bodyH - PH) * 0.45)
  const bodyW = pillW + (bw - pillW) * t
  const bodyTop = PH - curve
  const qEndX = Math.min(pillW + curve, bodyW - cr)

  return [
    `M 0,${pr}`,
    `A ${pr},${pr} 0 0 1 ${pr},0`,
    `H ${pillW - pr}`,
    `A ${pr},${pr} 0 0 1 ${pillW},${pr}`,
    `L ${pillW},${bodyTop}`,
    `Q ${pillW},${bodyTop + curve} ${qEndX},${bodyTop + curve}`,
    `H ${bodyW - cr}`,
    `A ${cr},${cr} 0 0 1 ${bodyW},${bodyTop + curve + cr}`,
    `L ${bodyW},${bodyH - cr}`,
    `A ${cr},${cr} 0 0 1 ${bodyW - cr},${bodyH}`,
    `H ${cr}`,
    `A ${cr},${cr} 0 0 1 0,${bodyH - cr}`,
    `Z`,
  ].join(' ')
}

function morphPathCenter(pw: number, bw: number, th: number, t: number): string {
  const pr = PH / 2
  const pillW = Math.min(pw, bw)
  const pillOffset = (bw - pillW) / 2

  if (t <= 0 || PH + (th - PH) * t - PH < 8) {
    return [
      `M ${pillOffset},${pr}`,
      `A ${pr},${pr} 0 0 1 ${pillOffset + pr},0`,
      `H ${pillOffset + pillW - pr}`,
      `A ${pr},${pr} 0 0 1 ${pillOffset + pillW},${pr}`,
      `A ${pr},${pr} 0 0 1 ${pillOffset + pillW - pr},${PH}`,
      `H ${pillOffset + pr}`,
      `A ${pr},${pr} 0 0 1 ${pillOffset},${pr}`,
      `Z`,
    ].join(' ')
  }

  const bodyH = PH + (th - PH) * t
  const curve = 14 * t
  const cr = Math.min(16, (bodyH - PH) * 0.45)
  const bodyTop = PH - curve
  const bodyCenter = bw / 2
  const halfBodyW = (pillW / 2) + ((bw - pillW) / 2) * t
  const bodyLeft = bodyCenter - halfBodyW
  const bodyRight = bodyCenter + halfBodyW
  const qLeftX = Math.max(bodyLeft + cr, pillOffset - curve)
  const qRightX = Math.min(bodyRight - cr, pillOffset + pillW + curve)

  return [
    `M ${pillOffset},${pr}`,
    `A ${pr},${pr} 0 0 1 ${pillOffset + pr},0`,
    `H ${pillOffset + pillW - pr}`,
    `A ${pr},${pr} 0 0 1 ${pillOffset + pillW},${pr}`,
    `L ${pillOffset + pillW},${bodyTop}`,
    `Q ${pillOffset + pillW},${bodyTop + curve} ${qRightX},${bodyTop + curve}`,
    `H ${bodyRight - cr}`,
    `A ${cr},${cr} 0 0 1 ${bodyRight},${bodyTop + curve + cr}`,
    `L ${bodyRight},${bodyH - cr}`,
    `A ${cr},${cr} 0 0 1 ${bodyRight - cr},${bodyH}`,
    `H ${bodyLeft + cr}`,
    `A ${cr},${cr} 0 0 1 ${bodyLeft},${bodyH - cr}`,
    `L ${bodyLeft},${bodyTop + curve + cr}`,
    `A ${cr},${cr} 0 0 1 ${bodyLeft + cr},${bodyTop + curve}`,
    `H ${qLeftX}`,
    `Q ${pillOffset},${bodyTop + curve} ${pillOffset},${bodyTop}`,
    `Z`,
  ].join(' ')
}

// ─── Spring config helper ─────────────────────────────────────────────────────

function squishSpring(durationSec: number, defaultDur: number, bounce = 0.4) {
  const scale = durationSec / defaultDur
  const stiffness = 200 + bounce * 437.5
  const damping = 24 - bounce * 20
  const mass = 0.7 * scale
  return { type: 'spring' as const, stiffness, damping, mass }
}

// ─── Composable state ─────────────────────────────────────────────────────────

const prefersReducedMotion = usePrefersReducedMotion()

const position = computed(() => getGoeyPosition())
const isRight = computed(() => position.value?.includes('right') ?? false)
const isCenter = computed(() => position.value?.includes('center') ?? false)
const useSpring = computed(() => props.spring ?? getGoeySpring())
const bounceVal = computed(() => props.bounce ?? getGoeyBounce() ?? 0.4)

// ─── Reactive state ───────────────────────────────────────────────────────────

const actionSuccess = ref<string | null>(null)
const dismissing = ref(false)
const hovered = ref(false)
const showBody = ref(false)
const dims = ref({ pw: 0, bw: 0, th: 0 })

// Mutable refs (not reactive — avoid re-renders during animation)
let hoveredRef = false
let collapsingRef = false
let preDismissRef = false
let collapseEndTime = 0
let expandedDimsRef = { pw: 0, bw: 0, th: 0 }
let morphTRef = 0
let aDims = { pw: 0, bw: 0, th: 0 }
let dimsRef = { pw: 0, bw: 0, th: 0 }
let remainingRef: number | null = null
let timerStartRef = 0
let lastSquishTime = 0
let mountSquished = false
let prevShowBodyRef = false
let reExpandingRef = false
let headerSquished = false

// Animation controllers
let morphCtrl: ReturnType<typeof animate> | null = null
let pillResizeCtrl: ReturnType<typeof animate> | null = null
let headerSquishCtrl: ReturnType<typeof animate> | null = null
let blobSquishCtrl: ReturnType<typeof animate> | null = null
let shakeCtrl: ReturnType<typeof animate> | null = null
let dismissTimerRef: ReturnType<typeof setTimeout> | null = null

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const wrapperRef = ref<HTMLDivElement | null>(null)
const pathRef = ref<SVGPathElement | null>(null)
const headerRef = ref<HTMLDivElement | null>(null)
const contentRef = ref<HTMLDivElement | null>(null)

// ─── Computed effective values ────────────────────────────────────────────────

const effectiveTitle = computed(() => actionSuccess.value ?? props.title)
const effectivePhase = computed<GoeyToastPhase>(() => actionSuccess.value ? 'success' : props.phase)
const effectiveDescription = computed(() => actionSuccess.value ? undefined : props.description)
const effectiveAction = computed(() => actionSuccess.value ? undefined : props.action)

const isLoading = computed(() => effectivePhase.value === 'loading')
const hasDescription = computed(() => Boolean(effectiveDescription.value))
const hasAction = computed(() => Boolean(effectiveAction.value))
const isExpanded = computed(() => (hasDescription.value || hasAction.value) && !dismissing.value)
const hasDims = computed(() => dims.value.pw > 0 && dims.value.bw > 0 && dims.value.th > 0)

const expandDur = DEFAULT_EXPAND_DUR
const collapseDur = DEFAULT_COLLAPSE_DUR

// ─── Phase/color maps ─────────────────────────────────────────────────────────

const titleColorMap: Record<GoeyToastPhase, string> = {
  loading: styles.titleLoading,
  default: styles.titleDefault,
  success: styles.titleSuccess,
  error: styles.titleError,
  warning: styles.titleWarning,
  info: styles.titleInfo,
}

const actionColorMap: Record<GoeyToastPhase, string> = {
  loading: styles.actionInfo,
  default: styles.actionDefault,
  success: styles.actionSuccess,
  error: styles.actionError,
  warning: styles.actionWarning,
  info: styles.actionInfo,
}

// ─── flush: apply animated state to DOM ──────────────────────────────────────

function flush() {
  const { pw: p, bw: b, th: h } = aDims
  if (p <= 0 || b <= 0 || h <= 0) return

  const t = Math.max(0, Math.min(1, morphTRef))
  const pos = getGoeyPosition()
  const rightSide = pos?.includes('right') ?? false
  const centerPos = pos?.includes('center') ?? false

  if (centerPos) {
    const centerBw = Math.max(dimsRef.bw, expandedDimsRef.bw, p)
    pathRef.value?.setAttribute('d', morphPathCenter(p, centerBw, h, t))
  } else {
    pathRef.value?.setAttribute('d', morphPath(p, b, h, t))
  }

  if (t >= 1) {
    if (wrapperRef.value) wrapperRef.value.style.width = ''
    if (contentRef.value) {
      contentRef.value.style.width = ''
      contentRef.value.style.overflow = ''
      contentRef.value.style.maxHeight = ''
      contentRef.value.style.clipPath = ''
    }
  } else if (t > 0) {
    const targetBw = dimsRef.bw
    const pillW = Math.min(p, b)
    const currentW = pillW + (b - pillW) * t
    const currentH = PH + (dimsRef.th - PH) * t
    const centerFullW = centerPos ? Math.max(dimsRef.bw, expandedDimsRef.bw, p) : 0

    if (wrapperRef.value) {
      wrapperRef.value.style.width = (centerPos ? centerFullW : currentW) + 'px'
    }
    if (contentRef.value) {
      contentRef.value.style.width = (centerPos ? centerFullW : targetBw) + 'px'
      contentRef.value.style.overflow = 'hidden'
      contentRef.value.style.maxHeight = currentH + 'px'
      if (centerPos) {
        const clip = (centerFullW - currentW) / 2
        contentRef.value.style.clipPath = `inset(0 ${clip}px 0 ${clip}px)`
      } else {
        const clip = targetBw - currentW
        contentRef.value.style.clipPath = rightSide
          ? `inset(0 0 0 ${clip}px)`
          : `inset(0 ${clip}px 0 0)`
      }
    }
  } else {
    const pillW = Math.min(p, b)
    if (wrapperRef.value) {
      const centerBw = centerPos ? Math.max(dimsRef.bw, expandedDimsRef.bw, p) : pillW
      wrapperRef.value.style.width = centerBw + 'px'
    }
    if (contentRef.value) {
      if (centerPos) {
        const centerBwVal = Math.max(dimsRef.bw, expandedDimsRef.bw, p)
        contentRef.value.style.width = centerBwVal + 'px'
        const clip = (centerBwVal - pillW) / 2
        contentRef.value.style.clipPath = `inset(0 ${clip}px 0 ${clip}px)`
      } else {
        contentRef.value.style.width = ''
        contentRef.value.style.clipPath = ''
      }
      contentRef.value.style.overflow = 'hidden'
      contentRef.value.style.maxHeight = PH + 'px'
    }
  }
}

// ─── measure: read natural content dimensions ─────────────────────────────────

function measure() {
  if (!headerRef.value || !contentRef.value) return

  const wr = wrapperRef.value
  const savedW = wr?.style.width ?? ''
  const savedOv = contentRef.value.style.overflow
  const savedMH = contentRef.value.style.maxHeight
  const savedCW = contentRef.value.style.width

  if (wr) wr.style.width = ''
  contentRef.value.style.overflow = ''
  contentRef.value.style.maxHeight = ''
  contentRef.value.style.width = ''

  const cs = getComputedStyle(contentRef.value)
  const paddingX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
  const pw = headerRef.value.offsetWidth + paddingX
  const bw = contentRef.value.offsetWidth
  const th = contentRef.value.offsetHeight

  if (wr) wr.style.width = savedW
  contentRef.value.style.overflow = savedOv
  contentRef.value.style.maxHeight = savedMH
  contentRef.value.style.width = savedCW

  dimsRef = { pw, bw, th }
  dims.value = { pw, bw, th }
}

// ─── triggerLandingSquish ─────────────────────────────────────────────────────

function triggerLandingSquish(phase: 'expand' | 'collapse' | 'mount' = 'mount') {
  if (!wrapperRef.value || prefersReducedMotion.value) return
  if (!useSpring.value) return

  const now = Date.now()
  if (now - lastSquishTime < 300) return
  lastSquishTime = now

  blobSquishCtrl?.stop()
  const el = wrapperRef.value
  const springConfig = phase === 'collapse'
    ? squishSpring(collapseDur, DEFAULT_COLLAPSE_DUR, bounceVal.value)
    : squishSpring(expandDur, DEFAULT_EXPAND_DUR, bounceVal.value)

  const bScale = bounceVal.value / 0.4
  const compressY = (phase === 'collapse' ? 0.07 : 0.12) * bScale
  const expandX = (phase === 'collapse' ? 0.035 : 0.06) * bScale

  blobSquishCtrl = animate(0, 1, {
    ...springConfig,
    onUpdate: (v: number) => {
      const intensity = Math.sin(v * Math.PI)
      const sy = 1 - compressY * intensity
      const sx = 1 + expandX * intensity
      const mirror = el.style.transform?.includes('scaleX(-1)') ? 'scaleX(-1) ' : ''
      el.style.transformOrigin = 'center top'
      el.style.transform = mirror + `scaleX(${sx}) scaleY(${sy})`
    },
    onComplete: () => {
      const right = el.style.transform?.includes('scaleX(-1)')
      el.style.transform = right ? 'scaleX(-1)' : ''
      el.style.transformOrigin = ''
    },
  })
}

// ─── Watchers ─────────────────────────────────────────────────────────────────

watch(
  [effectiveTitle, effectivePhase, isExpanded, showBody, effectiveDescription, effectiveAction],
  async () => {
    await nextTick()
    measure()
    setTimeout(measure, 100)
  },
  { flush: 'post' }
)

watch(dims, (newDims) => {
  if (!hasDims.value || collapsingRef) return

  const prev = { ...aDims }
  const target = { ...newDims }

  if (prev.bw <= 0) {
    aDims = target
    flush()
    return
  }

  if (morphTRef > 0 && morphTRef < 1) {
    aDims = target
    flush()
    return
  }

  if (showBody.value) {
    aDims = target
    flush()
    return
  }

  if (prev.bw === target.bw && prev.pw === target.pw && prev.th === target.th) return

  if (prefersReducedMotion.value) {
    aDims = target
    flush()
    return
  }

  pillResizeCtrl?.stop()

  if (Date.now() - collapseEndTime > 500 && !isExpanded.value) {
    triggerLandingSquish('expand')
  }

  const pillResizeTransition = useSpring.value
    ? { type: 'spring' as const, duration: 0.5, bounce: bounceVal.value * 0.875 }
    : { duration: 0.4, ease: SMOOTH_EASE }

  pillResizeCtrl = animate(0, 1, {
    ...pillResizeTransition,
    onUpdate: (t: number) => {
      aDims = {
        pw: prev.pw + (target.pw - prev.pw) * t,
        bw: prev.bw + (target.bw - prev.bw) * t,
        th: prev.th + (target.th - prev.th) * t,
      }
      flush()
    },
  })
}, { flush: 'post' })

watch(isExpanded, (expanded) => {
  if (expanded) {
    const delay = prefersReducedMotion.value ? 0 : 330
    const timer = setTimeout(() => { showBody.value = true }, delay)
    onWatcherCleanup(() => clearTimeout(timer))
    return
  }
  morphCtrl?.stop()
  pillResizeCtrl?.stop()


  if (morphTRef > 0) {
    const csPad = contentRef.value ? getComputedStyle(contentRef.value) : null
    const padX = csPad ? parseFloat(csPad.paddingLeft) + parseFloat(csPad.paddingRight) : 20
    const targetPw = headerRef.value ? headerRef.value.offsetWidth + padX : aDims.pw
    const targetDims = { pw: targetPw, bw: targetPw, th: PH }

    if (prefersReducedMotion.value) {
      morphTRef = 0
      collapsingRef = false
      preDismissRef = false
      showBody.value = false
      aDims = { ...targetDims }
      flush()
      return
    }

    const savedDims = expandedDimsRef.bw > 0 ? { ...expandedDimsRef } : { ...aDims }
    const isPreDismiss = preDismissRef
    const collapseTransition = (isPreDismiss || !useSpring.value)
      ? { duration: collapseDur, ease: SMOOTH_EASE }
      : { type: 'spring' as const, duration: collapseDur, bounce: bounceVal.value * 0.875 }

    triggerLandingSquish('collapse')

    morphCtrl = animate(morphTRef, 0, {
      ...collapseTransition,
      onUpdate: (t: number) => {
        morphTRef = t
        aDims = {
          pw: targetDims.pw + (savedDims.pw - targetDims.pw) * t,
          bw: targetDims.bw + (savedDims.bw - targetDims.bw) * t,
          th: targetDims.th + (savedDims.th - targetDims.th) * t,
        }
        flush()
      },
      onComplete: () => {
        morphTRef = 0
        collapsingRef = false
        preDismissRef = false
        collapseEndTime = Date.now()
        aDims = { ...targetDims }
        flush()
        showBody.value = false
      },
    })
    return
  }

  showBody.value = false
  morphTRef = 0
  flush()
}, { flush: 'post', immediate: true })

watch(showBody, (body) => {
  if (!prevShowBodyRef && body && !hoveredRef) {
    const t = setTimeout(() => triggerLandingSquish('expand'), 80)
    setTimeout(() => clearTimeout(t), 200)
  }
  prevShowBodyRef = body

  if (reExpandingRef) return

  if (!body) {
    morphTRef = 0
    morphCtrl?.stop()
    flush()
    return
  }

  if (prefersReducedMotion.value) {
    pillResizeCtrl?.stop()
    morphCtrl?.stop()
    morphTRef = 1
    aDims = { ...dimsRef }
    flush()
    syncSonnerHeights(wrapperRef.value)
    return
  }

  let raf: number
  raf = requestAnimationFrame(() => {
    pillResizeCtrl?.stop()
    morphCtrl?.stop()
    const startDims = { ...aDims }
    const morphExpandTransition = useSpring.value
      ? { type: 'spring' as const, duration: 0.9, bounce: bounceVal.value }
      : { duration: 0.6, ease: SMOOTH_EASE }

    morphCtrl = animate(0, 1, {
      ...morphExpandTransition,
      onUpdate: (t: number) => {
        morphTRef = t
        const target = dimsRef
        aDims = {
          pw: startDims.pw + (target.pw - startDims.pw) * t,
          bw: startDims.bw + (target.bw - startDims.bw) * t,
          th: startDims.th + (target.th - startDims.th) * t,
        }
        flush()
      },
      onComplete: () => {
        morphTRef = 1
        aDims = { ...dimsRef }
        flush()
        syncSonnerHeights(wrapperRef.value)
      },
    })
  })

  onWatcherCleanup(() => {
    cancelAnimationFrame(raf)
    morphCtrl?.stop()
  })
}, { flush: 'post' })

watch([showBody, dismissing, actionSuccess], ([body, dism, actSuccess]) => {
  if (!headerRef.value || prefersReducedMotion.value) return
  headerSquishCtrl?.stop()
  const el = headerRef.value

  if (body && !dism && !actSuccess) {
    if (!useSpring.value) return
    headerSquished = true
    headerSquishCtrl = animate(0, 1, {
      ...squishSpring(expandDur, DEFAULT_EXPAND_DUR, bounceVal.value),
      onUpdate: (v: number) => {
        const scale = 1 - 0.05 * v
        const pushY = v * 1
        el.style.transform = `scale(${scale}) translateY(${pushY}px)`
      },
    })
  } else if (headerSquished) {
    headerSquished = false
    const isSpringCollapse = !preDismissRef && useSpring.value
    const transition = isSpringCollapse
      ? squishSpring(collapseDur, DEFAULT_COLLAPSE_DUR, bounceVal.value)
      : { duration: collapseDur * 0.5, ease: SMOOTH_EASE }
    headerSquishCtrl = animate(1, 0, {
      ...transition,
      onUpdate: (v: number) => {
        const scale = 1 - 0.05 * v
        const pushY = v * 1
        el.style.transform = `scale(${scale}) translateY(${pushY}px)`
      },
      onComplete: () => { el.style.transform = '' },
    })
  }
}, { flush: 'post' })

let prevPhaseRef: GoeyToastPhase = props.phase
watch(() => props.phase, (phase) => {
  if (phase === 'error' && prevPhaseRef !== 'error' && !dismissing.value && wrapperRef.value && !prefersReducedMotion.value) {
    shakeCtrl?.stop()
    const el = wrapperRef.value
    const mirror = el.style.transform?.includes('scaleX(-1)') ? 'scaleX(-1) ' : ''
    shakeCtrl = animate(0, 1, {
      duration: 0.4,
      ease: 'easeOut',
      onUpdate: (v: number) => {
        const decay = 1 - v
        const shake = Math.sin(v * Math.PI * 6) * decay * 3
        el.style.transform = mirror + `translateX(${shake}px)`
      },
      onComplete: () => { el.style.transform = mirror.trim() || '' },
    })
  }
  prevPhaseRef = phase
})

watch([showBody, actionSuccess, dismissing, hovered], () => {
  if (!showBody.value || actionSuccess.value || dismissing.value) return
  if (hoveredRef) return

  const expandDelayMs = prefersReducedMotion.value ? 0 : 330
  const collapseMs = prefersReducedMotion.value ? 10 : 0.9 * 1000
  const displayMs = props.timing?.displayDuration ?? DEFAULT_DISPLAY_DURATION
  const fullDelay = displayMs - expandDelayMs - collapseMs
  if (fullDelay <= 0) return

  const delay = remainingRef ?? fullDelay
  timerStartRef = Date.now()

  const timer = setTimeout(() => {
    remainingRef = null
    expandedDimsRef = { ...aDims }
    collapsingRef = true
    preDismissRef = true
    dismissing.value = true
  }, delay)
  dismissTimerRef = timer

  onWatcherCleanup(() => {
    clearTimeout(timer)
    const elapsed = Date.now() - timerStartRef
    const remaining = delay - elapsed
    if (remaining > 0 && hoveredRef) {
      remainingRef = remaining
    }
  })
})

watch(hovered, (isHovered) => {
  if (!isHovered || !(hasDescription.value || hasAction.value) || !dismissing.value) return

  morphCtrl?.stop()
  collapsingRef = false
  preDismissRef = false
  remainingRef = null
  reExpandingRef = true
  dismissing.value = false
  showBody.value = true

  const currentT = morphTRef
  const startDims = { ...aDims }
  const morphExpandTransition = useSpring.value
    ? { type: 'spring' as const, duration: 0.9, bounce: bounceVal.value }
    : { duration: 0.6, ease: SMOOTH_EASE }

  requestAnimationFrame(() => {
    morphCtrl = animate(currentT, 1, {
      ...morphExpandTransition,
      onUpdate: (t: number) => {
        morphTRef = t
        const target = dimsRef
        aDims = {
          pw: startDims.pw + (target.pw - startDims.pw) * t,
          bw: startDims.bw + (target.bw - startDims.bw) * t,
          th: startDims.th + (target.th - startDims.th) * t,
        }
        flush()
      },
      onComplete: () => {
        morphTRef = 1
        aDims = { ...dimsRef }
        reExpandingRef = false
        flush()
        syncSonnerHeights(wrapperRef.value)
      },
    })
  })
})

watch([dismissing, showBody, hovered], () => {
  if (!props.toastId || !dismissing.value || showBody.value || hovered.value) return
  const t = setTimeout(() => {
    if (!hoveredRef) sonnerToast.dismiss(props.toastId)
  }, 800)
  onWatcherCleanup(() => clearTimeout(t))
})

watch([actionSuccess, showBody], () => {
  if (!props.toastId || !actionSuccess.value || showBody.value) return
  const t = setTimeout(() => sonnerToast.dismiss(props.toastId), 1200)
  onWatcherCleanup(() => clearTimeout(t))
})

// ─── Lifecycle ────────────────────────────────────────────────────────────────

let unregisterObserver: (() => void) | null = null
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  nextTick(() => {
    measure()
    setTimeout(measure, 100)
  })

  if (!isExpanded.value) {
    setTimeout(() => {
      if (!mountSquished) {
        mountSquished = true
        triggerLandingSquish()
      }
    }, 45)
  }

  if (contentRef.value) {
    resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(contentRef.value)
  }

  const wrapper = wrapperRef.value
  if (wrapper) {
    const ol = wrapper.closest('[data-sonner-toast]')?.parentElement
    if (ol) {
      unregisterObserver = registerSonnerObserver(ol, () => {
        syncSonnerHeights(wrapper)
      })
    }
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  unregisterObserver?.()
  morphCtrl?.stop()
  pillResizeCtrl?.stop()
  headerSquishCtrl?.stop()
  blobSquishCtrl?.stop()
  shakeCtrl?.stop()
  if (dismissTimerRef) clearTimeout(dismissTimerRef)
})

// ─── Action handler ───────────────────────────────────────────────────────────

function handleActionClick() {
  if (!effectiveAction.value) return
  if (effectiveAction.value.successLabel) {
    expandedDimsRef = { ...aDims }
    collapsingRef = true
    actionSuccess.value = effectiveAction.value.successLabel
  }
  try { effectiveAction.value.onClick() } catch { /* prevent blocking morph-back */ }
}

function onMouseEnter() {
  hoveredRef = true
  hovered.value = true
}

function onMouseLeave() {
  hoveredRef = false
  hovered.value = false
}

// ─── Computed CSS classes ─────────────────────────────────────────────────────

const wrapperClass = computed(() =>
  `${styles.wrapper}${props.classNames?.wrapper ? ` ${props.classNames.wrapper}` : ''}`
)
const wrapperStyle = computed(() => {
  if (isCenter.value) return { margin: '0 auto' }
  if (isRight.value) return { marginLeft: 'auto', transform: 'scaleX(-1)' }
  return undefined
})
const contentClass = computed(() =>
  `${styles.content} ${showBody.value ? styles.contentExpanded : styles.contentCompact}${props.classNames?.content ? ` ${props.classNames.content}` : ''}`
)
const contentStyle = computed(() => {
  if (isCenter.value) return { textAlign: 'center' as const }
  if (isRight.value) return { transform: 'scaleX(-1)', textAlign: 'right' as const }
  return { textAlign: 'left' as const }
})
const headerClass = computed(() =>
  `${styles.header} ${titleColorMap[effectivePhase.value]}${props.classNames?.header ? ` ${props.classNames.header}` : ''}`
)
const titleClass = computed(() =>
  `${styles.title}${props.classNames?.title ? ` ${props.classNames.title}` : ''}`
)
const iconWrapperClass = computed(() =>
  `${styles.iconWrapper}${props.classNames?.icon ? ` ${props.classNames.icon}` : ''}`
)
const descriptionClass = computed(() =>
  `${styles.description}${props.classNames?.description ? ` ${props.classNames.description}` : ''}`
)
const actionWrapperClass = computed(() =>
  `${styles.actionWrapper}${props.classNames?.actionWrapper ? ` ${props.classNames.actionWrapper}` : ''}`
)
const actionButtonClass = computed(() =>
  `${styles.actionButton} ${actionColorMap[effectivePhase.value]}${props.classNames?.actionButton ? ` ${props.classNames.actionButton}` : ''}`
)
const wrapperRole = computed(() => effectivePhase.value === 'error' ? 'alert' : 'status')
const wrapperAriaLive = computed(() => effectivePhase.value === 'error' ? 'assertive' : 'polite')
const iconKey = computed(() => isLoading.value ? 'spinner' : effectivePhase.value)
const descriptionIsString = computed(() => typeof effectiveDescription.value === 'string')
</script>

<template>
  <div
    ref="wrapperRef"
    :class="wrapperClass"
    :style="wrapperStyle"
    :role="wrapperRole"
    :aria-live="wrapperAriaLive"
    aria-atomic="true"
    :data-center="isCenter || undefined"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <!-- SVG background blob -->
    <svg class="goey-blobSvg" aria-hidden="true">
      <path
        ref="pathRef"
        :fill="fillColor"
        :stroke="borderColor || 'none'"
        :stroke-width="borderColor ? (borderWidth ?? 1.5) : 0"
      />
    </svg>

    <!-- Content -->
    <div ref="contentRef" :class="contentClass" :style="contentStyle">
      <!-- Header: icon + title -->
      <div ref="headerRef" :class="headerClass">
        <div :class="iconWrapperClass">
          <Transition name="goey-icon" mode="out-in">
            <span :key="iconKey" class="goey-iconInner">
              <template v-if="!actionSuccess && icon">
                <component :is="(icon as Component)" v-if="typeof icon === 'object' && !Array.isArray(icon)" />
                <span v-else>{{ icon }}</span>
              </template>
              <SpinnerIcon v-else-if="isLoading" :size="18" :class="styles.spinnerSpin" />
              <SuccessIcon v-else-if="effectivePhase === 'success'" :size="18" />
              <ErrorIcon v-else-if="effectivePhase === 'error'" :size="18" />
              <WarningIcon v-else-if="effectivePhase === 'warning'" :size="18" />
              <InfoIcon v-else-if="effectivePhase === 'info'" :size="18" />
              <DefaultIcon v-else :size="18" />
            </span>
          </Transition>
        </div>
        <span :class="titleClass">{{ effectiveTitle }}</span>
      </div>

      <!-- Description -->
      <Transition name="goey-fade">
        <div
          v-if="showBody && hasDescription && !dismissing"
          :class="descriptionClass"
          style="text-align: left"
        >
          <template v-if="descriptionIsString">{{ effectiveDescription }}</template>
          <component :is="(effectiveDescription as Component)" v-else />
        </div>
      </Transition>

      <!-- Action button -->
      <Transition name="goey-fade-delayed">
        <div
          v-if="showBody && hasAction && effectiveAction && !dismissing"
          :class="actionWrapperClass"
        >
          <button
            :class="actionButtonClass"
            type="button"
            :aria-label="effectiveAction.label"
            @click="handleActionClick"
          >
            {{ effectiveAction.label }}
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>
